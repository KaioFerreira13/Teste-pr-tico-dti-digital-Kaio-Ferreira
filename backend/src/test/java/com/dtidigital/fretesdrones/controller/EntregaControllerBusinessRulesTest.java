package com.dtidigital.fretesdrones.controller;

import com.dtidigital.fretesdrones.dto.EntregaRequest;
import com.dtidigital.fretesdrones.model.DeliveryPriority;
import com.dtidigital.fretesdrones.model.DeliveryStatus;
import com.dtidigital.fretesdrones.model.Drone;
import com.dtidigital.fretesdrones.model.Entrega;
import com.dtidigital.fretesdrones.model.Hangar;
import com.dtidigital.fretesdrones.model.User;
import com.dtidigital.fretesdrones.repository.DroneRepository;
import com.dtidigital.fretesdrones.repository.EntregaRepository;
import com.dtidigital.fretesdrones.repository.HangarRepository;
import com.dtidigital.fretesdrones.repository.UserRepository;
import com.dtidigital.fretesdrones.service.DeliveryAllocationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class EntregaControllerBusinessRulesTest {

    private EntregaRepository entregaRepository;
    private HangarRepository hangarRepository;
    private DroneRepository droneRepository;
    private DeliveryAllocationService allocationService;
    private EntregaController controller;
    private Authentication authentication;
    private Hangar hangar;

    @BeforeEach
    void setUp() {
        entregaRepository = mock(EntregaRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        hangarRepository = mock(HangarRepository.class);
        droneRepository = mock(DroneRepository.class);
        allocationService = mock(DeliveryAllocationService.class);
        controller = new EntregaController(
                entregaRepository, userRepository, hangarRepository, droneRepository, allocationService
        );
        authentication = mock(Authentication.class);
        when(authentication.getName()).thenReturn("user@test.com");
        when(userRepository.findByEmail("user@test.com"))
                .thenReturn(Optional.of(User.builder().id("u1").email("user@test.com").build()));
        hangar = Hangar.builder().id("h1").userId("u1").positionX(0).positionY(0).build();
        when(hangarRepository.findById("h1")).thenReturn(Optional.of(hangar));
        when(entregaRepository.findByUserId("u1")).thenReturn(List.of());
        when(droneRepository.findByUserId("u1")).thenReturn(List.of());
    }

    @Test
    void refusesConfirmationWithoutDeliveries() {
        ResponseEntity<?> response = controller.confirmDispatch(
                "h1", new EntregaController.ConfirmRequest(List.of()), authentication
        );

        assertEquals(400, response.getStatusCode().value());
        assertEquals("Nenhuma entrega foi enviada para confirmacao.", response.getBody());
        verify(allocationService, never()).allocateConfirmed(any(), any());
    }

    @Test
    void refusesConfirmationWhileAnInfeasibleDeliveryIsUntreated() {
        Entrega infeasible = delivery("e1", "u1", DeliveryStatus.INVIAVEL, 50.0);
        infeasible.setDestinationX(10);
        infeasible.setDestinationY(10);
        Drone incapable = Drone.builder().id("d1").hangarId("h1").maxWeight(10.0).autonomy(100.0).build();
        when(entregaRepository.findByUserId("u1")).thenReturn(List.of(infeasible));
        when(droneRepository.findByUserId("u1")).thenReturn(List.of(incapable));

        ResponseEntity<?> response = controller.confirmDispatch(
                "h1", new EntregaController.ConfirmRequest(List.of("e1")), authentication
        );

        assertEquals(400, response.getStatusCode().value());
        assertEquals("Trate todas as entregas inviaveis antes de confirmar a movimentacao.", response.getBody());
        verify(allocationService, never()).allocateConfirmed(any(), any());
    }

    @Test
    void refusesDeliveryFromAnotherUserDuringConfirmation() {
        Entrega foreign = delivery("e1", "other-user", DeliveryStatus.AGUARDANDO_CONFIRMACAO, 2.0);
        when(entregaRepository.findById("e1")).thenReturn(Optional.of(foreign));

        ResponseEntity<?> response = controller.confirmDispatch(
                "h1", new EntregaController.ConfirmRequest(List.of("e1")), authentication
        );

        assertEquals(400, response.getStatusCode().value());
        assertEquals("Uma entrega informada nao pertence ao usuario ou ao hangar selecionado.", response.getBody());
        verify(entregaRepository, never()).save(foreign);
    }

    @Test
    void refusesMovingDeliveryThatWasAlreadyDispatched() {
        Entrega dispatched = delivery("e1", "u1", DeliveryStatus.EM_DESPACHO, 2.0);
        when(entregaRepository.findById("e1")).thenReturn(Optional.of(dispatched));

        ResponseEntity<?> response = controller.confirmDispatch(
                "h1", new EntregaController.ConfirmRequest(List.of("e1")), authentication
        );

        assertEquals(400, response.getStatusCode().value());
        assertEquals("A entrega ja foi tratada e nao pode ser movimentada novamente.", response.getBody());
    }

    @Test
    void refusesInvalidPriorityWhenCreatingDelivery() {
        EntregaRequest request = validRequest();
        request.setPriority("URGENTE");

        ResponseEntity<?> response = controller.createDelivery(request, authentication);

        assertEquals(400, response.getStatusCode().value());
        assertEquals("A prioridade deve ser baixa, media ou alta.", response.getBody());
        verify(entregaRepository, never()).save(any());
    }

    @Test
    void refusesEditingDispatchedDelivery() {
        Entrega dispatched = delivery("e1", "u1", DeliveryStatus.EM_DESPACHO, 2.0);
        when(entregaRepository.findById("e1")).thenReturn(Optional.of(dispatched));

        ResponseEntity<?> response = controller.updateDelivery("e1", validRequest(), authentication);

        assertEquals(400, response.getStatusCode().value());
        assertEquals("Entregas ja despachadas nao podem ser editadas.", response.getBody());
        verify(entregaRepository, never()).save(dispatched);
    }

    @Test
    void refusesEditingDeliveryOwnedByAnotherUser() {
        Entrega foreign = delivery("e1", "other-user", DeliveryStatus.AGUARDANDO_CONFIRMACAO, 2.0);
        when(entregaRepository.findById("e1")).thenReturn(Optional.of(foreign));

        ResponseEntity<?> response = controller.updateDelivery("e1", validRequest(), authentication);

        assertEquals(403, response.getStatusCode().value());
        verify(entregaRepository, never()).save(foreign);
    }

    @Test
    void refusesSplittingWhenPartitionSumDiffersFromOriginalWeight() {
        Entrega original = delivery("e1", "u1", DeliveryStatus.INVIAVEL, 10.0);
        original.setDestinationX(10);
        original.setDestinationY(10);
        when(entregaRepository.findById("e1")).thenReturn(Optional.of(original));

        ResponseEntity<?> response = controller.splitDelivery(
                "e1", new EntregaController.SplitRequest(List.of(4.0, 5.0)), authentication
        );

        assertEquals(400, response.getStatusCode().value());
        assertEquals("A soma das particoes deve ser igual ao peso total da entrega.", response.getBody());
        verify(entregaRepository, never()).delete(original);
    }

    @Test
    void refusesSplitWithLessThanTwoPositivePartitions() {
        Entrega original = delivery("e1", "u1", DeliveryStatus.INVIAVEL, 10.0);
        original.setDestinationX(10);
        original.setDestinationY(10);
        when(entregaRepository.findById("e1")).thenReturn(Optional.of(original));

        ResponseEntity<?> response = controller.splitDelivery(
                "e1", new EntregaController.SplitRequest(List.of(10.0)), authentication
        );

        assertEquals(400, response.getStatusCode().value());
        assertEquals("Informe pelo menos duas particoes com pesos positivos para uma entrega inviavel.", response.getBody());
    }

    @Test
    void refusesSplittingDeliveryOwnedByAnotherUser() {
        Entrega original = delivery("e1", "other-user", DeliveryStatus.INVIAVEL, 10.0);
        when(entregaRepository.findById("e1")).thenReturn(Optional.of(original));

        ResponseEntity<?> response = controller.splitDelivery(
                "e1", new EntregaController.SplitRequest(List.of(5.0, 5.0)), authentication
        );

        assertEquals(403, response.getStatusCode().value());
        verify(entregaRepository, never()).delete(original);
    }

    private Entrega delivery(String id, String userId, DeliveryStatus status, double weight) {
        return Entrega.builder()
                .id(id)
                .userId(userId)
                .hangarId("h1")
                .status(status)
                .weight(weight)
                .priority(DeliveryPriority.MEDIA)
                .recipientName("Cliente")
                .destinationX(1)
                .destinationY(1)
                .build();
    }

    private EntregaRequest validRequest() {
        EntregaRequest request = new EntregaRequest();
        request.setWeight(2.0);
        request.setDestinationX(2);
        request.setDestinationY(3);
        request.setPriority("ALTA");
        request.setRecipientName("Cliente");
        request.setHangarId("h1");
        return request;
    }
}
