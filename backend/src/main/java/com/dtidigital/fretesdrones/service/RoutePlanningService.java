package com.dtidigital.fretesdrones.service;

import com.dtidigital.fretesdrones.model.Drone;
import com.dtidigital.fretesdrones.model.Entrega;
import com.dtidigital.fretesdrones.model.Hangar;
import com.dtidigital.fretesdrones.model.RouteStatus;
import com.dtidigital.fretesdrones.repository.DroneRepository;
import com.dtidigital.fretesdrones.repository.HangarRepository;
import com.dtidigital.fretesdrones.repository.AlertAreaRepository;
import com.dtidigital.fretesdrones.routing.RouteCalculator;
import com.dtidigital.fretesdrones.routing.RoutePlan;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RoutePlanningService {

    private final DroneRepository droneRepository;
    private final HangarRepository hangarRepository;
    private final RouteCalculator routeCalculator;
    private final AlertAreaRepository alertAreaRepository;

    public RoutePlanningService(
            DroneRepository droneRepository,
            HangarRepository hangarRepository,
            RouteCalculator routeCalculator,
            AlertAreaRepository alertAreaRepository
    ) {
        this.droneRepository = droneRepository;
        this.hangarRepository = hangarRepository;
        this.routeCalculator = routeCalculator;
        this.alertAreaRepository = alertAreaRepository;
    }

    public void plan(Drone drone, List<Entrega> deliveries) {
        Hangar hangar = findHangar(drone);
        if (hangar == null || deliveries == null || deliveries.isEmpty()) {
            clear(drone);
            return;
        }
        RoutePlan plan = routeCalculator.calculate(
                hangar.getPositionX(),
                hangar.getPositionY(),
                deliveries,
                alertAreaRepository.findByUserId(drone.getUserId())
        );
        drone.setRouteDeliveryIds(
                plan.deliveries().stream().map(Entrega::getId).toList()
        );
        drone.setRouteDistance(plan.distance());
        drone.setRouteStatus(RouteStatus.AGUARDANDO_INICIO);
        drone.setRouteStartedAt(null);
        drone.setRouteEstimatedCompletionAt(null);
        droneRepository.save(drone);
    }

    public double calculateDistance(Drone drone, List<Entrega> deliveries) {
        Hangar hangar = findHangar(drone);
        if (hangar == null || deliveries == null || deliveries.isEmpty()) return 0.0;
        return routeCalculator.calculate(
                hangar.getPositionX(),
                hangar.getPositionY(),
                deliveries,
                alertAreaRepository.findByUserId(drone.getUserId())
        ).distance();
    }

    public boolean isDestinationRestricted(Entrega delivery, String userId) {
        if (delivery == null || delivery.getDestinationX() == null || delivery.getDestinationY() == null) return false;
        return alertAreaRepository.findByUserId(userId).stream().anyMatch(area ->
                delivery.getDestinationX() >= area.getMinX() && delivery.getDestinationX() <= area.getMaxX()
                        && delivery.getDestinationY() >= area.getMinY() && delivery.getDestinationY() <= area.getMaxY());
    }

    public void clear(Drone drone) {
        drone.setRouteDeliveryIds(List.of());
        drone.setRouteDistance(0.0);
        drone.setRouteStatus(null);
        drone.setRouteStartedAt(null);
        drone.setRouteEstimatedCompletionAt(null);
        droneRepository.save(drone);
    }

    private Hangar findHangar(Drone drone) {
        return hangarRepository.findById(drone.getHangarId()).orElse(null);
    }
}
