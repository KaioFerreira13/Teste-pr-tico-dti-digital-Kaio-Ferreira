package com.dtidigital.fretesdrones.dto;

import com.dtidigital.fretesdrones.model.DeliveryPriority;
import com.dtidigital.fretesdrones.model.DeliveryStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EntregaResponse {
    private String id;
    private Double weight;
    private Integer destinationX;
    private Integer destinationY;
    private DeliveryPriority priority;
    private String recipientName;
    private String hangarId;
    private DeliveryStatus status;
    private String droneId;
}
