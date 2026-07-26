package com.dtidigital.fretesdrones.service;

import com.dtidigital.fretesdrones.model.DeliveryStatus;
import com.dtidigital.fretesdrones.model.Drone;
import com.dtidigital.fretesdrones.model.DroneStatus;
import com.dtidigital.fretesdrones.model.Entrega;
import com.dtidigital.fretesdrones.model.RouteStatus;
import com.dtidigital.fretesdrones.repository.DroneRepository;
import com.dtidigital.fretesdrones.repository.EntregaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DeliveryCompletionServiceTest {

    private DroneRepository droneRepository;
    private EntregaRepository entregaRepository;
    private RoutePlanningService routePlanningService;
    private DeliveryAllocationService allocationService;
    private DeliveryCompletionService service;

    @BeforeEach
    void setUp() {
        droneRepository = mock(DroneRepository.class);
        entregaRepository = mock(EntregaRepository.class);
        routePlanningService = mock(RoutePlanningService.class);
        allocationService = mock(DeliveryAllocationService.class);
        service = new DeliveryCompletionService(droneRepository, entregaRepository, routePlanningService, allocationService);
        when(entregaRepository.findAll()).thenReturn(List.of());
        when(droneRepository.findAll()).thenReturn(List.of());
    }

    @Test
    void completesDeliveriesWhoseEstimatedTimeHasPassed() {
        Entrega finished = Entrega.builder()
                .id("e1")
                .status(DeliveryStatus.EM_DESPACHO)
                .estimatedDeliveryAt(Instant.now().minusSeconds(1))
                .build();
        Entrega pending = Entrega.builder()
                .id("e2")
                .status(DeliveryStatus.EM_DESPACHO)
                .estimatedDeliveryAt(Instant.now().plusSeconds(60))
                .build();
        when(entregaRepository.findAll()).thenReturn(List.of(finished, pending));

        service.completeFinishedRoutes();

        assertEquals(DeliveryStatus.ENTREGUE, finished.getStatus());
        assertEquals(DeliveryStatus.EM_DESPACHO, pending.getStatus());
        verify(entregaRepository).save(finished);
        verify(entregaRepository, never()).save(pending);
    }

    @Test
    void decreasesBatteryProgressivelyWhileDroneIsInRoute() {
        Instant start = Instant.now().minus(30, ChronoUnit.MINUTES);
        Drone drone = inRouteDrone(start, start.plus(60, ChronoUnit.MINUTES));
        when(droneRepository.findAll()).thenReturn(List.of(drone));

        service.completeFinishedRoutes();

        assertTrue(drone.getBatteryLevel() < 90.1 && drone.getBatteryLevel() > 89.9);
        assertEquals(100.0, drone.getRouteStartingBatteryLevel());
        verify(droneRepository, atLeastOnce()).save(drone);
    }

    @Test
    void finishedRouteConsumesDistanceProportionAndStartsCharging() {
        Instant start = Instant.now().minus(61, ChronoUnit.MINUTES);
        Drone drone = inRouteDrone(start, start.plus(60, ChronoUnit.MINUTES));
        when(droneRepository.findAll()).thenReturn(List.of(drone));

        service.completeFinishedRoutes();

        assertEquals(80.0, drone.getBatteryLevel(), 0.01);
        assertEquals(DroneStatus.RECARREGANDO, drone.getStatus());
        assertEquals(0.0, drone.getCurrentLoad());
        assertNull(drone.getRouteStartingBatteryLevel());
        verify(routePlanningService).clear(drone);
        verify(allocationService, never()).allocateConfirmed("u1", "h1");
    }

    @Test
    void chargingDroneGainsThreePercentPerMinute() {
        Drone drone = chargingDrone(40.0, Instant.now().minus(10, ChronoUnit.MINUTES));
        when(droneRepository.findAll()).thenReturn(List.of(drone));

        service.completeFinishedRoutes();

        assertEquals(70.0, drone.getBatteryLevel(), 0.1);
        assertEquals(DroneStatus.RECARREGANDO, drone.getStatus());
        verify(allocationService, never()).allocateConfirmed("u1", "h1");
    }

    @Test
    void fullyChargedDroneBecomesAvailableAndTriggersAllocation() {
        Drone drone = chargingDrone(98.0, Instant.now().minus(1, ChronoUnit.MINUTES));
        when(droneRepository.findAll()).thenReturn(List.of(drone));

        service.completeFinishedRoutes();

        assertEquals(100.0, drone.getBatteryLevel());
        assertEquals(DroneStatus.DISPONIVEL, drone.getStatus());
        assertNull(drone.getChargingStartedAt());
        verify(allocationService).allocateConfirmed("u1", "h1");
    }

    @Test
    void chargingWithoutStartTimestampInitializesChargingClock() {
        Drone drone = chargingDrone(50.0, null);
        when(droneRepository.findAll()).thenReturn(List.of(drone));

        service.completeFinishedRoutes();

        assertEquals(50.0, drone.getBatteryLevel());
        assertTrue(drone.getChargingStartedAt() != null);
        verify(droneRepository).save(drone);
    }

    @Test
    void fullyChargedDroneWithoutStartTimestampBecomesAvailable() {
        Drone drone = chargingDrone(100.0, null);
        when(droneRepository.findAll()).thenReturn(List.of(drone));

        service.completeFinishedRoutes();

        assertEquals(DroneStatus.DISPONIVEL, drone.getStatus());
        assertEquals(100.0, drone.getBatteryLevel());
        assertNull(drone.getChargingStartedAt());
        verify(droneRepository).save(drone);
        verify(allocationService).allocateConfirmed("u1", "h1");
    }

    private Drone inRouteDrone(Instant startedAt, Instant completionAt) {
        return Drone.builder()
                .id("d1")
                .userId("u1")
                .hangarId("h1")
                .status(DroneStatus.EM_ROTA)
                .routeStatus(RouteStatus.EM_ANDAMENTO)
                .routeStartedAt(startedAt)
                .routeEstimatedCompletionAt(completionAt)
                .routeDistance(20.0)
                .autonomy(100.0)
                .batteryLevel(100.0)
                .routeStartingBatteryLevel(100.0)
                .currentLoad(5.0)
                .build();
    }

    private Drone chargingDrone(double battery, Instant chargingStartedAt) {
        return Drone.builder()
                .id("d1")
                .userId("u1")
                .hangarId("h1")
                .status(DroneStatus.RECARREGANDO)
                .batteryLevel(battery)
                .chargingStartedAt(chargingStartedAt)
                .build();
    }
}
