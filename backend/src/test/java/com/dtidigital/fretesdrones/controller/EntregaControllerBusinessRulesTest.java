package com.dtidigital.fretesdrones.controller;

import com.dtidigital.fretesdrones.dto.ConfirmDispatchRequest;
import com.dtidigital.fretesdrones.dto.EntregaRequest;
import com.dtidigital.fretesdrones.dto.SplitDeliveryRequest;
import com.dtidigital.fretesdrones.mapper.DeliveryMapper;
import com.dtidigital.fretesdrones.mapper.DroneMapper;
import com.dtidigital.fretesdrones.model.*;
import com.dtidigital.fretesdrones.repository.*;
import com.dtidigital.fretesdrones.security.AuthenticatedUserService;
import com.dtidigital.fretesdrones.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class EntregaControllerBusinessRulesTest {

    private EntregaRepository entregaRepository;
    private DroneRepository droneRepository;
    private DeliveryAllocationService allocationService;
    private EntregaController controller;
    private Authentication authentication;

    @BeforeEach
    void setUp() {
        entregaRepository = mock(EntregaRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        HangarRepository hangarRepository = mock(HangarRepository.class);
        droneRepository = mock(DroneRepository.class);
        allocationService = mock(DeliveryAllocationService.class);

        DeliveryMapper deliveryMapper = new DeliveryMapper();
        DroneMapper droneMapper = new DroneMapper();
        HangarAccessService hangarAccessService = new HangarAccessService(hangarRepository);
        DeliveryService deliveryService = new DeliveryService(
                entregaRepository, hangarAccessService, deliveryMapper
        );
        DeliveryManagementQueryService queryService = new DeliveryManagementQueryService(
                entregaRepository,
                droneRepository,
                hangarAccessService,
                deliveryMapper,
                droneMapper
        );
        DeliveryDispatchPreparationService preparationService =
                new DeliveryDispatchPreparationService(
                        entregaRepository,
                        droneRepository,
                        hangarAccessService,
                        queryService
                );
        DeliveryDispatchConfirmationService confirmationService =
                new DeliveryDispatchConfirmationService(
                        entregaRepository,
                        hangarAccessService,
                        queryService,
                        new DeliveryViabilityService(),
                        allocationService
                );
        DeliveryQueueService queueService = new DeliveryQueueService(
                entregaRepository,
                hangarAccessService,
                queryService
        );
        DeliveryManagementService managementService = new DeliveryManagementService(
                queryService,
                preparationService,
                confirmationService,
                queueService
        );
        DeliverySplitService splitService = new DeliverySplitService(
                entregaRepository,
                droneRepository,
                hangarRepository,
                deliveryService,
                deliveryMapper
        );
        controller = new EntregaController(
                deliveryService,
                managementService,
                splitService,
                new AuthenticatedUserService(userRepository)
        );

        authentication = mock(Authentication.class);
        when(authentication.getName()).thenReturn("user@test.com");
        when(userRepository.findByEmail("user@test.com"))
                .thenReturn(Optional.of(User.builder().id("u1").email("user@test.com").build()));
        Hangar hangar = Hangar.builder()
                .id("h1")
                .userId("u1")
                .positionX(0)
                .positionY(0)
                .build();
        when(hangarRepository.findById("h1")).thenReturn(Optional.of(hangar));
        when(entregaRepository.findByUserId("u1")).thenReturn(List.of());
        when(droneRepository.findByUserId("u1")).thenReturn(List.of());
    }

    @Test
    void refusesConfirmationWithoutDeliveries() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> controller.confirmDispatch(
                        "h1", new ConfirmDispatchRequest(List.of()), authentication
                )
        );

        assertEquals("Nenhuma entrega foi enviada para confirmacao.", exception.getMessage());
        verify(allocationService, never()).allocateConfirmed(any(), any());
    }

    @Test
    void refusesConfirmationWhileAnInfeasibleDeliveryIsUntreated() {
        Entrega infeasible = delivery("e1", "u1", DeliveryStatus.INVIAVEL, 50.0);
        infeasible.setDestinationX(10);
        infeasible.setDestinationY(10);
        Drone incapable = Drone.builder()
                .id("d1")
                .hangarId("h1")
                .maxWeight(10.0)
                .autonomy(100.0)
                .build();
        when(entregaRepository.findByUserId("u1")).thenReturn(List.of(infeasible));
        when(droneRepository.findByUserId("u1")).thenReturn(List.of(incapable));

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> controller.confirmDispatch(
                        "h1", new ConfirmDispatchRequest(List.of("e1")), authentication
                )
        );

        assertEquals(
                "Trate todas as entregas inviaveis antes de confirmar a movimentacao.",
                exception.getMessage()
        );
    }

    @Test
    void refusesDeliveryFromAnotherUserDuringConfirmation() {
        Entrega foreign = delivery(
                "e1", "other-user", DeliveryStatus.AGUARDANDO_CONFIRMACAO, 2.0
        );
        when(entregaRepository.findById("e1")).thenReturn(Optional.of(foreign));

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> controller.confirmDispatch(
                        "h1", new ConfirmDispatchRequest(List.of("e1")), authentication
                )
        );

        assertEquals(
                "Uma entrega informada nao pertence ao usuario ou ao hangar selecionado.",
                exception.getMessage()
        );
        verify(entregaRepository, never()).save(foreign);
    }

    @Test
    void refusesMovingDeliveryThatWasAlreadyDispatched() {
        Entrega dispatched = delivery("e1", "u1", DeliveryStatus.EM_DESPACHO, 2.0);
        when(entregaRepository.findById("e1")).thenReturn(Optional.of(dispatched));

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> controller.confirmDispatch(
                        "h1", new ConfirmDispatchRequest(List.of("e1")), authentication
                )
        );

        assertEquals(
                "A entrega ja foi tratada e nao pode ser movimentada novamente.",
                exception.getMessage()
        );
    }

    @Test
    void refusesInvalidPriorityWhenCreatingDelivery() {
        EntregaRequest request = validRequest();
        request.setPriority("URGENTE");

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> controller.createDelivery(request, authentication)
        );

        assertEquals("A prioridade deve ser baixa, media ou alta.", exception.getMessage());
        verify(entregaRepository, never()).save(any());
    }

    @Test
    void refusesEditingDispatchedDelivery() {
        Entrega dispatched = delivery("e1", "u1", DeliveryStatus.EM_DESPACHO, 2.0);
        when(entregaRepository.findById("e1")).thenReturn(Optional.of(dispatched));

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> controller.updateDelivery("e1", validRequest(), authentication)
        );

        assertEquals("Entregas ja despachadas nao podem ser editadas.", exception.getMessage());
        verify(entregaRepository, never()).save(dispatched);
    }

    @Test
    void refusesEditingDeliveryOwnedByAnotherUser() {
        Entrega foreign = delivery(
                "e1", "other-user", DeliveryStatus.AGUARDANDO_CONFIRMACAO, 2.0
        );
        when(entregaRepository.findById("e1")).thenReturn(Optional.of(foreign));

        assertThrows(
                AccessDeniedException.class,
                () -> controller.updateDelivery("e1", validRequest(), authentication)
        );
        verify(entregaRepository, never()).save(foreign);
    }

    @Test
    void refusesSplittingWhenPartitionSumDiffersFromOriginalWeight() {
        Entrega original = delivery("e1", "u1", DeliveryStatus.INVIAVEL, 10.0);
        original.setDestinationX(10);
        original.setDestinationY(10);
        when(entregaRepository.findById("e1")).thenReturn(Optional.of(original));

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> controller.splitDelivery(
                        "e1", new SplitDeliveryRequest(List.of(4.0, 5.0)), authentication
                )
        );

        assertEquals(
                "A soma das particoes deve ser igual ao peso total da entrega.",
                exception.getMessage()
        );
        verify(entregaRepository, never()).delete(original);
    }

    @Test
    void refusesSplitWithLessThanTwoPositivePartitions() {
        Entrega original = delivery("e1", "u1", DeliveryStatus.INVIAVEL, 10.0);
        original.setDestinationX(10);
        original.setDestinationY(10);
        when(entregaRepository.findById("e1")).thenReturn(Optional.of(original));

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> controller.splitDelivery(
                        "e1", new SplitDeliveryRequest(List.of(10.0)), authentication
                )
        );

        assertEquals(
                "Informe pelo menos duas particoes com pesos positivos para uma entrega inviavel.",
                exception.getMessage()
        );
    }

    @Test
    void refusesSplittingDeliveryOwnedByAnotherUser() {
        Entrega original = delivery("e1", "other-user", DeliveryStatus.INVIAVEL, 10.0);
        when(entregaRepository.findById("e1")).thenReturn(Optional.of(original));

        assertThrows(
                AccessDeniedException.class,
                () -> controller.splitDelivery(
                        "e1", new SplitDeliveryRequest(List.of(5.0, 5.0)), authentication
                )
        );
        verify(entregaRepository, never()).delete(original);
    }

    private Entrega delivery(
            String id,
            String userId,
            DeliveryStatus status,
            double weight
    ) {
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
