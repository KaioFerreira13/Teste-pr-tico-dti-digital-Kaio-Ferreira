package com.dtidigital.fretesdrones.controller;

import com.dtidigital.fretesdrones.dto.HangarRequest;
import com.dtidigital.fretesdrones.dto.HangarResponse;
import com.dtidigital.fretesdrones.model.User;
import com.dtidigital.fretesdrones.security.AuthenticatedUserService;
import com.dtidigital.fretesdrones.service.HangarService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hangars")
public class HangarController {

    private final HangarService hangarService;
    private final AuthenticatedUserService authenticatedUserService;

    public HangarController(
            HangarService hangarService,
            AuthenticatedUserService authenticatedUserService
    ) {
        this.hangarService = hangarService;
        this.authenticatedUserService = authenticatedUserService;
    }

    @GetMapping({"/me", ""})
    public List<HangarResponse> getMyHangars(Authentication authentication) {
        return hangarService.findByUser(currentUser(authentication));
    }

    @PostMapping
    public HangarResponse createHangar(
            @Valid @RequestBody HangarRequest request,
            Authentication authentication
    ) {
        return hangarService.create(request, currentUser(authentication));
    }

    @PutMapping("/{id}")
    public HangarResponse updateHangar(
            @PathVariable String id,
            @Valid @RequestBody HangarRequest request,
            Authentication authentication
    ) {
        return hangarService.update(id, request, currentUser(authentication));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteHangar(
            @PathVariable String id,
            Authentication authentication
    ) {
        hangarService.delete(id, currentUser(authentication));
        return ResponseEntity.ok().build();
    }

    private User currentUser(Authentication authentication) {
        return authenticatedUserService.get(authentication);
    }
}
