package com.dtidigital.fretesdrones.service;

import com.dtidigital.fretesdrones.model.*;
import com.dtidigital.fretesdrones.repository.EntregaRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DeliveryDispatchConfirmationService {

    private final EntregaRepository entregaRepository;
    private final HangarAccessService hangarAccessService;
    private final DeliveryManagementQueryService queryService;
    private final DeliveryViabilityService viabilityService;
    private final DeliveryAllocationService allocationService;

    public DeliveryDispatchConfirmationService(
            EntregaRepository entregaRepository,
            HangarAccessService hangarAccessService,
            DeliveryManagementQueryService queryService,
            DeliveryViabilityService viabilityService,
            DeliveryAllocationService allocationService
    ) {
        this.entregaRepository = entregaRepository;
        this.hangarAccessService = hangarAccessService;
        this.queryService = queryService;
        this.viabilityService = viabilityService;
        this.allocationService = allocationService;
    }

    public void confirm(String hangarId, List<String> deliveryIds, User user) {
        Hangar hangar = hangarAccessService.getOwned(hangarId, user);
        if (deliveryIds == null || deliveryIds.isEmpty()) {
            throw new IllegalArgumentException("Nenhuma entrega foi enviada para confirmacao.");
        }
        List<Drone> drones = queryService.findDrones(user, hangarId);
        boolean hasInviableDelivery = queryService.findDeliveries(user, hangarId).stream()
                .filter(delivery -> delivery.getStatus() == null
                        || delivery.getStatus() == DeliveryStatus.AGUARDANDO_CONFIRMACAO
                        || delivery.getStatus() == DeliveryStatus.INVIAVEL)
                .anyMatch(delivery ->
                        !viabilityService.canBeCompleted(delivery, drones, hangar)
                );
        if (hasInviableDelivery) {
            throw new IllegalArgumentException(
                    "Trate todas as entregas inviaveis antes de confirmar a movimentacao."
            );
        }
        deliveryIds.forEach(deliveryId ->
                confirmDelivery(deliveryId, hangarId, user)
        );
        allocationService.allocateConfirmed(user.getId(), hangarId);
    }

    private void confirmDelivery(String deliveryId, String hangarId, User user) {
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
        delivery.setInviabilityReason(null);
        delivery.setDroneId(null);
        entregaRepository.save(delivery);
    }
}
