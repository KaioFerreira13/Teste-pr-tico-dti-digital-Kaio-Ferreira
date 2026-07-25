package com.dtidigital.fretesdrones.service;

import com.dtidigital.fretesdrones.model.Drone;
import com.dtidigital.fretesdrones.model.Entrega;
import com.dtidigital.fretesdrones.model.Hangar;
import com.dtidigital.fretesdrones.model.RouteStatus;
import com.dtidigital.fretesdrones.repository.DroneRepository;
import com.dtidigital.fretesdrones.repository.HangarRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class RoutePlanningService {

    private final DroneRepository droneRepository;
    private final HangarRepository hangarRepository;

    public RoutePlanningService(DroneRepository droneRepository, HangarRepository hangarRepository) {
        this.droneRepository = droneRepository;
        this.hangarRepository = hangarRepository;
    }

    public void plan(Drone drone, List<Entrega> deliveries) {
        Hangar hangar = hangarRepository.findById(drone.getHangarId()).orElse(null);
        if (hangar == null || deliveries.isEmpty()) {
            clear(drone);
            return;
        }

        Search search = new Search(hangar.getPositionX(), hangar.getPositionY(), deliveries);
        search.solve();
        drone.setRouteDeliveryIds(search.bestOrder.stream().map(Entrega::getId).toList());
        drone.setRouteDistance((double) search.bestDistance);
        drone.setRouteStatus(RouteStatus.AGUARDANDO_INICIO);
        droneRepository.save(drone);
    }

    public void clear(Drone drone) {
        drone.setRouteDeliveryIds(List.of());
        drone.setRouteDistance(0.0);
        drone.setRouteStatus(null);
        droneRepository.save(drone);
    }

    private static class Search {
        private final int originX;
        private final int originY;
        private final List<Entrega> deliveries;
        private final boolean[] visited;
        private int bestDistance = Integer.MAX_VALUE;
        private List<Entrega> bestOrder = List.of();

        Search(int originX, int originY, List<Entrega> deliveries) {
            this.originX = originX;
            this.originY = originY;
            this.deliveries = deliveries;
            this.visited = new boolean[deliveries.size()];
        }

        void solve() {
            visit(originX, originY, 0, new ArrayList<>());
        }

        void visit(int x, int y, int distance, List<Entrega> order) {
            if (distance >= bestDistance) return;
            if (order.size() == deliveries.size()) {
                int total = distance + manhattan(x, y, originX, originY);
                if (total < bestDistance) {
                    bestDistance = total;
                    bestOrder = List.copyOf(order);
                }
                return;
            }

            List<Integer> candidates = new ArrayList<>();
            for (int index = 0; index < deliveries.size(); index++) {
                if (!visited[index]) candidates.add(index);
            }
            candidates.sort(Comparator.comparingInt(index -> {
                Entrega delivery = deliveries.get(index);
                return manhattan(x, y, delivery.getDestinationX(), delivery.getDestinationY());
            }));

            for (int index : candidates) {
                Entrega delivery = deliveries.get(index);
                visited[index] = true;
                order.add(delivery);
                visit(
                        delivery.getDestinationX(),
                        delivery.getDestinationY(),
                        distance + manhattan(x, y, delivery.getDestinationX(), delivery.getDestinationY()),
                        order
                );
                order.remove(order.size() - 1);
                visited[index] = false;
            }
        }

        private static int manhattan(int x1, int y1, int x2, int y2) {
            return Math.abs(x1 - x2) + Math.abs(y1 - y2);
        }
    }
}
