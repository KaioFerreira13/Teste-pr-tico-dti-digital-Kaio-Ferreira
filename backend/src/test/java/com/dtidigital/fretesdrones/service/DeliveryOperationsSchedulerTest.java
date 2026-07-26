package com.dtidigital.fretesdrones.service;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.mockito.Mockito.*;

class DeliveryOperationsSchedulerTest {

    @Test
    void coordinatesOperationsUsingTheSameReferenceTime() {
        DeliveryCompletionService deliveries = mock(DeliveryCompletionService.class);
        DroneFlightBatteryService flightBatteries = mock(DroneFlightBatteryService.class);
        RouteCompletionService routes = mock(RouteCompletionService.class);
        DroneChargingService charging = mock(DroneChargingService.class);
        Instant now = Instant.parse("2026-07-25T20:00:00Z");
        DeliveryOperationsScheduler scheduler = new DeliveryOperationsScheduler(
                deliveries,
                flightBatteries,
                routes,
                charging,
                Clock.fixed(now, ZoneOffset.UTC)
        );

        scheduler.processOperations();

        var ordered = inOrder(flightBatteries, deliveries, routes, charging);
        ordered.verify(flightBatteries).updateInFlightBatteries(now);
        ordered.verify(deliveries).completeDueDeliveries(now);
        ordered.verify(routes).completeFinishedRoutes(now);
        ordered.verify(charging).recharge(now);
    }
}

