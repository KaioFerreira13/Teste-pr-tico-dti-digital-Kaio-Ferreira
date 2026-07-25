package com.dtidigital.fretesdrones.dto;

import com.dtidigital.fretesdrones.model.DroneStatus;
import com.dtidigital.fretesdrones.model.RouteStatus;
import java.util.List;

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
    private List<String> routeDeliveryIds;
    private Double routeDistance;
    private RouteStatus routeStatus;

    public DroneResponse(String id, String name, Double autonomy, Double maxWeight, Double averageSpeed, String hangarId, String modelId, DroneStatus status, Double currentLoad, List<String> routeDeliveryIds, Double routeDistance, RouteStatus routeStatus) {
        this.id = id;
        this.name = name;
        this.autonomy = autonomy;
        this.maxWeight = maxWeight;
        this.averageSpeed = averageSpeed;
        this.hangarId = hangarId;
        this.modelId = modelId;
        this.status = status;
        this.currentLoad = currentLoad;
        this.routeDeliveryIds = routeDeliveryIds;
        this.routeDistance = routeDistance;
        this.routeStatus = routeStatus;
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
    public List<String> getRouteDeliveryIds() { return routeDeliveryIds; }
    public Double getRouteDistance() { return routeDistance; }
    public RouteStatus getRouteStatus() { return routeStatus; }
}
