package com.dtidigital.fretesdrones.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.List;

@Document(collection = "drones")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Drone {

    @Id
    private String id;
    private String name;
    private Double autonomy;
    private Double maxWeight;
    private Double averageSpeed;
    private String hangarId;
    private String modelId;
    private String userId;
    private DroneStatus status;
    private Double currentLoad;
    private List<String> routeDeliveryIds;
    private Double routeDistance;
    private RouteStatus routeStatus;

    public Drone(String name, Double autonomy, Double maxWeight, Double averageSpeed, String hangarId, String modelId, String userId) {
        this.name = name;
        this.autonomy = autonomy;
        this.maxWeight = maxWeight;
        this.averageSpeed = averageSpeed;
        this.hangarId = hangarId;
        this.modelId = modelId;
        this.userId = userId;
        this.status = DroneStatus.DISPONIVEL;
        this.currentLoad = 0.0;
    }
}
