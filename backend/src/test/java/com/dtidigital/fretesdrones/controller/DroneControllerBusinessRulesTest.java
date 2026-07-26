package com.dtidigital.fretesdrones.controller;

import com.dtidigital.fretesdrones.dto.BulkUnassignRequest;
import com.dtidigital.fretesdrones.dto.DroneStatusRequest;
import com.dtidigital.fretesdrones.mapper.DroneMapper;
import com.dtidigital.fretesdrones.model.Drone;
import com.dtidigital.fretesdrones.model.DroneStatus;
import com.dtidigital.fretesdrones.model.RouteStatus;
import com.dtidigital.fretesdrones.model.User;
import com.dtidigital.fretesdrones.repository.*;
import com.dtidigital.fretesdrones.security.AuthenticatedUserService;
import com.dtidigital.fretesdrones.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

class DroneControllerBusinessRulesTest {

    private DroneRepository droneRepository;
    private EntregaRepository entregaRepository;
    private DeliveryAllocationService allocationService;
    private DroneController controller;
    private Authentication authentication;

    @BeforeEach
    void setUp() {
        droneRepository = mock(DroneRepository.class);
        HangarRepository hangarRepository = mock(HangarRepository.class);
        ModeloRepository modeloRepository = mock(ModeloRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        entregaRepository = mock(EntregaRepository.class);
        allocationService = mock(DeliveryAllocationService.class);
        RoutePlanningService routePlanningService = mock(RoutePlanningService.class);
        DroneMapper mapper = new DroneMapper();
        DroneService droneService = new DroneService(
                droneRepository, hangarRepository, modeloRepository, allocationService, mapper
        );
        DroneOperationService operationService = new DroneOperationService(
                droneRepository, entregaRepository, hangarRepository,
                allocationService, routePlanningService, mapper
        );
        controller = new DroneController(
                droneService,
                operationService,
                new AuthenticatedUserService(userRepository)
        );
        authentication = mock(Authentication.class);
        when(authentication.getName()).thenReturn("user@test.com");
        when(userRepository.findByEmail("user@test.com"))
                .thenReturn(Optional.of(User.builder().id("u1").email("user@test.com").build()));
    }

    @Test
    void refusesManualStatusChangeWhileDroneIsDispatching() {
        Drone drone = drone("u1", DroneStatus.EM_DESPACHO);
        when(droneRepository.findById("d1")).thenReturn(Optional.of(drone));

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> controller.updateStatus("d1", new DroneStatusRequest("DISPONIVEL"), authentication)
        );

        assertEquals(
                "Somente drones disponiveis ou em manutencao podem ter o status alterado manualmente.",
                exception.getMessage()
        );
        verify(droneRepository, never()).save(drone);
    }

    @Test
    void refusesSettingAnAutomaticStatusManually() {
        Drone drone = drone("u1", DroneStatus.DISPONIVEL);
        when(droneRepository.findById("d1")).thenReturn(Optional.of(drone));

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> controller.updateStatus("d1", new DroneStatusRequest("RECARREGANDO"), authentication)
        );

        assertEquals(
                "O status manual deve ser DISPONIVEL ou EM_MANUTENCAO.",
                exception.getMessage()
        );
        verify(droneRepository, never()).save(drone);
    }

    @Test
    void allowsChangingFromMaintenanceToAvailable() {
        Drone drone = drone("u1", DroneStatus.EM_MANUTENCAO);
        when(droneRepository.findById("d1")).thenReturn(Optional.of(drone));

        controller.updateStatus("d1", new DroneStatusRequest("DISPONIVEL"), authentication);

        assertEquals(DroneStatus.DISPONIVEL, drone.getStatus());
        verify(droneRepository).save(drone);
        verify(allocationService).allocateConfirmed("u1", "h1");
    }

    @Test
    void refusesUnknownDroneStatus() {
        when(droneRepository.findById("d1"))
                .thenReturn(Optional.of(drone("u1", DroneStatus.DISPONIVEL)));

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> controller.updateStatus("d1", new DroneStatusRequest("VOANDO"), authentication)
        );

        assertEquals("Status de drone invalido.", exception.getMessage());
    }

    @Test
    void refusesChangingDroneOwnedByAnotherUser() {
        Drone drone = drone("other-user", DroneStatus.DISPONIVEL);
        when(droneRepository.findById("d1")).thenReturn(Optional.of(drone));

        assertThrows(
                AccessDeniedException.class,
                () -> controller.updateStatus("d1", new DroneStatusRequest("EM_MANUTENCAO"), authentication)
        );
        verify(droneRepository, never()).save(drone);
    }

    @Test
    void refusesStartingFreightWithoutPendingRoute() {
        when(droneRepository.findById("d1"))
                .thenReturn(Optional.of(drone("u1", DroneStatus.DISPONIVEL)));

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> controller.startFreight("d1", authentication)
        );

        assertEquals("O drone nao possui um frete aguardando inicio.", exception.getMessage());
    }

    @Test
    void refusesStartingRouteWhenBatteryCannotCoverIt() {
        Drone drone = drone("u1", DroneStatus.EM_DESPACHO);
        drone.setRouteStatus(RouteStatus.AGUARDANDO_INICIO);
        drone.setRouteDistance(50.0);
        drone.setAutonomy(100.0);
        drone.setAverageSpeed(50.0);
        drone.setBatteryLevel(40.0);
        when(droneRepository.findById("d1")).thenReturn(Optional.of(drone));

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> controller.startFreight("d1", authentication)
        );

        assertEquals("A bateria atual do drone nao e suficiente para concluir esta rota.", exception.getMessage());
        verify(droneRepository, never()).save(drone);
    }

    @Test
    void refusesBulkRemovalWithoutSelectedDeliveries() {
        when(droneRepository.findById("d1"))
                .thenReturn(Optional.of(drone("u1", DroneStatus.EM_DESPACHO)));

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> controller.unassignDeliveries(
                        "d1", new BulkUnassignRequest(List.of()), authentication
                )
        );

        assertEquals("Selecione ao menos uma entrega.", exception.getMessage());
        verify(entregaRepository, never()).save(any());
    }

    @Test
    void refusesResettingDroneOwnedByAnotherUser() {
        when(droneRepository.findById("d1"))
                .thenReturn(Optional.of(drone("other-user", DroneStatus.EM_ROTA)));

        assertThrows(
                AccessDeniedException.class,
                () -> controller.resetDrone("d1", authentication)
        );
        verify(allocationService, never()).allocateConfirmed("u1", "h1");
    }

    private Drone drone(String userId, DroneStatus status) {
        return Drone.builder()
                .id("d1")
                .userId(userId)
                .hangarId("h1")
                .status(status)
                .autonomy(100.0)
                .averageSpeed(50.0)
                .batteryLevel(100.0)
                .build();
    }
}
