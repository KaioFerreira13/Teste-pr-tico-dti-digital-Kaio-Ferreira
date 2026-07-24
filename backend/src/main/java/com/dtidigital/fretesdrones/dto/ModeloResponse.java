package com.dtidigital.fretesdrones.dto;

public class ModeloResponse {
    private String id;
    private String name;
    private Double autonomy;
    private Double maxWeight;
    private Double averageSpeed;

    public ModeloResponse(String id, String name, Double autonomy, Double maxWeight, Double averageSpeed) {
        this.id = id;
        this.name = name;
        this.autonomy = autonomy;
        this.maxWeight = maxWeight;
        this.averageSpeed = averageSpeed;
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
}
