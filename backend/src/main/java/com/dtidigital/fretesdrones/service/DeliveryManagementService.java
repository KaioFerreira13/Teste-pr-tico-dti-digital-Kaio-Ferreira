package com.dtidigital.fretesdrones.service;

import com.dtidigital.fretesdrones.dto.DeliveryManagementResponse;
import com.dtidigital.fretesdrones.mapper.DeliveryMapper;
import com.dtidigital.fretesdrones.mapper.DroneMapper;
import com.dtidigital.fretesdrones.model.*;
import com.dtidigital.fretesdrones.repository.DroneRepository;
import com.dtidigital.fretesdrones.repository.EntregaRepository;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class DeliveryManagementService {

    private final EntregaRepository entregaRepository;
    private final DroneRepository droneRepository;
    private final HangarAccessService hangarAccessService;
    private final DeliveryAllocationService allocationService;
    private final DeliveryMapper deliveryMapper;
    private final DroneMapper droneMapper;

    public DeliveryManagementService(
            EntregaRepository entregaRepository,
            DroneRepository droneRepository,
            HangarAccessService hangarAccessService,
            DeliveryAllocationService allocationService,
            DeliveryMapper deliveryMapper,
            DroneMapper droneMapper
    ) {
        this.entregaRepository = entregaRepository;
        this.droneRepository = droneRepository;
        this.hangarAccessService = hangarAccessService;
        this.allocationService = allocationService;
        this.deliveryMapper = deliveryMapper;
        this.droneMapper = droneMapper;
    }

    public DeliveryManagementResponse getManagement(String hangarId, User user) {
        hangarAccessService.getOwned(hangarId, user);
        return buildManagement(hangarId, user);
    }

    public DeliveryManagementResponse prepareDispatch(String hangarId, User user) {
        hangarAccessService.getOwned(hangarId, user);
        List<Drone> drones = dronesAtHangar(user, hangarId);
        List<Entrega> deliveries = deliveriesAtHangar(user, hangarId).stream()
                .filter(delivery -> delivery.getStatus() == null
                        || delivery.getStatus() == DeliveryStatus.AGUARDANDO_CONFIRMACAO
                        || delivery.getStatus() == DeliveryStatus.NA_FILA)
                .sorted(Comparator.comparing(
                        Entrega::getPriority,
                        Comparator.nullsFirst(Comparator.naturalOrder())
                ).reversed())
                .toList();

        Map<String, Double> loads = new HashMap<>();
        for (Drone drone : drones) {
            if (drone.getStatus() == null) drone.setStatus(DroneStatus.DISPONIVEL);
            loads.put(drone.getId(), drone.getCurrentLoad() == null ? 0.0 : drone.getCurrentLoad());
        }
        for (Entrega delivery : deliveries) {
            Drone best = findBestDrone(drones, loads, delivery);
            boolean canEverFit = drones.stream().anyMatch(drone ->
                    drone.getMaxWeight() != null
                            && delivery.getWeight() != null
                            && delivery.getWeight() <= drone.getMaxWeight()
            );
            if (best == null) {
                delivery.setStatus(canEverFit ? DeliveryStatus.NA_FILA : DeliveryStatus.INVIAVEL);
                delivery.setDroneId(null);
            } else {
                loads.put(best.getId(), loads.get(best.getId()) + delivery.getWeight());
                delivery.setStatus(DeliveryStatus.EM_DESPACHO);
                delivery.setDroneId(best.getId());
                best.setStatus(DroneStatus.EM_DESPACHO);
            }
            entregaRepository.save(delivery);
        }
        for (Drone drone : drones) {
            drone.setCurrentLoad(loads.get(drone.getId()));
            droneRepository.save(drone);
        }
        return buildManagement(hangarId, user);
    }

    public DeliveryManagementResponse confirmDispatch(
            String hangarId,
            List<String> deliveryIds,
            User user
    ) {
        Hangar hangar = hangarAccessService.getOwned(hangarId, user);
        if (deliveryIds == null || deliveryIds.isEmpty()) {
            throw new IllegalArgumentException("Nenhuma entrega foi enviada para confirmacao.");
        }
        List<Drone> drones = dronesAtHangar(user, hangarId);
        if (hasUntreatedInviableDelivery(user, hangarId, hangar, drones)) {
            throw new IllegalArgumentException(
                    "Trate todas as entregas inviaveis antes de confirmar a movimentacao."
            );
        }
        for (String deliveryId : deliveryIds) {
            Entrega delivery = entregaRepository.findById(deliveryId).orElse(null);
            if (delivery == null
                    || !user.getId().equals(delivery.getUserId())
                    || !hangarId.equals(delivery.getHangarId())) {
                throw new IllegalArgumentException(
                        "Uma entrega informada nao pertence ao usuario ou ao hangar selecionado."
                );
            }
            if (delivery.getStatus() != null
                    && delivery.getStatus() != DeliveryStatus.AGUARDANDO_CONFIRMACAO
                    && delivery.getStatus() != DeliveryStatus.CONFIRMADA
                    && delivery.getStatus() != DeliveryStatus.NA_FILA) {
                throw new IllegalArgumentException(
                        "A entrega ja foi tratada e nao pode ser movimentada novamente."
                );
            }
            delivery.setStatus(DeliveryStatus.CONFIRMADA);
            delivery.setDroneId(null);
            entregaRepository.save(delivery);
        }
        allocationService.allocateConfirmed(user.getId(), hangarId);
        return buildManagement(hangarId, user);
    }

    public DeliveryManagementResponse clearQueue(String hangarId, User user) {
        hangarAccessService.getOwned(hangarId, user);
        deliveriesAtHangar(user, hangarId).stream()
                .filter(delivery -> delivery.getStatus() == DeliveryStatus.CONFIRMADA
                        || delivery.getStatus() == DeliveryStatus.NA_FILA)
                .forEach(delivery -> {
                    delivery.setStatus(DeliveryStatus.AGUARDANDO_CONFIRMACAO);
                    delivery.setDroneId(null);
                    entregaRepository.save(delivery);
                });
        return buildManagement(hangarId, user);
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
                .filter(drone -> loads.get(drone.getId()) + delivery.getWeight() <= drone.getMaxWeight())
                .min(Comparator.comparingDouble(drone ->
                        drone.getMaxWeight() - (loads.get(drone.getId()) + delivery.getWeight())
                ))
                .orElse(null);
    }

    private boolean hasUntreatedInviableDelivery(
            User user,
            String hangarId,
            Hangar hangar,
            List<Drone> drones
    ) {
        return deliveriesAtHangar(user, hangarId).stream()
                .filter(delivery -> delivery.getStatus() == null
                        || delivery.getStatus() == DeliveryStatus.AGUARDANDO_CONFIRMACAO
                        || delivery.getStatus() == DeliveryStatus.INVIAVEL)
                .anyMatch(delivery -> {
                    double distance = 2.0 * (
                            Math.abs(delivery.getDestinationX() - hangar.getPositionX())
                                    + Math.abs(delivery.getDestinationY() - hangar.getPositionY())
                    );
                    return drones.stream().noneMatch(drone ->
                            drone.getMaxWeight() != null
                                    && drone.getAutonomy() != null
                                    && delivery.getWeight() != null
                                    && delivery.getWeight() <= drone.getMaxWeight()
                                    && distance <= drone.getAutonomy()
                    );
                });
    }

    private DeliveryManagementResponse buildManagement(String hangarId, User user) {
        return new DeliveryManagementResponse(
                deliveriesAtHangar(user, hangarId).stream()
                        .map(deliveryMapper::toResponse)
                        .toList(),
                dronesAtHangar(user, hangarId).stream()
                        .map(droneMapper::toResponse)
                        .toList()
        );
    }

    private List<Entrega> deliveriesAtHangar(User user, String hangarId) {
        return entregaRepository.findByUserId(user.getId()).stream()
                .filter(delivery -> hangarId.equals(delivery.getHangarId()))
                .toList();
    }

    private List<Drone> dronesAtHangar(User user, String hangarId) {
        return droneRepository.findByUserId(user.getId()).stream()
                .filter(drone -> hangarId.equals(drone.getHangarId()))
                .toList();
    }
}

