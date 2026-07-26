package com.dtidigital.fretesdrones.service;

import com.dtidigital.fretesdrones.model.Drone;
import com.dtidigital.fretesdrones.model.DroneStatus;
import com.dtidigital.fretesdrones.model.RouteStatus;
import com.dtidigital.fretesdrones.repository.DroneRepository;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.*;

class DroneFlightBatteryServiceTest {

    @Test
    void decreasesBatteryProportionallyToFlightProgress() {
        Instant now = Instant.parse("2026-07-25T20:00:00Z");
        Drone drone = Drone.builder()
                .status(DroneStatus.EM_ROTA)
                .routeStatus(RouteStatus.EM_ANDAMENTO)
                .routeStartedAt(now.minus(30, ChronoUnit.MINUTES))
                .routeEstimatedCompletionAt(now.plus(30, ChronoUnit.MINUTES))
                .routeDistance(20.0)
                .autonomy(100.0)
                .batteryLevel(100.0)
                .build();
        DroneRepository repository = mock(DroneRepository.class);
        when(repository.findAll()).thenReturn(List.of(drone));

        new DroneFlightBatteryService(repository).updateInFlightBatteries(now);

        assertTrue(drone.getBatteryLevel() < 90.1 && drone.getBatteryLevel() > 89.9);
        assertEquals(100.0, drone.getRouteStartingBatteryLevel());
        verify(repository).save(drone);
    }
}

