package com.dtidigital.fretesdrones.service;

import com.dtidigital.fretesdrones.dto.DroneResponse;
import com.dtidigital.fretesdrones.mapper.DroneMapper;
import com.dtidigital.fretesdrones.model.*;
import com.dtidigital.fretesdrones.repository.DroneRepository;
import com.dtidigital.fretesdrones.repository.EntregaRepository;
import com.dtidigital.fretesdrones.repository.HangarRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class DroneOperationService {

    private final DroneRepository droneRepository;
    private final EntregaRepository entregaRepository;
    private final HangarRepository hangarRepository;
    private final DeliveryAllocationService allocationService;
    private final RoutePlanningService routePlanningService;
    private final DroneMapper droneMapper;

    public DroneOperationService(
            DroneRepository droneRepository,
            EntregaRepository entregaRepository,
            HangarRepository hangarRepository,
            DeliveryAllocationService allocationService,
            RoutePlanningService routePlanningService,
            DroneMapper droneMapper
    ) {
        this.droneRepository = droneRepository;
        this.entregaRepository = entregaRepository;
        this.hangarRepository = hangarRepository;
        this.allocationService = allocationService;
        this.routePlanningService = routePlanningService;
        this.droneMapper = droneMapper;
    }

    public void unassignDelivery(String droneId, String deliveryId, User user) {
        Drone drone = getOwnedDrone(droneId, user, "Entrega ou drone invalido para esta operacao.");
        Entrega delivery = entregaRepository.findById(deliveryId)
                .orElseThrow(() -> new NoSuchElementException("Entrega nao encontrada."));
        if (!user.getId().equals(delivery.getUserId()) || !droneId.equals(delivery.getDroneId())) {
            throw new AccessDeniedException("Entrega ou drone invalido para esta operacao.");
        }
        releaseDeliveries(drone, List.of(delivery), user);
    }

    public void unassignDeliveries(String droneId, List<String> deliveryIds, User user) {
        Drone drone = getOwnedDrone(droneId, user, "Voce nao pode alterar este drone.");
        if (deliveryIds == null || deliveryIds.isEmpty()) {
            throw new IllegalArgumentException("Selecione ao menos uma entrega.");
        }
        List<Entrega> selected = deliveryIds.stream()
                .map(entregaRepository::findById)
                .filter(java.util.Optional::isPresent)
                .map(java.util.Optional::get)
                .toList();
        boolean invalid = selected.size() != deliveryIds.size()
                || selected.stream().anyMatch(delivery ->
                !user.getId().equals(delivery.getUserId()) || !droneId.equals(delivery.getDroneId()));
        if (invalid) {
            throw new IllegalArgumentException("A selecao contem uma entrega que nao pertence a este drone.");
        }
        releaseDeliveries(drone, selected, user);
    }

    public DroneResponse startFreight(String id, User user) {
        Drone drone = getOwnedDrone(id, user, "Voce nao pode alterar este drone.");
        if (drone.getStatus() != DroneStatus.EM_DESPACHO || drone.getRouteStatus() != RouteStatus.AGUARDANDO_INICIO) {
            throw new IllegalArgumentException("O drone nao possui um frete aguardando inicio.");
        }
        if (drone.getRouteDistance() == null || drone.getAverageSpeed() == null || drone.getAverageSpeed() <= 0) {
            throw new IllegalArgumentException("Nao foi possivel calcular o tempo deste frete.");
        }
        double batteryLevel = drone.getBatteryLevel() == null ? 100.0 : drone.getBatteryLevel();
        double requiredBattery = (drone.getRouteDistance() / drone.getAutonomy()) * 100.0;
        if (requiredBattery > batteryLevel + 0.0001) {
            throw new IllegalArgumentException("A bateria atual do drone nao e suficiente para concluir esta rota.");
        }
        Hangar hangar = hangarRepository.findById(drone.getHangarId())
                .orElseThrow(() -> new IllegalArgumentException("Hangar do drone nao encontrado."));
        Instant startedAt = Instant.now();
        updateDeliveryEstimates(drone, hangar, startedAt);
        long durationSeconds = Math.max(
                1L,
                (long) Math.ceil((drone.getRouteDistance() / drone.getAverageSpeed()) * 3600.0)
        );
        drone.setStatus(DroneStatus.EM_ROTA);
        drone.setRouteStatus(RouteStatus.EM_ANDAMENTO);
        drone.setRouteStartedAt(startedAt);
        drone.setRouteEstimatedCompletionAt(startedAt.plus(durationSeconds, ChronoUnit.SECONDS));
        drone.setRouteStartingBatteryLevel(batteryLevel);
        return droneMapper.toResponse(droneRepository.save(drone));
    }

    public DroneResponse reset(String id, User user) {
        Drone drone = getOwnedDrone(id, user, "Voce nao pode resetar este drone.");
        entregaRepository.findByUserId(user.getId()).stream()
                .filter(delivery -> id.equals(delivery.getDroneId()))
                .forEach(this::releaseDelivery);
        drone.setStatus(DroneStatus.DISPONIVEL);
        drone.setBatteryLevel(100.0);
        drone.setChargingStartedAt(null);
        drone.setRouteStartingBatteryLevel(null);
        drone.setCurrentLoad(0.0);
        routePlanningService.clear(drone);
        return droneMapper.toResponse(droneRepository.findById(id).orElse(drone));
    }

    private void releaseDeliveries(Drone drone, List<Entrega> deliveries, User user) {
        deliveries.forEach(this::releaseDelivery);
        List<Entrega> remaining = entregaRepository.findByUserId(user.getId()).stream()
                .filter(delivery -> drone.getId().equals(delivery.getDroneId()))
                .filter(delivery -> delivery.getStatus() == DeliveryStatus.EM_DESPACHO)
                .toList();
        double load = remaining.stream()
                .mapToDouble(delivery -> delivery.getWeight() == null ? 0.0 : delivery.getWeight())
                .sum();
        drone.setCurrentLoad(load);
        if (remaining.isEmpty()) {
            if (drone.getStatus() == DroneStatus.EM_DESPACHO) {
                drone.setStatus(DroneStatus.DISPONIVEL);
            }
            routePlanningService.clear(drone);
        } else {
            droneRepository.save(drone);
            routePlanningService.plan(drone, remaining);
        }
        if (drone.getStatus() == DroneStatus.DISPONIVEL) {
            allocationService.allocateConfirmed(user.getId(), drone.getHangarId());
        }
    }

    private void releaseDelivery(Entrega delivery) {
        delivery.setDroneId(null);
        delivery.setStatus(DeliveryStatus.AGUARDANDO_CONFIRMACAO);
        delivery.setEstimatedDeliveryAt(null);
        entregaRepository.save(delivery);
    }

    private void updateDeliveryEstimates(Drone drone, Hangar hangar, Instant startedAt) {
        int currentX = hangar.getPositionX();
        int currentY = hangar.getPositionY();
        double accumulatedDistance = 0.0;
        for (String deliveryId : drone.getRouteDeliveryIds()) {
            Entrega delivery = entregaRepository.findById(deliveryId).orElse(null);
            if (delivery == null) continue;
            accumulatedDistance += Math.abs(delivery.getDestinationX() - currentX)
                    + Math.abs(delivery.getDestinationY() - currentY);
            long deliverySeconds = Math.max(
                    1L,
                    (long) Math.ceil((accumulatedDistance / drone.getAverageSpeed()) * 3600.0)
            );
            delivery.setEstimatedDeliveryAt(startedAt.plus(deliverySeconds, ChronoUnit.SECONDS));
            entregaRepository.save(delivery);
            currentX = delivery.getDestinationX();
            currentY = delivery.getDestinationY();
        }
    }

    private Drone getOwnedDrone(String id, User user, String forbiddenMessage) {
        Drone drone = droneRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Drone nao encontrado."));
        if (!user.getId().equals(drone.getUserId())) {
            throw new AccessDeniedException(forbiddenMessage);
        }
        return drone;
    }
}

