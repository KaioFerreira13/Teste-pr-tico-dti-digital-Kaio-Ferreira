package com.dtidigital.fretesdrones.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "modelos")
public class Modelo {

    @Id
    private String id;
    private String name;
    private Double autonomy;
    private Double maxWeight;
    private Double averageSpeed;
    private String userId;

    public Modelo() {
    }

    public Modelo(String name, Double autonomy, Double maxWeight, Double averageSpeed, String userId) {
        this.name = name;
        this.autonomy = autonomy;
        this.maxWeight = maxWeight;
        this.averageSpeed = averageSpeed;
        this.userId = userId;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

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

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }
}
