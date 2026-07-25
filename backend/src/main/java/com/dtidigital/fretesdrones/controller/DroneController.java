package com.dtidigital.fretesdrones.controller;

import com.dtidigital.fretesdrones.dto.BulkUnassignRequest;
import com.dtidigital.fretesdrones.dto.DroneOptionsResponse;
import com.dtidigital.fretesdrones.dto.DroneRequest;
import com.dtidigital.fretesdrones.dto.DroneResponse;
import com.dtidigital.fretesdrones.dto.DroneStatusRequest;
import com.dtidigital.fretesdrones.model.User;
import com.dtidigital.fretesdrones.security.AuthenticatedUserService;
import com.dtidigital.fretesdrones.service.DroneOperationService;
import com.dtidigital.fretesdrones.service.DroneService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/drones")
public class DroneController {

    private final DroneService droneService;
    private final DroneOperationService operationService;
    private final AuthenticatedUserService authenticatedUserService;

    public DroneController(
            DroneService droneService,
            DroneOperationService operationService,
            AuthenticatedUserService authenticatedUserService
    ) {
        this.droneService = droneService;
        this.operationService = operationService;
        this.authenticatedUserService = authenticatedUserService;
    }

    @GetMapping("/me")
    public List<DroneResponse> getMyDrones(Authentication authentication) {
        return droneService.findByUser(currentUser(authentication));
    }

    @PostMapping
    public DroneResponse createDrone(
            @Valid @RequestBody DroneRequest request,
            Authentication authentication
    ) {
        return droneService.create(request, currentUser(authentication));
    }

    @PutMapping("/{id}")
    public DroneResponse updateDrone(
            @PathVariable String id,
            @Valid @RequestBody DroneRequest request,
            Authentication authentication
    ) {
        return droneService.update(id, request, currentUser(authentication));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDrone(
            @PathVariable String id,
            Authentication authentication
    ) {
        droneService.delete(id, currentUser(authentication));
        return ResponseEntity.ok().build();
    }

    @GetMapping("/options")
    public DroneOptionsResponse getOptions(Authentication authentication) {
        return droneService.getOptions(currentUser(authentication));
    }

    @PatchMapping("/{id}/status")
    public DroneResponse updateStatus(
            @PathVariable String id,
            @RequestBody DroneStatusRequest request,
            Authentication authentication
    ) {
        return droneService.updateStatus(id, request.status(), currentUser(authentication));
    }

    @DeleteMapping("/{droneId}/entregas/{deliveryId}")
    public ResponseEntity<Void> unassignDelivery(
            @PathVariable String droneId,
            @PathVariable String deliveryId,
            Authentication authentication
    ) {
        operationService.unassignDelivery(droneId, deliveryId, currentUser(authentication));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{droneId}/entregas/remover")
    public ResponseEntity<Void> unassignDeliveries(
            @PathVariable String droneId,
            @RequestBody BulkUnassignRequest request,
            Authentication authentication
    ) {
        operationService.unassignDeliveries(
                droneId,
                request == null ? null : request.deliveryIds(),
                currentUser(authentication)
        );
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/iniciar-frete")
    public DroneResponse startFreight(
            @PathVariable String id,
            Authentication authentication
    ) {
        return operationService.startFreight(id, currentUser(authentication));
    }

    @PostMapping("/{id}/reset")
    public DroneResponse resetDrone(
            @PathVariable String id,
            Authentication authentication
    ) {
        return operationService.reset(id, currentUser(authentication));
    }

    private User currentUser(Authentication authentication) {
        return authenticatedUserService.get(authentication);
    }
}
