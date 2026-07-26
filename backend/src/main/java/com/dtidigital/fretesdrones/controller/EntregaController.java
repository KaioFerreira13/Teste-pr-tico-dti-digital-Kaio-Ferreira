package com.dtidigital.fretesdrones.controller;

import com.dtidigital.fretesdrones.dto.*;
import com.dtidigital.fretesdrones.model.User;
import com.dtidigital.fretesdrones.security.AuthenticatedUserService;
import com.dtidigital.fretesdrones.service.DeliveryManagementService;
import com.dtidigital.fretesdrones.service.DeliveryService;
import com.dtidigital.fretesdrones.service.DeliverySplitService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/entregas")
public class EntregaController {

    private final DeliveryService deliveryService;
    private final DeliveryManagementService managementService;
    private final DeliverySplitService splitService;
    private final AuthenticatedUserService authenticatedUserService;

    public EntregaController(
            DeliveryService deliveryService,
            DeliveryManagementService managementService,
            DeliverySplitService splitService,
            AuthenticatedUserService authenticatedUserService
    ) {
        this.deliveryService = deliveryService;
        this.managementService = managementService;
        this.splitService = splitService;
        this.authenticatedUserService = authenticatedUserService;
    }

    @GetMapping("/me")
    public List<EntregaResponse> getMyDeliveries(Authentication authentication) {
        return deliveryService.findByUser(currentUser(authentication));
    }

    @GetMapping("/gerenciamento/{hangarId}")
    public DeliveryManagementResponse getManagement(
            @PathVariable String hangarId,
            Authentication authentication
    ) {
        return managementService.getManagement(hangarId, currentUser(authentication));
    }

    @PostMapping("/gerenciamento/{hangarId}/preparar")
    public DeliveryManagementResponse prepareDispatch(
            @PathVariable String hangarId,
            Authentication authentication
    ) {
        return managementService.prepareDispatch(hangarId, currentUser(authentication));
    }

    @PostMapping("/gerenciamento/{hangarId}/confirmar")
    public DeliveryManagementResponse confirmDispatch(
            @PathVariable String hangarId,
            @RequestBody ConfirmDispatchRequest request,
            Authentication authentication
    ) {
        return managementService.confirmDispatch(
                hangarId,
                request == null ? null : request.deliveryIds(),
                currentUser(authentication)
        );
    }

    @PostMapping("/gerenciamento/{hangarId}/limpar-fila")
    public DeliveryManagementResponse clearQueue(
            @PathVariable String hangarId,
            Authentication authentication
    ) {
        return managementService.clearQueue(hangarId, currentUser(authentication));
    }

    @PostMapping
    public EntregaResponse createDelivery(
            @Valid @RequestBody EntregaRequest request,
            Authentication authentication
    ) {
        return deliveryService.create(request, currentUser(authentication));
    }

    @PutMapping("/{id}")
    public EntregaResponse updateDelivery(
            @PathVariable String id,
            @Valid @RequestBody EntregaRequest request,
            Authentication authentication
    ) {
        return deliveryService.update(id, request, currentUser(authentication));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDelivery(
            @PathVariable String id,
            Authentication authentication
    ) {
        deliveryService.delete(id, currentUser(authentication));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/repartir")
    public List<EntregaResponse> splitDelivery(
            @PathVariable String id,
            @RequestBody SplitDeliveryRequest request,
            Authentication authentication
    ) {
        return splitService.split(
                id,
                request == null ? null : request.weights(),
                currentUser(authentication)
        );
    }

    private User currentUser(Authentication authentication) {
        return authenticatedUserService.get(authentication);
    }
}
