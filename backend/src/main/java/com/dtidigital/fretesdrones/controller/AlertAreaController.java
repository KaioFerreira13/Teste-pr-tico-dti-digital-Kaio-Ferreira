package com.dtidigital.fretesdrones.controller;

import com.dtidigital.fretesdrones.dto.AlertAreaRequest;
import com.dtidigital.fretesdrones.dto.AlertAreaResponse;
import com.dtidigital.fretesdrones.model.User;
import com.dtidigital.fretesdrones.security.AuthenticatedUserService;
import com.dtidigital.fretesdrones.service.AlertAreaService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/alertas")
public class AlertAreaController {
    private final AlertAreaService service;
    private final AuthenticatedUserService authenticatedUserService;

    public AlertAreaController(AlertAreaService service, AuthenticatedUserService authenticatedUserService) {
        this.service = service;
        this.authenticatedUserService = authenticatedUserService;
    }

    @GetMapping
    public List<AlertAreaResponse> list(Authentication authentication) {
        return service.findByUser(user(authentication));
    }

    @PostMapping
    public AlertAreaResponse create(@Valid @RequestBody AlertAreaRequest request, Authentication authentication) {
        return service.create(request, user(authentication));
    }

    @PutMapping("/{id}")
    public AlertAreaResponse update(@PathVariable String id, @Valid @RequestBody AlertAreaRequest request, Authentication authentication) {
        return service.update(id, request, user(authentication));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, Authentication authentication) {
        service.delete(id, user(authentication));
        return ResponseEntity.ok().build();
    }

    private User user(Authentication authentication) {
        return authenticatedUserService.get(authentication);
    }
}
