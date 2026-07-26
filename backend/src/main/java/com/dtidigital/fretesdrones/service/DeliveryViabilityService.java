package com.dtidigital.fretesdrones.service;

import com.dtidigital.fretesdrones.model.Drone;
import com.dtidigital.fretesdrones.model.Entrega;
import com.dtidigital.fretesdrones.model.Hangar;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DeliveryViabilityService {

    public boolean canBeCompleted(Entrega delivery, List<Drone> drones, Hangar hangar) {
        double roundTripDistance = 2.0 * (
                Math.abs(delivery.getDestinationX() - hangar.getPositionX())
                        + Math.abs(delivery.getDestinationY() - hangar.getPositionY())
        );
        return drones.stream().anyMatch(drone ->
                drone.getMaxWeight() != null
                        && drone.getAutonomy() != null
                        && delivery.getWeight() != null
                        && delivery.getWeight() <= drone.getMaxWeight()
                        && roundTripDistance <= drone.getAutonomy()
        );
    }
}

