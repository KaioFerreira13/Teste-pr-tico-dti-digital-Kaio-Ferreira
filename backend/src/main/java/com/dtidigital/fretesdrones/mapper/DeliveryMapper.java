package com.dtidigital.fretesdrones.mapper;

import com.dtidigital.fretesdrones.dto.EntregaResponse;
import com.dtidigital.fretesdrones.model.DeliveryStatus;
import com.dtidigital.fretesdrones.model.Entrega;
import org.springframework.stereotype.Component;

@Component
public class DeliveryMapper {

    public EntregaResponse toResponse(Entrega delivery) {
        return new EntregaResponse(
                delivery.getId(),
                delivery.getCodigo(),
                delivery.getWeight(),
                delivery.getDestinationX(),
                delivery.getDestinationY(),
                delivery.getPriority(),
                delivery.getRecipientName(),
                delivery.getHangarId(),
                delivery.getStatus() == null
                        ? DeliveryStatus.AGUARDANDO_CONFIRMACAO
                        : delivery.getStatus(),
                delivery.getDroneId(),
                delivery.getEstimatedDeliveryAt()
        );
    }
}

