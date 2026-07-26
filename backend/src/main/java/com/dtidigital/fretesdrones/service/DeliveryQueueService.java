package com.dtidigital.fretesdrones.service;

import com.dtidigital.fretesdrones.model.DeliveryStatus;
import com.dtidigital.fretesdrones.model.User;
import com.dtidigital.fretesdrones.repository.EntregaRepository;
import org.springframework.stereotype.Service;

@Service
public class DeliveryQueueService {

    private final EntregaRepository entregaRepository;
    private final HangarAccessService hangarAccessService;
    private final DeliveryManagementQueryService queryService;

    public DeliveryQueueService(
            EntregaRepository entregaRepository,
            HangarAccessService hangarAccessService,
            DeliveryManagementQueryService queryService
    ) {
        this.entregaRepository = entregaRepository;
        this.hangarAccessService = hangarAccessService;
        this.queryService = queryService;
    }

    public void clear(String hangarId, User user) {
        hangarAccessService.getOwned(hangarId, user);
        queryService.findDeliveries(user, hangarId).stream()
                .filter(delivery -> delivery.getStatus() == DeliveryStatus.CONFIRMADA
                        || delivery.getStatus() == DeliveryStatus.NA_FILA)
                .forEach(delivery -> {
                    delivery.setStatus(DeliveryStatus.AGUARDANDO_CONFIRMACAO);
                    delivery.setDroneId(null);
                    entregaRepository.save(delivery);
                });
    }
}

