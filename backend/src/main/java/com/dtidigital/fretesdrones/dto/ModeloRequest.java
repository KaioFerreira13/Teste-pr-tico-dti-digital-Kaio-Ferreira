package com.dtidigital.fretesdrones.dto;

public class ModeloRequest {
    private String name;
    private Double autonomy;
    private Double maxWeight;
    private Double averageSpeed;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Double getAutonomy() {
        return autonomy;
    }

    public void setAutonomy(Double autonomy) {
        this.autonomy = autonomy;
    }

    public Double getMaxWeight() {
        return maxWeight;
    }

    public void setMaxWeight(Double maxWeight) {
        this.maxWeight = maxWeight;
    }

    public Double getAverageSpeed() {
        return averageSpeed;
    }

    public void setAverageSpeed(Double averageSpeed) {
        this.averageSpeed = averageSpeed;
    }
}
