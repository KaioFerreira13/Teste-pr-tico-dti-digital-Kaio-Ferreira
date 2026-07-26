package com.dtidigital.fretesdrones.service;

import com.dtidigital.fretesdrones.dto.DeliveryManagementResponse;
import com.dtidigital.fretesdrones.model.User;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.*;

class DeliveryManagementServiceTest {

    @Test
    void preparesDispatchBeforeReadingUpdatedManagementData() {
        DeliveryManagementQueryService query = mock(DeliveryManagementQueryService.class);
        DeliveryDispatchPreparationService preparation =
                mock(DeliveryDispatchPreparationService.class);
        DeliveryDispatchConfirmationService confirmation =
                mock(DeliveryDispatchConfirmationService.class);
        DeliveryQueueService queue = mock(DeliveryQueueService.class);
        DeliveryManagementResponse expected =
                new DeliveryManagementResponse(List.of(), List.of());
        User user = User.builder().id("u1").build();
        when(query.getManagement("h1", user)).thenReturn(expected);
        DeliveryManagementService service = new DeliveryManagementService(
                query,
                preparation,
                confirmation,
                queue
        );

        DeliveryManagementResponse response = service.prepareDispatch("h1", user);

        assertSame(expected, response);
        var ordered = inOrder(preparation, query);
        ordered.verify(preparation).prepare("h1", user);
        ordered.verify(query).getManagement("h1", user);
    }
}

