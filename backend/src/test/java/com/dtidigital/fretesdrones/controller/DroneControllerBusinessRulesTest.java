package com.dtidigital.fretesdrones.controller;

import com.dtidigital.fretesdrones.model.Drone;
import com.dtidigital.fretesdrones.model.DroneStatus;
import com.dtidigital.fretesdrones.model.RouteStatus;
import com.dtidigital.fretesdrones.model.User;
import com.dtidigital.fretesdrones.repository.DroneRepository;
import com.dtidigital.fretesdrones.repository.EntregaRepository;
import com.dtidigital.fretesdrones.repository.HangarRepository;
import com.dtidigital.fretesdrones.repository.ModeloRepository;
import com.dtidigital.fretesdrones.repository.UserRepository;
import com.dtidigital.fretesdrones.service.DeliveryAllocationService;
import com.dtidigital.fretesdrones.service.RoutePlanningService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DroneControllerBusinessRulesTest {

    private DroneRepository droneRepository;
    private HangarRepository hangarRepository;
    private EntregaRepository entregaRepository;
    private DeliveryAllocationService allocationService;
    private DroneController controller;
    private Authentication authentication;

    @BeforeEach
    void setUp() {
        droneRepository = mock(DroneRepository.class);
        hangarRepository = mock(HangarRepository.class);
        ModeloRepository modeloRepository = mock(ModeloRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        entregaRepository = mock(EntregaRepository.class);
        allocationService = mock(DeliveryAllocationService.class);
        RoutePlanningService routePlanningService = mock(RoutePlanningService.class);
        controller = new DroneController(
                droneRepository, hangarRepository, modeloRepository, userRepository,
                entregaRepository, allocationService, routePlanningService
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

        ResponseEntity<?> response = controller.updateStatus(
                "d1", new DroneController.StatusRequest("DISPONIVEL"), authentication
        );

        assertEquals(400, response.getStatusCode().value());
        assertEquals("O status de um drone em despacho nao pode ser alterado manualmente.", response.getBody());
        verify(droneRepository, never()).save(drone);
    }

    @Test
    void refusesUnknownDroneStatus() {
        Drone drone = drone("u1", DroneStatus.DISPONIVEL);
        when(droneRepository.findById("d1")).thenReturn(Optional.of(drone));

        ResponseEntity<?> response = controller.updateStatus(
                "d1", new DroneController.StatusRequest("VOANDO"), authentication
        );

        assertEquals(400, response.getStatusCode().value());
        assertEquals("Status de drone invalido.", response.getBody());
    }

    @Test
    void refusesChangingDroneOwnedByAnotherUser() {
        Drone drone = drone("other-user", DroneStatus.DISPONIVEL);
        when(droneRepository.findById("d1")).thenReturn(Optional.of(drone));

        ResponseEntity<?> response = controller.updateStatus(
                "d1", new DroneController.StatusRequest("EM_MANUTENCAO"), authentication
        );

        assertEquals(403, response.getStatusCode().value());
        verify(droneRepository, never()).save(drone);
    }

    @Test
    void refusesStartingFreightWithoutPendingRoute() {
        Drone drone = drone("u1", DroneStatus.DISPONIVEL);
        when(droneRepository.findById("d1")).thenReturn(Optional.of(drone));

        ResponseEntity<?> response = controller.startFreight("d1", authentication);

        assertEquals(400, response.getStatusCode().value());
        assertEquals("O drone nao possui um frete aguardando inicio.", response.getBody());
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

        ResponseEntity<?> response = controller.startFreight("d1", authentication);

        assertEquals(400, response.getStatusCode().value());
        assertEquals("A bateria atual do drone nao e suficiente para concluir esta rota.", response.getBody());
        verify(droneRepository, never()).save(drone);
    }

    @Test
    void refusesStartingFreightWithoutValidSpeedOrDistance() {
        Drone drone = drone("u1", DroneStatus.EM_DESPACHO);
        drone.setRouteStatus(RouteStatus.AGUARDANDO_INICIO);
        drone.setRouteDistance(null);
        drone.setAverageSpeed(0.0);
        when(droneRepository.findById("d1")).thenReturn(Optional.of(drone));

        ResponseEntity<?> response = controller.startFreight("d1", authentication);

        assertEquals(400, response.getStatusCode().value());
        assertEquals("Nao foi possivel calcular o tempo deste frete.", response.getBody());
    }

    @Test
    void refusesBulkRemovalWithoutSelectedDeliveries() {
        Drone drone = drone("u1", DroneStatus.EM_DESPACHO);
        when(droneRepository.findById("d1")).thenReturn(Optional.of(drone));

        ResponseEntity<?> response = controller.unassignDeliveries(
                "d1", new DroneController.BulkUnassignRequest(List.of()), authentication
        );

        assertEquals(400, response.getStatusCode().value());
        assertEquals("Selecione ao menos uma entrega.", response.getBody());
        verify(entregaRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void refusesResettingDroneOwnedByAnotherUser() {
        Drone drone = drone("other-user", DroneStatus.EM_ROTA);
        when(droneRepository.findById("d1")).thenReturn(Optional.of(drone));

        ResponseEntity<?> response = controller.resetDrone("d1", authentication);

        assertEquals(403, response.getStatusCode().value());
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
