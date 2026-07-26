package com.dtidigital.fretesdrones.service;

import com.dtidigital.fretesdrones.model.*;
import com.dtidigital.fretesdrones.repository.DroneRepository;
import com.dtidigital.fretesdrones.repository.EntregaRepository;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DeliveryDispatchPreparationService {

    private final EntregaRepository entregaRepository;
    private final DroneRepository droneRepository;
    private final HangarAccessService hangarAccessService;
    private final DeliveryManagementQueryService queryService;

    public DeliveryDispatchPreparationService(
            EntregaRepository entregaRepository,
            DroneRepository droneRepository,
            HangarAccessService hangarAccessService,
            DeliveryManagementQueryService queryService
    ) {
        this.entregaRepository = entregaRepository;
        this.droneRepository = droneRepository;
        this.hangarAccessService = hangarAccessService;
        this.queryService = queryService;
    }

    public void prepare(String hangarId, User user) {
        hangarAccessService.getOwned(hangarId, user);
        List<Drone> drones = queryService.findDrones(user, hangarId);
        List<Entrega> deliveries = queryService.findDeliveries(user, hangarId).stream()
                .filter(delivery -> delivery.getStatus() == null
                        || delivery.getStatus() == DeliveryStatus.AGUARDANDO_CONFIRMACAO
                        || delivery.getStatus() == DeliveryStatus.NA_FILA)
                .sorted(Comparator.comparing(
                        Entrega::getPriority,
                        Comparator.nullsFirst(Comparator.naturalOrder())
                ).reversed())
                .toList();
        Map<String, Double> loads = initializeLoads(drones);
        for (Entrega delivery : deliveries) {
            allocateDelivery(delivery, drones, loads);
            entregaRepository.save(delivery);
        }
        for (Drone drone : drones) {
            drone.setCurrentLoad(loads.get(drone.getId()));
            droneRepository.save(drone);
        }
    }

    private Map<String, Double> initializeLoads(List<Drone> drones) {
        Map<String, Double> loads = new HashMap<>();
        for (Drone drone : drones) {
            if (drone.getStatus() == null) drone.setStatus(DroneStatus.DISPONIVEL);
            loads.put(
                    drone.getId(),
                    drone.getCurrentLoad() == null ? 0.0 : drone.getCurrentLoad()
            );
        }
        return loads;
    }

    private void allocateDelivery(
            Entrega delivery,
            List<Drone> drones,
            Map<String, Double> loads
    ) {
        Drone best = findBestDrone(drones, loads, delivery);
        boolean fitsAnyDrone = drones.stream().anyMatch(drone ->
                drone.getMaxWeight() != null
                        && delivery.getWeight() != null
                        && delivery.getWeight() <= drone.getMaxWeight()
        );
        if (best == null) {
            delivery.setStatus(fitsAnyDrone ? DeliveryStatus.NA_FILA : DeliveryStatus.INVIAVEL);
            delivery.setDroneId(null);
            return;
        }
        loads.put(best.getId(), loads.get(best.getId()) + delivery.getWeight());
        delivery.setStatus(DeliveryStatus.EM_DESPACHO);
        delivery.setDroneId(best.getId());
        best.setStatus(DroneStatus.EM_DESPACHO);
    }

    private Drone findBestDrone(
            List<Drone> drones,
            Map<String, Double> loads,
            Entrega delivery
    ) {
        return drones.stream()
                .filter(drone -> drone.getStatus() == DroneStatus.DISPONIVEL)
                .filter(drone -> drone.getMaxWeight() != null && delivery.getWeight() != null)
                .filter(drone -> delivery.getWeight() <= drone.getMaxWeight())
                .filter(drone ->
                        loads.get(drone.getId()) + delivery.getWeight() <= drone.getMaxWeight()
                )
                .min(Comparator.comparingDouble(drone ->
                        drone.getMaxWeight() - loads.get(drone.getId()) - delivery.getWeight()
                ))
                .orElse(null);
    }
}

