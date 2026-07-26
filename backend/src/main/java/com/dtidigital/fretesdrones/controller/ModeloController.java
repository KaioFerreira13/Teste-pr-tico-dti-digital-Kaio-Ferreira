package com.dtidigital.fretesdrones.controller;

import com.dtidigital.fretesdrones.dto.ModeloRequest;
import com.dtidigital.fretesdrones.dto.ModeloResponse;
import com.dtidigital.fretesdrones.model.User;
import com.dtidigital.fretesdrones.security.AuthenticatedUserService;
import com.dtidigital.fretesdrones.service.ModeloService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/modelos")
public class ModeloController {

    private final ModeloService modeloService;
    private final AuthenticatedUserService authenticatedUserService;

    public ModeloController(
            ModeloService modeloService,
            AuthenticatedUserService authenticatedUserService
    ) {
        this.modeloService = modeloService;
        this.authenticatedUserService = authenticatedUserService;
    }

    @GetMapping("/me")
    public List<ModeloResponse> getMyModels(Authentication authentication) {
        return modeloService.findByUser(currentUser(authentication));
    }

    @PostMapping
    public ModeloResponse createModel(
            @Valid @RequestBody ModeloRequest request,
            Authentication authentication
    ) {
        return modeloService.create(request, currentUser(authentication));
    }

    @PutMapping("/{id}")
    public ModeloResponse updateModel(
            @PathVariable String id,
            @Valid @RequestBody ModeloRequest request,
            Authentication authentication
    ) {
        return modeloService.update(id, request, currentUser(authentication));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteModel(
            @PathVariable String id,
            Authentication authentication
    ) {
        modeloService.delete(id, currentUser(authentication));
        return ResponseEntity.ok().build();
    }

    private User currentUser(Authentication authentication) {
        return authenticatedUserService.get(authentication);
    }
}
