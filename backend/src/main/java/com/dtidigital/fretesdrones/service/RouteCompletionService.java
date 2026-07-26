package com.dtidigital.fretesdrones.service;

import com.dtidigital.fretesdrones.model.DroneStatus;
import com.dtidigital.fretesdrones.model.RouteStatus;
import com.dtidigital.fretesdrones.repository.DroneRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class RouteCompletionService {

    private final DroneRepository droneRepository;
    private final RoutePlanningService routePlanningService;

    public RouteCompletionService(
            DroneRepository droneRepository,
            RoutePlanningService routePlanningService
    ) {
        this.droneRepository = droneRepository;
        this.routePlanningService = routePlanningService;
    }

    public void completeFinishedRoutes(Instant now) {
        droneRepository.findAll().stream()
                .filter(drone -> drone.getRouteStatus() == RouteStatus.EM_ANDAMENTO)
                .filter(drone -> drone.getRouteEstimatedCompletionAt() != null)
                .filter(drone -> !drone.getRouteEstimatedCompletionAt().isAfter(now))
                .forEach(drone -> {
                    double startingBattery = drone.getRouteStartingBatteryLevel() == null
                            ? DroneFlightBatteryService.defaultBattery(drone.getBatteryLevel())
                            : drone.getRouteStartingBatteryLevel();
                    double consumedBattery =
                            DroneFlightBatteryService.calculateConsumptionPercentage(
                                    drone.getRouteDistance(),
                                    drone.getAutonomy()
                            );
                    drone.setBatteryLevel(Math.max(0.0, startingBattery - consumedBattery));
                    drone.setRouteStartingBatteryLevel(null);
                    drone.setStatus(DroneStatus.RECARREGANDO);
                    drone.setChargingStartedAt(now);
                    drone.setCurrentLoad(0.0);
                    routePlanningService.clear(drone);
                });
    }
}

