package com.dtidigital.fretesdrones.service;

import com.dtidigital.fretesdrones.model.Drone;
import com.dtidigital.fretesdrones.model.Entrega;
import com.dtidigital.fretesdrones.model.Hangar;
import com.dtidigital.fretesdrones.repository.AlertAreaRepository;
import com.dtidigital.fretesdrones.routing.RouteCalculator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DeliveryViabilityService {
    private final AlertAreaRepository alertAreaRepository;
    private final RouteCalculator routeCalculator;

    public DeliveryViabilityService() {
        this.alertAreaRepository = null;
        this.routeCalculator = null;
    }

    @Autowired
    public DeliveryViabilityService(AlertAreaRepository alertAreaRepository, RouteCalculator routeCalculator) {
        this.alertAreaRepository = alertAreaRepository;
        this.routeCalculator = routeCalculator;
    }

    public boolean canBeCompleted(Entrega delivery, List<Drone> drones, Hangar hangar) {
        if (alertAreaRepository != null && alertAreaRepository.findByUserId(delivery.getUserId()).stream().anyMatch(area ->
                delivery.getDestinationX() >= area.getMinX() && delivery.getDestinationX() <= area.getMaxX()
                        && delivery.getDestinationY() >= area.getMinY() && delivery.getDestinationY() <= area.getMaxY())) {
            return false;
        }
        double roundTripDistance = routeCalculator == null ? 2.0 * (
                Math.abs(delivery.getDestinationX() - hangar.getPositionX())
                        + Math.abs(delivery.getDestinationY() - hangar.getPositionY())
        ) : routeCalculator.calculate(
                hangar.getPositionX(), hangar.getPositionY(), List.of(delivery),
                alertAreaRepository.findByUserId(delivery.getUserId())
        ).distance();
        return drones.stream().anyMatch(drone ->
                drone.getMaxWeight() != null
                        && drone.getAutonomy() != null
                        && delivery.getWeight() != null
                        && delivery.getWeight() <= drone.getMaxWeight()
                        && roundTripDistance <= drone.getAutonomy()
        );
    }
}
