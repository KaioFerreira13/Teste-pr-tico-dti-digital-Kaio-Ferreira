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
            drone.setStatus(DroneStatus.DISPONIVEL);
            drone.setCurrentLoad(0.0);
            routePlanningService.clear(drone);
            allocationService.allocateConfirmed(drone.getUserId(), drone.getHangarId());
        }
    }
}
