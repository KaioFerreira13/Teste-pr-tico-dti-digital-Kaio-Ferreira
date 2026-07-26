package com.dtidigital.fretesdrones.service;

import com.dtidigital.fretesdrones.model.DroneStatus;
import com.dtidigital.fretesdrones.model.RouteStatus;
import com.dtidigital.fretesdrones.repository.DroneRepository;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;

@Service
public class DroneFlightBatteryService {

    private final DroneRepository droneRepository;

    public DroneFlightBatteryService(DroneRepository droneRepository) {
        this.droneRepository = droneRepository;
    }

    public void updateInFlightBatteries(Instant now) {
        droneRepository.findAll().stream()
                .filter(drone -> drone.getStatus() == DroneStatus.EM_ROTA)
                .filter(drone -> drone.getRouteStatus() == RouteStatus.EM_ANDAMENTO)
                .filter(drone -> drone.getRouteStartedAt() != null)
                .filter(drone -> drone.getRouteEstimatedCompletionAt() != null)
                .filter(drone -> drone.getRouteEstimatedCompletionAt().isAfter(now))
                .forEach(drone -> {
                    double startingBattery = drone.getRouteStartingBatteryLevel() == null
                            ? defaultBattery(drone.getBatteryLevel())
                            : drone.getRouteStartingBatteryLevel();
                    if (drone.getRouteStartingBatteryLevel() == null) {
                        drone.setRouteStartingBatteryLevel(startingBattery);
                    }
                    long totalMillis = Math.max(
                            1L,
                            Duration.between(
                                    drone.getRouteStartedAt(),
                                    drone.getRouteEstimatedCompletionAt()
                            ).toMillis()
                    );
                    long elapsedMillis = Math.max(
                            0L,
                            Duration.between(drone.getRouteStartedAt(), now).toMillis()
                    );
                    double progress = Math.min(1.0, (double) elapsedMillis / totalMillis);
                    double totalConsumption = calculateConsumptionPercentage(
                            drone.getRouteDistance(),
                            drone.getAutonomy()
                    );
                    drone.setBatteryLevel(
                            Math.max(0.0, startingBattery - totalConsumption * progress)
                    );
                    droneRepository.save(drone);
                });
    }

    static double calculateConsumptionPercentage(Double distance, Double autonomy) {
        if (autonomy == null || autonomy <= 0) return 100.0;
        return ((distance == null ? 0.0 : distance) / autonomy) * 100.0;
    }

    static double defaultBattery(Double batteryLevel) {
        return batteryLevel == null ? 100.0 : batteryLevel;
    }
}

