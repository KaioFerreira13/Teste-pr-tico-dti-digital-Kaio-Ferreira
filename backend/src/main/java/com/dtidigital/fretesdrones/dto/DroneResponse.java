package com.dtidigital.fretesdrones.dto;

public class DroneResponse {
    private String id;
    private String name;
    private Double autonomy;
    private Double maxWeight;
    private Double averageSpeed;
    private String hangarId;
    private String modelId;

    public DroneResponse(String id, String name, Double autonomy, Double maxWeight, Double averageSpeed, String hangarId, String modelId) {
        this.id = id;
        this.name = name;
        this.autonomy = autonomy;
        this.maxWeight = maxWeight;
        this.averageSpeed = averageSpeed;
        this.hangarId = hangarId;
        this.modelId = modelId;
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
}
