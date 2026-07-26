package com.dtidigital.fretesdrones.service;

import com.dtidigital.fretesdrones.model.Drone;
import com.dtidigital.fretesdrones.model.DroneStatus;
import com.dtidigital.fretesdrones.repository.DroneRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class DroneChargingServiceTest {

    private DroneRepository repository;
    private DeliveryAllocationService allocationService;
    private DroneChargingService service;
    private Instant now;

    @BeforeEach
    void setUp() {
        repository = mock(DroneRepository.class);
        allocationService = mock(DeliveryAllocationService.class);
        service = new DroneChargingService(repository, allocationService);
        now = Instant.parse("2026-07-25T20:00:00Z");
    }

    @Test
    void gainsThreePercentPerMinute() {
        Drone drone = chargingDrone(40.0, now.minus(10, ChronoUnit.MINUTES));
        when(repository.findAll()).thenReturn(List.of(drone));

        service.recharge(now);

        assertEquals(70.0, drone.getBatteryLevel(), 0.01);
        assertEquals(DroneStatus.RECARREGANDO, drone.getStatus());
        verify(allocationService, never()).allocateConfirmed("u1", "h1");
    }

    @Test
    void fullyChargedDroneBecomesAvailableAndTriggersAllocation() {
        Drone drone = chargingDrone(98.0, now.minus(1, ChronoUnit.MINUTES));
        when(repository.findAll()).thenReturn(List.of(drone));

        service.recharge(now);

        assertEquals(100.0, drone.getBatteryLevel());
        assertEquals(DroneStatus.DISPONIVEL, drone.getStatus());
        assertNull(drone.getChargingStartedAt());
        verify(allocationService).allocateConfirmed("u1", "h1");
    }

    @Test
    void missingChargingTimestampIsInitialized() {
        Drone drone = chargingDrone(50.0, null);
        when(repository.findAll()).thenReturn(List.of(drone));

        service.recharge(now);

        assertEquals(now, drone.getChargingStartedAt());
        assertEquals(50.0, drone.getBatteryLevel());
        verify(repository).save(drone);
    }

    @Test
    void fullBatteryWithoutTimestampStillBecomesAvailable() {
        Drone drone = chargingDrone(100.0, null);
        when(repository.findAll()).thenReturn(List.of(drone));

        service.recharge(now);

        assertEquals(DroneStatus.DISPONIVEL, drone.getStatus());
        assertNull(drone.getChargingStartedAt());
        verify(allocationService).allocateConfirmed("u1", "h1");
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

