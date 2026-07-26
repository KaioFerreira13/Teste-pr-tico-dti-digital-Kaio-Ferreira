package com.dtidigital.fretesdrones.service;

import com.dtidigital.fretesdrones.model.DeliveryPriority;
import com.dtidigital.fretesdrones.model.Drone;
import com.dtidigital.fretesdrones.model.Entrega;
import com.dtidigital.fretesdrones.model.Hangar;
import com.dtidigital.fretesdrones.model.RouteStatus;
import com.dtidigital.fretesdrones.repository.DroneRepository;
import com.dtidigital.fretesdrones.repository.HangarRepository;
import com.dtidigital.fretesdrones.routing.RouteCalculator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RoutePlanningServiceTest {

    private DroneRepository droneRepository;
    private HangarRepository hangarRepository;
    private RoutePlanningService service;
    private Drone drone;

    @BeforeEach
    void setUp() {
        droneRepository = mock(DroneRepository.class);
        hangarRepository = mock(HangarRepository.class);
        service = new RoutePlanningService(
                droneRepository,
                hangarRepository,
                new RouteCalculator()
        );
        drone = Drone.builder().id("d1").hangarId("h1").build();
        when(hangarRepository.findById("h1"))
                .thenReturn(Optional.of(Hangar.builder().id("h1").positionX(0).positionY(0).build()));
    }

    @Test
    void appliesCalculatedPlanToDroneAndPersistsIt() {
        Entrega far = delivery("far", 10, 0);
        Entrega near = delivery("near", 1, 0);

        service.plan(drone, List.of(far, near));

        assertEquals(List.of("near", "far"), drone.getRouteDeliveryIds());
        assertEquals(20.0, drone.getRouteDistance());
        assertEquals(RouteStatus.AGUARDANDO_INICIO, drone.getRouteStatus());
        verify(droneRepository).save(drone);
    }

    @Test
    void returnsZeroWhenHangarDoesNotExist() {
        when(hangarRepository.findById("h1")).thenReturn(Optional.empty());

        assertEquals(0.0, service.calculateDistance(drone, List.of(delivery("e1", 3, 4))));
    }

    @Test
    void clearsRouteWhenNoDeliveriesAreProvided() {
        drone.setRouteDeliveryIds(List.of("old"));
        drone.setRouteDistance(10.0);
        drone.setRouteStatus(RouteStatus.EM_ANDAMENTO);
        drone.setRouteStartedAt(Instant.now());

        service.plan(drone, List.of());

        assertEquals(List.of(), drone.getRouteDeliveryIds());
        assertEquals(0.0, drone.getRouteDistance());
        assertNull(drone.getRouteStatus());
        assertNull(drone.getRouteStartedAt());
        verify(droneRepository).save(drone);
    }

    private Entrega delivery(String id, int x, int y) {
        return Entrega.builder()
                .id(id)
                .destinationX(x)
                .destinationY(y)
                .priority(DeliveryPriority.MEDIA)
                .build();
    }
}
