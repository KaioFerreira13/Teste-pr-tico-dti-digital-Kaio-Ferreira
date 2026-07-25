package com.dtidigital.fretesdrones.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "entregas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Entrega {

    @Id
    private String id;
    private Double weight;
    private Integer destinationX;
    private Integer destinationY;
    private DeliveryPriority priority;
    private String recipientName;
    private String hangarId;
    private String userId;

    public Entrega(Double weight, Integer destinationX, Integer destinationY, DeliveryPriority priority, String recipientName, String hangarId, String userId) {
        this.weight = weight;
        this.destinationX = destinationX;
        this.destinationY = destinationY;
        this.priority = priority;
        this.recipientName = recipientName;
        this.hangarId = hangarId;
        this.userId = userId;
    }
}
