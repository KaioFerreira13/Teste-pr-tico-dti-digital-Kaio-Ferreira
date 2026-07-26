package com.dtidigital.fretesdrones.routing;

import com.dtidigital.fretesdrones.model.Entrega;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Component
public class RouteCalculator {

    public RoutePlan calculate(int originX, int originY, List<Entrega> deliveries) {
        if (deliveries == null || deliveries.isEmpty()) {
            return new RoutePlan(List.of(), 0.0);
        }
        Search search = new Search(originX, originY, deliveries);
        search.solve();
        return new RoutePlan(search.bestOrder, search.bestDistance);
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

        private void visit(int x, int y, int distance, List<Entrega> order) {
            if (distance >= bestDistance) return;
            if (order.size() == deliveries.size()) {
                int total = distance + manhattan(x, y, originX, originY);
                if (total < bestDistance) {
                    bestDistance = total;
                    bestOrder = List.copyOf(order);
                }
                return;
            }
            List<Integer> candidates = unvisitedCandidates(x, y);
            for (int index : candidates) {
                Entrega delivery = deliveries.get(index);
                visited[index] = true;
                order.add(delivery);
                visit(
                        delivery.getDestinationX(),
                        delivery.getDestinationY(),
                        distance + manhattan(
                                x,
                                y,
                                delivery.getDestinationX(),
                                delivery.getDestinationY()
                        ),
                        order
                );
                order.remove(order.size() - 1);
                visited[index] = false;
            }
        }

        private List<Integer> unvisitedCandidates(int x, int y) {
            List<Integer> candidates = new ArrayList<>();
            for (int index = 0; index < deliveries.size(); index++) {
                if (!visited[index]) candidates.add(index);
            }
            candidates.sort(Comparator.comparingInt(index -> {
                Entrega delivery = deliveries.get(index);
                return manhattan(
                        x,
                        y,
                        delivery.getDestinationX(),
                        delivery.getDestinationY()
                );
            }));
            return candidates;
        }
    }

    static int manhattan(int x1, int y1, int x2, int y2) {
        return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    }
}

