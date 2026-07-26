package com.dtidigital.fretesdrones.service;

import com.dtidigital.fretesdrones.model.DeliveryStatus;
import com.dtidigital.fretesdrones.model.Drone;
import com.dtidigital.fretesdrones.model.DroneStatus;
import com.dtidigital.fretesdrones.model.RouteStatus;
import com.dtidigital.fretesdrones.repository.DroneRepository;
import com.dtidigital.fretesdrones.repository.EntregaRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.Duration;
import java.util.List;

@Service
public class DeliveryCompletionService {

    private final DroneRepository droneRepository;
    private final EntregaRepository entregaRepository;
    private final RoutePlanningService routePlanningService;
    private final DeliveryAllocationService allocationService;

    public DeliveryCompletionService(DroneRepository droneRepository, EntregaRepository entregaRepository, RoutePlanningService routePlanningService, DeliveryAllocationService allocationService) {
        this.droneRepository = droneRepository;
        this.entregaRepository = entregaRepository;
        this.routePlanningService = routePlanningService;
        this.allocationService = allocationService;
    }

    @Scheduled(fixedDelay = 1000)
    public void completeFinishedRoutes() {
        Instant now = Instant.now();
        updateBatteriesInRoute(now);
        entregaRepository.findAll().stream()
                .filter(delivery -> delivery.getStatus() == DeliveryStatus.EM_DESPACHO)
                .filter(delivery -> delivery.getEstimatedDeliveryAt() != null && !delivery.getEstimatedDeliveryAt().isAfter(now))
                .forEach(delivery -> {
                    delivery.setStatus(DeliveryStatus.ENTREGUE);
                    entregaRepository.save(delivery);
                });
        List<Drone> finishedDrones = droneRepository.findAll().stream()
                .filter(drone -> drone.getRouteStatus() == RouteStatus.EM_ANDAMENTO)
                .filter(drone -> drone.getRouteEstimatedCompletionAt() != null && !drone.getRouteEstimatedCompletionAt().isAfter(now))
                .toList();

        for (Drone drone : finishedDrones) {
            double batteryLevel = drone.getRouteStartingBatteryLevel() == null
                    ? (drone.getBatteryLevel() == null ? 100.0 : drone.getBatteryLevel())
                    : drone.getRouteStartingBatteryLevel();
            double consumedBattery = drone.getAutonomy() == null || drone.getAutonomy() <= 0
                    ? 100.0
                    : ((drone.getRouteDistance() == null ? 0.0 : drone.getRouteDistance()) / drone.getAutonomy()) * 100.0;
            drone.setBatteryLevel(Math.max(0.0, batteryLevel - consumedBattery));
            drone.setRouteStartingBatteryLevel(null);
            drone.setStatus(DroneStatus.RECARREGANDO);
            drone.setChargingStartedAt(now);
            drone.setCurrentLoad(0.0);
            routePlanningService.clear(drone);
        }

        List<Drone> chargingDrones = droneRepository.findAll().stream()
                .filter(drone -> drone.getStatus() == DroneStatus.RECARREGANDO)
                .toList();
        for (Drone drone : chargingDrones) {
            double currentBatteryLevel = drone.getBatteryLevel() == null
                    ? 0.0
                    : drone.getBatteryLevel();
            if (currentBatteryLevel >= 100.0) {
                makeAvailable(drone);
                continue;
            }
            if (drone.getChargingStartedAt() == null) {
                drone.setChargingStartedAt(now);
                droneRepository.save(drone);
                continue;
            }
            double elapsedMinutes = Duration.between(drone.getChargingStartedAt(), now).toMillis() / 60000.0;
            double batteryLevel = Math.min(100.0, currentBatteryLevel + elapsedMinutes * 3.0);
            drone.setBatteryLevel(batteryLevel);
            drone.setChargingStartedAt(now);
            if (batteryLevel >= 100.0) {
                makeAvailable(drone);
                continue;
            }
            droneRepository.save(drone);
        }
    }

    private void makeAvailable(Drone drone) {
        drone.setBatteryLevel(100.0);
        drone.setChargingStartedAt(null);
        drone.setStatus(DroneStatus.DISPONIVEL);
        droneRepository.save(drone);
        allocationService.allocateConfirmed(drone.getUserId(), drone.getHangarId());
    }

    private void updateBatteriesInRoute(Instant now) {
        droneRepository.findAll().stream()
                .filter(drone -> drone.getStatus() == DroneStatus.EM_ROTA)
                .filter(drone -> drone.getRouteStatus() == RouteStatus.EM_ANDAMENTO)
                .filter(drone -> drone.getRouteStartedAt() != null && drone.getRouteEstimatedCompletionAt() != null)
                .filter(drone -> drone.getRouteEstimatedCompletionAt().isAfter(now))
                .forEach(drone -> {
                    double startingBattery = drone.getRouteStartingBatteryLevel() == null
                            ? (drone.getBatteryLevel() == null ? 100.0 : drone.getBatteryLevel())
                            : drone.getRouteStartingBatteryLevel();
                    if (drone.getRouteStartingBatteryLevel() == null) {
                        drone.setRouteStartingBatteryLevel(startingBattery);
                    }
                    long totalMillis = Math.max(1L, Duration.between(drone.getRouteStartedAt(), drone.getRouteEstimatedCompletionAt()).toMillis());
                    long elapsedMillis = Math.max(0L, Duration.between(drone.getRouteStartedAt(), now).toMillis());
                    double progress = Math.min(1.0, (double) elapsedMillis / totalMillis);
                    double totalConsumption = drone.getAutonomy() == null || drone.getAutonomy() <= 0
                            ? 100.0
                            : ((drone.getRouteDistance() == null ? 0.0 : drone.getRouteDistance()) / drone.getAutonomy()) * 100.0;
                    drone.setBatteryLevel(Math.max(0.0, startingBattery - totalConsumption * progress));
                    droneRepository.save(drone);
                });
    }
}
