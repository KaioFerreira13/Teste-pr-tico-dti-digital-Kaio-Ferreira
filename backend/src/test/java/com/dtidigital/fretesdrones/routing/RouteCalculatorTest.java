package com.dtidigital.fretesdrones.routing;

import com.dtidigital.fretesdrones.model.Entrega;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RouteCalculatorTest {

    private final RouteCalculator calculator = new RouteCalculator();

    @Test
    void calculatesStreetDistanceIncludingReturnToOrigin() {
        RoutePlan plan = calculator.calculate(
                0,
                0,
                List.of(delivery("e1", 2, 0), delivery("e2", 2, 2))
        );

        assertEquals(8.0, plan.distance());
    }

    @Test
    void choosesShortestOrderInsteadOfInputOrder() {
        RoutePlan plan = calculator.calculate(
                0,
                0,
                List.of(delivery("far", 10, 0), delivery("near", 1, 0))
        );

        assertEquals(
                List.of("near", "far"),
                plan.deliveries().stream().map(Entrega::getId).toList()
        );
        assertEquals(20.0, plan.distance());
    }

    @Test
    void returnsEmptyPlanWhenThereAreNoDeliveries() {
        RoutePlan plan = calculator.calculate(0, 0, List.of());

        assertEquals(List.of(), plan.deliveries());
        assertEquals(0.0, plan.distance());
    }

    private Entrega delivery(String id, int x, int y) {
        return Entrega.builder()
                .id(id)
                .destinationX(x)
                .destinationY(y)
                .build();
    }
}
