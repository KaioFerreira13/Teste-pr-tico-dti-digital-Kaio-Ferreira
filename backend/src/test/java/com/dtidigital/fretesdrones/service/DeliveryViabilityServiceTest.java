package com.dtidigital.fretesdrones.service;

import com.dtidigital.fretesdrones.model.Drone;
import com.dtidigital.fretesdrones.model.Entrega;
import com.dtidigital.fretesdrones.model.Hangar;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DeliveryViabilityServiceTest {

    private final DeliveryViabilityService service = new DeliveryViabilityService();
    private final Hangar hangar = Hangar.builder()
            .positionX(0)
            .positionY(0)
            .build();

    @Test
    void considersWeightAndRoundTripDistance() {
        Entrega delivery = Entrega.builder()
                .weight(5.0)
                .destinationX(2)
                .destinationY(2)
                .build();

        assertTrue(service.canBeCompleted(
                delivery,
                List.of(Drone.builder().maxWeight(10.0).autonomy(8.0).build()),
                hangar
        ));
        assertFalse(service.canBeCompleted(
                delivery,
                List.of(Drone.builder().maxWeight(4.0).autonomy(100.0).build()),
                hangar
        ));
    }
}

