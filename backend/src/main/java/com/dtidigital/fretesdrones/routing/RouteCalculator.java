package com.dtidigital.fretesdrones.routing;

import com.dtidigital.fretesdrones.model.AlertArea;
import com.dtidigital.fretesdrones.model.Entrega;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class RouteCalculator {

    public RoutePlan calculate(int originX, int originY, List<Entrega> deliveries) {
        return calculate(originX, originY, deliveries, List.of());
    }

    public RoutePlan calculate(int originX, int originY, List<Entrega> deliveries, List<AlertArea> restrictedAreas) {
        if (deliveries == null || deliveries.isEmpty()) return new RoutePlan(List.of(), 0.0);
        Search search = new Search(originX, originY, deliveries, restrictedAreas == null ? List.of() : restrictedAreas);
        search.solve();
        return new RoutePlan(search.bestOrder, search.bestDistance);
    }

    private static class Search {
        private final int originX;
        private final int originY;
        private final List<Entrega> deliveries;
        private final List<AlertArea> areas;
        private final boolean[] visited;
        private final Map<String, Integer> distances = new HashMap<>();
        private int bestDistance = Integer.MAX_VALUE;
        private List<Entrega> bestOrder = List.of();

        Search(int originX, int originY, List<Entrega> deliveries, List<AlertArea> areas) {
            this.originX = originX;
            this.originY = originY;
            this.deliveries = deliveries;
            this.areas = areas;
            this.visited = new boolean[deliveries.size()];
        }

        void solve() { visit(originX, originY, 0, new ArrayList<>()); }

        private void visit(int x, int y, int distance, List<Entrega> order) {
            if (distance >= bestDistance) return;
            if (order.size() == deliveries.size()) {
                int total = distance + pathDistance(x, y, originX, originY);
                if (total < bestDistance) {
                    bestDistance = total;
                    bestOrder = List.copyOf(order);
                }
                return;
            }
            List<Integer> candidates = new ArrayList<>();
            for (int i = 0; i < deliveries.size(); i++) if (!visited[i]) candidates.add(i);
            candidates.sort(Comparator.comparingInt(i -> {
                Entrega d = deliveries.get(i);
                return pathDistance(x, y, d.getDestinationX(), d.getDestinationY());
            }));
            for (int index : candidates) {
                Entrega delivery = deliveries.get(index);
                int leg = pathDistance(x, y, delivery.getDestinationX(), delivery.getDestinationY());
                if (leg == Integer.MAX_VALUE) continue;
                visited[index] = true;
                order.add(delivery);
                visit(delivery.getDestinationX(), delivery.getDestinationY(), distance + leg, order);
                order.remove(order.size() - 1);
                visited[index] = false;
            }
        }

        private int pathDistance(int startX, int startY, int targetX, int targetY) {
            String key = startX + ":" + startY + ":" + targetX + ":" + targetY;
            return distances.computeIfAbsent(key, ignored -> aStar(startX, startY, targetX, targetY));
        }

        private int aStar(int startX, int startY, int targetX, int targetY) {
            if (areas.isEmpty()) return manhattan(startX, startY, targetX, targetY);
            int minX = Math.min(startX, targetX), maxX = Math.max(startX, targetX);
            int minY = Math.min(startY, targetY), maxY = Math.max(startY, targetY);
            for (AlertArea area : areas) {
                minX = Math.min(minX, (int) Math.floor(area.getMinX()) - 2);
                maxX = Math.max(maxX, (int) Math.ceil(area.getMaxX()) + 2);
                minY = Math.min(minY, (int) Math.floor(area.getMinY()) - 2);
                maxY = Math.max(maxY, (int) Math.ceil(area.getMaxY()) + 2);
            }
            int margin = Math.max(8, manhattan(startX, startY, targetX, targetY) / 2 + 2);
            minX -= margin; maxX += margin; minY -= margin; maxY += margin;

            record Node(int x, int y, int cost, int estimate) {}
            PriorityQueue<Node> open = new PriorityQueue<>(Comparator.comparingInt(Node::estimate));
            Map<Long, Integer> costs = new HashMap<>();
            open.add(new Node(startX, startY, 0, manhattan(startX, startY, targetX, targetY)));
            costs.put(key(startX, startY), 0);
            int[][] directions = {{1,0},{-1,0},{0,1},{0,-1}};
            while (!open.isEmpty()) {
                Node node = open.poll();
                if (node.x == targetX && node.y == targetY) return node.cost;
                if (node.cost != costs.getOrDefault(key(node.x, node.y), Integer.MAX_VALUE)) continue;
                for (int[] direction : directions) {
                    int x = node.x + direction[0], y = node.y + direction[1];
                    if (x < minX || x > maxX || y < minY || y > maxY) continue;
                    if (blocked(x, y) && !(x == targetX && y == targetY) && !(x == startX && y == startY)) continue;
                    int nextCost = node.cost + 1;
                    long pointKey = key(x, y);
                    if (nextCost >= costs.getOrDefault(pointKey, Integer.MAX_VALUE)) continue;
                    costs.put(pointKey, nextCost);
                    open.add(new Node(x, y, nextCost, nextCost + manhattan(x, y, targetX, targetY)));
                }
            }
            return Integer.MAX_VALUE;
        }

        private boolean blocked(int x, int y) {
            return areas.stream().anyMatch(area ->
                    x >= Math.floor(area.getMinX()) - 1 && x <= Math.ceil(area.getMaxX()) + 1
                            && y >= Math.floor(area.getMinY()) - 1 && y <= Math.ceil(area.getMaxY()) + 1);
        }

        private long key(int x, int y) { return (((long) x) << 32) ^ (y & 0xffffffffL); }
    }

    static int manhattan(int x1, int y1, int x2, int y2) {
        return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    }
}
