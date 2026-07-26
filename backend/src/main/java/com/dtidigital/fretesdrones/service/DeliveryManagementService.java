package com.dtidigital.fretesdrones.service;

import com.dtidigital.fretesdrones.dto.DeliveryManagementResponse;
import com.dtidigital.fretesdrones.model.User;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DeliveryManagementService {

    private final DeliveryManagementQueryService queryService;
    private final DeliveryDispatchPreparationService preparationService;
    private final DeliveryDispatchConfirmationService confirmationService;
    private final DeliveryQueueService queueService;

    public DeliveryManagementService(
            DeliveryManagementQueryService queryService,
            DeliveryDispatchPreparationService preparationService,
            DeliveryDispatchConfirmationService confirmationService,
            DeliveryQueueService queueService
    ) {
        this.queryService = queryService;
        this.preparationService = preparationService;
        this.confirmationService = confirmationService;
        this.queueService = queueService;
    }

    public DeliveryManagementResponse getManagement(String hangarId, User user) {
        return queryService.getManagement(hangarId, user);
    }

    public DeliveryManagementResponse prepareDispatch(String hangarId, User user) {
        preparationService.prepare(hangarId, user);
        return queryService.getManagement(hangarId, user);
    }

    public DeliveryManagementResponse confirmDispatch(
            String hangarId,
            List<String> deliveryIds,
            User user
    ) {
        confirmationService.confirm(hangarId, deliveryIds, user);
        return queryService.getManagement(hangarId, user);
    }

    public DeliveryManagementResponse clearQueue(String hangarId, User user) {
        queueService.clear(hangarId, user);
        return queryService.getManagement(hangarId, user);
    }
}

