package com.dtidigital.fretesdrones.service;

import com.dtidigital.fretesdrones.model.DeliveryStatus;
import com.dtidigital.fretesdrones.model.Drone;
import com.dtidigital.fretesdrones.model.DroneStatus;
import com.dtidigital.fretesdrones.model.Entrega;
import com.dtidigital.fretesdrones.repository.DroneRepository;
import com.dtidigital.fretesdrones.repository.EntregaRepository;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class DeliveryAllocationService {

    private final DroneRepository droneRepository;
    private final EntregaRepository entregaRepository;
    private final RoutePlanningService routePlanningService;

    public DeliveryAllocationService(DroneRepository droneRepository, EntregaRepository entregaRepository, RoutePlanningService routePlanningService) {
        this.droneRepository = droneRepository;
        this.entregaRepository = entregaRepository;
        this.routePlanningService = routePlanningService;
    }

    public void allocateConfirmed(String userId, String hangarId) {
        List<Drone> availableDrones = droneRepository.findByUserId(userId).stream()
                .filter(drone -> hangarId.equals(drone.getHangarId()))
                .filter(drone -> drone.getStatus() == null || drone.getStatus() == DroneStatus.DISPONIVEL)
                .toList();
        List<Entrega> queue = entregaRepository.findByUserId(userId).stream()
                .filter(delivery -> hangarId.equals(delivery.getHangarId()))
                .filter(delivery -> delivery.getStatus() == DeliveryStatus.CONFIRMADA || delivery.getStatus() == DeliveryStatus.NA_FILA)
                .sorted(Comparator.comparing(Entrega::getPriority, Comparator.nullsFirst(Comparator.naturalOrder())).reversed())
                .toList();

        Map<String, Double> loads = new HashMap<>();
        availableDrones.forEach(drone -> loads.put(drone.getId(), drone.getCurrentLoad() == null ? 0.0 : drone.getCurrentLoad()));
        Set<String> assignedDroneIds = new HashSet<>();

        for (Entrega delivery : queue) {
            Drone idleBest = bestFit(availableDrones, assignedDroneIds, loads, delivery, false);
            Drone assignedBest = bestFit(availableDrones, assignedDroneIds, loads, delivery, true);
            Drone best = idleBest != null ? idleBest : assignedBest;
            if (best == null) {
                if (delivery.getStatus() == DeliveryStatus.NA_FILA) {
                    delivery.setStatus(DeliveryStatus.CONFIRMADA);
                    entregaRepository.save(delivery);
                }
                continue;
            }

            loads.put(best.getId(), loads.get(best.getId()) + delivery.getWeight());
            assignedDroneIds.add(best.getId());
            delivery.setStatus(DeliveryStatus.EM_DESPACHO);
            delivery.setDroneId(best.getId());
            entregaRepository.save(delivery);
        }

        for (Drone drone : availableDrones) {
            if (!assignedDroneIds.contains(drone.getId())) continue;
            drone.setCurrentLoad(loads.get(drone.getId()));
            drone.setStatus(DroneStatus.EM_DESPACHO);
            droneRepository.save(drone);
            List<Entrega> assignedDeliveries = entregaRepository.findByUserId(userId).stream()
                    .filter(delivery -> drone.getId().equals(delivery.getDroneId()))
                    .filter(delivery -> delivery.getStatus() == DeliveryStatus.EM_DESPACHO)
                    .toList();
            routePlanningService.plan(drone, assignedDeliveries);
        }
    }

    private Drone bestFit(List<Drone> drones, Set<String> assignedIds, Map<String, Double> loads, Entrega delivery, boolean assigned) {
        return drones.stream()
                .filter(drone -> assignedIds.contains(drone.getId()) == assigned)
                .filter(drone -> drone.getMaxWeight() != null && delivery.getWeight() != null)
                .filter(drone -> loads.get(drone.getId()) + delivery.getWeight() <= drone.getMaxWeight())
                .min(Comparator.comparingDouble(drone -> drone.getMaxWeight() - loads.get(drone.getId()) - delivery.getWeight()))
                .orElse(null);
    }
}
