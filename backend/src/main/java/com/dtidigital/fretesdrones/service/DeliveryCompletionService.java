package com.dtidigital.fretesdrones.service;

import com.dtidigital.fretesdrones.model.DeliveryStatus;
import com.dtidigital.fretesdrones.repository.EntregaRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class DeliveryCompletionService {

    private final EntregaRepository entregaRepository;

    public DeliveryCompletionService(EntregaRepository entregaRepository) {
        this.entregaRepository = entregaRepository;
    }

    public void completeDueDeliveries(Instant now) {
        entregaRepository.findAll().stream()
                .filter(delivery -> delivery.getStatus() == DeliveryStatus.EM_DESPACHO)
                .filter(delivery -> delivery.getEstimatedDeliveryAt() != null)
                .filter(delivery -> !delivery.getEstimatedDeliveryAt().isAfter(now))
                .forEach(delivery -> {
                    delivery.setStatus(DeliveryStatus.ENTREGUE);
                    entregaRepository.save(delivery);
                });
    }
}

