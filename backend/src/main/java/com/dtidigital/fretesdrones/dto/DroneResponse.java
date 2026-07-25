package com.dtidigital.fretesdrones.dto;

import com.dtidigital.fretesdrones.model.DroneStatus;

public class DroneResponse {
    private String id;
    private String name;
    private Double autonomy;
    private Double maxWeight;
    private Double averageSpeed;
    private String hangarId;
    private String modelId;
    private DroneStatus status;
    private Double currentLoad;

    public DroneResponse(String id, String name, Double autonomy, Double maxWeight, Double averageSpeed, String hangarId, String modelId, DroneStatus status, Double currentLoad) {
        this.id = id;
        this.name = name;
        this.autonomy = autonomy;
        this.maxWeight = maxWeight;
        this.averageSpeed = averageSpeed;
        this.hangarId = hangarId;
        this.modelId = modelId;
        this.status = status;
        this.currentLoad = currentLoad;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public Double getAutonomy() {
        return autonomy;
    }

    public Double getMaxWeight() {
        return maxWeight;
    }

    public Double getAverageSpeed() {
        return averageSpeed;
    }

    public String getHangarId() {
        return hangarId;
    }

    public String getModelId() {
        return modelId;
    }

    public DroneStatus getStatus() { return status; }
    public Double getCurrentLoad() { return currentLoad; }
}
