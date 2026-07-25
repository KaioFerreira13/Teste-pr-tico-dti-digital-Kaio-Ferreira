package com.dtidigital.fretesdrones.service;

import com.dtidigital.fretesdrones.model.DeliveryPriority;
import com.dtidigital.fretesdrones.model.DeliveryStatus;
import com.dtidigital.fretesdrones.model.Drone;
import com.dtidigital.fretesdrones.model.DroneStatus;
import com.dtidigital.fretesdrones.model.Entrega;
import com.dtidigital.fretesdrones.repository.DroneRepository;
import com.dtidigital.fretesdrones.repository.EntregaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DeliveryAllocationServiceTest {

    private DroneRepository droneRepository;
    private EntregaRepository entregaRepository;
    private RoutePlanningService routePlanningService;
    private DeliveryAllocationService service;

    @BeforeEach
    void setUp() {
        droneRepository = mock(DroneRepository.class);
        entregaRepository = mock(EntregaRepository.class);
        routePlanningService = mock(RoutePlanningService.class);
        service = new DeliveryAllocationService(droneRepository, entregaRepository, routePlanningService);
    }

    @Test
    void groupsMultipleDeliveriesInSameDroneWhenIdleDroneCannotFit() {
        Drone large = drone("large", 10, 100, 100);
        Drone small = drone("small", 2, 100, 100);
        Entrega high = delivery("high", 6, DeliveryPriority.ALTA);
        Entrega low = delivery("low", 3, DeliveryPriority.BAIXA);
        when(droneRepository.findByUserId("u1")).thenReturn(List.of(large, small));
        when(entregaRepository.findByUserId("u1")).thenReturn(List.of(low, high));
        when(routePlanningService.calculateDistance(any(), any())).thenReturn(20.0);

        service.allocateConfirmed("u1", "h1");

        assertEquals("large", high.getDroneId());
        assertEquals("large", low.getDroneId());
        assertEquals(9.0, large.getCurrentLoad());
        assertEquals(DroneStatus.EM_DESPACHO, large.getStatus());
        assertEquals(DroneStatus.DISPONIVEL, small.getStatus());
        verify(routePlanningService).plan(eq(large), any());
    }

    @Test
    void selectsTightestCapacityFit() {
        Drone large = drone("large", 10, 100, 100);
        Drone tight = drone("tight", 6, 100, 100);
        Entrega delivery = delivery("e1", 5, DeliveryPriority.MEDIA);
        when(droneRepository.findByUserId("u1")).thenReturn(List.of(large, tight));
        when(entregaRepository.findByUserId("u1")).thenReturn(List.of(delivery));
        when(routePlanningService.calculateDistance(any(), any())).thenReturn(10.0);

        service.allocateConfirmed("u1", "h1");

        assertEquals("tight", delivery.getDroneId());
    }

    @Test
    void marksDeliveryInfeasibleWhenNoDroneSupportsItsWeight() {
        Drone drone = drone("d1", 5, 100, 100);
        Entrega delivery = delivery("e1", 6, DeliveryPriority.ALTA);
        when(droneRepository.findByUserId("u1")).thenReturn(List.of(drone));
        when(entregaRepository.findByUserId("u1")).thenReturn(List.of(delivery));

        service.allocateConfirmed("u1", "h1");

        assertEquals(DeliveryStatus.INVIAVEL, delivery.getStatus());
        assertNull(delivery.getDroneId());
        verify(entregaRepository).save(delivery);
        verify(routePlanningService, never()).plan(any(), any());
    }

    @Test
    void marksDeliveryInfeasibleWhenFullAutonomyCannotCoverRoute() {
        Drone drone = drone("d1", 10, 30, 100);
        Entrega delivery = delivery("e1", 2, DeliveryPriority.MEDIA);
        when(droneRepository.findByUserId("u1")).thenReturn(List.of(drone));
        when(entregaRepository.findByUserId("u1")).thenReturn(List.of(delivery));
        when(routePlanningService.calculateDistance(any(), any())).thenReturn(31.0);

        service.allocateConfirmed("u1", "h1");

        assertEquals(DeliveryStatus.INVIAVEL, delivery.getStatus());
    }

    @Test
    void keepsDeliveryConfirmedWhenCurrentBatteryIsInsufficientButFullAutonomyWorks() {
        Drone drone = drone("d1", 10, 100, 20);
        Entrega delivery = delivery("e1", 2, DeliveryPriority.MEDIA);
        when(droneRepository.findByUserId("u1")).thenReturn(List.of(drone));
        when(entregaRepository.findByUserId("u1")).thenReturn(List.of(delivery));
        when(routePlanningService.calculateDistance(any(), any())).thenReturn(30.0);

        service.allocateConfirmed("u1", "h1");

        assertEquals(DeliveryStatus.CONFIRMADA, delivery.getStatus());
        assertNull(delivery.getDroneId());
    }

    @Test
    void ignoresDronesThatAreNotAvailable() {
        Drone drone = drone("d1", 10, 100, 100);
        drone.setStatus(DroneStatus.EM_ROTA);
        Entrega delivery = delivery("e1", 2, DeliveryPriority.MEDIA);
        when(droneRepository.findByUserId("u1")).thenReturn(List.of(drone));
        when(entregaRepository.findByUserId("u1")).thenReturn(List.of(delivery));
        when(routePlanningService.calculateDistance(any(), any())).thenReturn(10.0);

        service.allocateConfirmed("u1", "h1");

        assertEquals(DeliveryStatus.CONFIRMADA, delivery.getStatus());
        assertNull(delivery.getDroneId());
    }

    private Drone drone(String id, double maxWeight, double autonomy, double battery) {
        return Drone.builder()
                .id(id)
                .userId("u1")
                .hangarId("h1")
                .maxWeight(maxWeight)
                .autonomy(autonomy)
                .batteryLevel(battery)
                .currentLoad(0.0)
                .status(DroneStatus.DISPONIVEL)
                .build();
    }

    private Entrega delivery(String id, double weight, DeliveryPriority priority) {
        return Entrega.builder()
                .id(id)
                .userId("u1")
                .hangarId("h1")
                .weight(weight)
                .priority(priority)
                .status(DeliveryStatus.CONFIRMADA)
                .build();
    }
}
