package com.dtidigital.fretesdrones.service;

import com.dtidigital.fretesdrones.model.Drone;
import com.dtidigital.fretesdrones.model.DroneStatus;
import com.dtidigital.fretesdrones.model.RouteStatus;
import com.dtidigital.fretesdrones.repository.DroneRepository;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class RouteCompletionServiceTest {

    @Test
    void finishedRouteConsumesBatteryAndStartsCharging() {
        Instant now = Instant.parse("2026-07-25T20:00:00Z");
        Drone drone = Drone.builder()
                .userId("u1")
                .hangarId("h1")
                .routeStatus(RouteStatus.EM_ANDAMENTO)
                .routeEstimatedCompletionAt(now.minusSeconds(1))
                .routeDistance(20.0)
                .autonomy(100.0)
                .routeStartingBatteryLevel(100.0)
                .currentLoad(5.0)
                .build();
        DroneRepository repository = mock(DroneRepository.class);
        RoutePlanningService routePlanningService = mock(RoutePlanningService.class);
        when(repository.findAll()).thenReturn(List.of(drone));

        new RouteCompletionService(repository, routePlanningService)
                .completeFinishedRoutes(now);

        assertEquals(80.0, drone.getBatteryLevel(), 0.01);
        assertEquals(DroneStatus.RECARREGANDO, drone.getStatus());
        assertEquals(now, drone.getChargingStartedAt());
        assertEquals(0.0, drone.getCurrentLoad());
        assertNull(drone.getRouteStartingBatteryLevel());
        verify(routePlanningService).clear(drone);
    }
}

