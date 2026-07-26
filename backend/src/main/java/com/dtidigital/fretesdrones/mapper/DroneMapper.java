package com.dtidigital.fretesdrones.mapper;

import com.dtidigital.fretesdrones.dto.DroneResponse;
import com.dtidigital.fretesdrones.model.Drone;
import org.springframework.stereotype.Component;

@Component
public class DroneMapper {

    public DroneResponse toResponse(Drone drone) {
        return new DroneResponse(
                drone.getId(),
                drone.getName(),
                drone.getAutonomy(),
                drone.getMaxWeight(),
                drone.getAverageSpeed(),
                drone.getHangarId(),
                drone.getModelId(),
                drone.getStatus(),
                drone.getCurrentLoad(),
                drone.getRouteDeliveryIds(),
                drone.getRouteDistance(),
                drone.getRouteStatus(),
                drone.getRouteStartedAt(),
                drone.getRouteEstimatedCompletionAt(),
                drone.getBatteryLevel() == null ? 100.0 : drone.getBatteryLevel(),
                drone.getChargingStartedAt()
        );
    }
}

