package com.dtidigital.fretesdrones.service;

import com.dtidigital.fretesdrones.dto.EntregaResponse;
import com.dtidigital.fretesdrones.mapper.DeliveryMapper;
import com.dtidigital.fretesdrones.model.*;
import com.dtidigital.fretesdrones.repository.DroneRepository;
import com.dtidigital.fretesdrones.repository.EntregaRepository;
import com.dtidigital.fretesdrones.repository.HangarRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DeliverySplitService {

    private final EntregaRepository entregaRepository;
    private final DroneRepository droneRepository;
    private final HangarRepository hangarRepository;
    private final DeliveryService deliveryService;
    private final DeliveryMapper deliveryMapper;

    public DeliverySplitService(
            EntregaRepository entregaRepository,
            DroneRepository droneRepository,
            HangarRepository hangarRepository,
            DeliveryService deliveryService,
            DeliveryMapper deliveryMapper
    ) {
        this.entregaRepository = entregaRepository;
        this.droneRepository = droneRepository;
        this.hangarRepository = hangarRepository;
        this.deliveryService = deliveryService;
        this.deliveryMapper = deliveryMapper;
    }

    public List<EntregaResponse> split(String id, List<Double> weights, User user) {
        Entrega original = deliveryService.getOwned(id, user);
        if (!isActuallyInviable(original, user)
                || !isTreatable(original)
                || weights == null
                || weights.size() < 2
                || weights.stream().anyMatch(weight -> weight == null || weight <= 0)) {
            throw new IllegalArgumentException(
                    "Informe pelo menos duas particoes com pesos positivos para uma entrega inviavel."
            );
        }
        double total = weights.stream().mapToDouble(Double::doubleValue).sum();
        if (Math.abs(total - original.getWeight()) > 0.000001) {
            throw new IllegalArgumentException(
                    "A soma das particoes deve ser igual ao peso total da entrega."
            );
        }
        int firstCode = deliveryService.nextCode();
        List<Entrega> partitions = weights.stream()
                .map(weight -> copyWithWeight(original, weight))
                .toList();
        for (int index = 0; index < partitions.size(); index++) {
            partitions.get(index).setCodigo(firstCode + index);
        }
        entregaRepository.delete(original);
        return partitions.stream()
                .map(entregaRepository::save)
                .map(deliveryMapper::toResponse)
                .toList();
    }

    private boolean isActuallyInviable(Entrega delivery, User user) {
        Hangar hangar = hangarRepository.findById(delivery.getHangarId()).orElse(null);
        double distance = hangar == null
                ? Double.POSITIVE_INFINITY
                : 2.0 * (
                Math.abs(delivery.getDestinationX() - hangar.getPositionX())
                        + Math.abs(delivery.getDestinationY() - hangar.getPositionY())
        );
        return droneRepository.findByUserId(user.getId()).stream()
                .filter(drone -> delivery.getHangarId().equals(drone.getHangarId()))
                .noneMatch(drone ->
                        drone.getMaxWeight() != null
                                && drone.getAutonomy() != null
                                && delivery.getWeight() != null
                                && delivery.getWeight() <= drone.getMaxWeight()
                                && distance <= drone.getAutonomy()
                );
    }

    private boolean isTreatable(Entrega delivery) {
        return delivery.getStatus() == null
                || delivery.getStatus() == DeliveryStatus.AGUARDANDO_CONFIRMACAO
                || delivery.getStatus() == DeliveryStatus.INVIAVEL;
    }

    private Entrega copyWithWeight(Entrega original, Double weight) {
        return new Entrega(
                weight,
                original.getDestinationX(),
                original.getDestinationY(),
                original.getPriority(),
                original.getRecipientName(),
                original.getHangarId(),
                original.getUserId()
        );
    }
}

