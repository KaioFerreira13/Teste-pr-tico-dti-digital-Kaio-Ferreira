package com.dtidigital.fretesdrones.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.Clock;
import java.time.Instant;

@Component
public class DeliveryOperationsScheduler {

    private final DeliveryCompletionService deliveryCompletionService;
    private final DroneFlightBatteryService flightBatteryService;
    private final RouteCompletionService routeCompletionService;
    private final DroneChargingService chargingService;
    private final Clock clock;

    @Autowired
    public DeliveryOperationsScheduler(
            DeliveryCompletionService deliveryCompletionService,
            DroneFlightBatteryService flightBatteryService,
            RouteCompletionService routeCompletionService,
            DroneChargingService chargingService
    ) {
        this(
                deliveryCompletionService,
                flightBatteryService,
                routeCompletionService,
                chargingService,
                Clock.systemUTC()
        );
    }

    DeliveryOperationsScheduler(
            DeliveryCompletionService deliveryCompletionService,
            DroneFlightBatteryService flightBatteryService,
            RouteCompletionService routeCompletionService,
            DroneChargingService chargingService,
            Clock clock
    ) {
        this.deliveryCompletionService = deliveryCompletionService;
        this.flightBatteryService = flightBatteryService;
        this.routeCompletionService = routeCompletionService;
        this.chargingService = chargingService;
        this.clock = clock;
    }

    @Scheduled(fixedDelay = 1000)
    public void processOperations() {
        Instant now = clock.instant();
        flightBatteryService.updateInFlightBatteries(now);
        deliveryCompletionService.completeDueDeliveries(now);
        routeCompletionService.completeFinishedRoutes(now);
        chargingService.recharge(now);
    }
}
