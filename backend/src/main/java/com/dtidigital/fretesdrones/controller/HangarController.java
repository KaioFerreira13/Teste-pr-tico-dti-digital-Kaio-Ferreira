package com.dtidigital.fretesdrones.controller;

import com.dtidigital.fretesdrones.dto.HangarRequest;
import com.dtidigital.fretesdrones.dto.HangarResponse;
import com.dtidigital.fretesdrones.model.Hangar;
import com.dtidigital.fretesdrones.model.User;
import com.dtidigital.fretesdrones.repository.HangarRepository;
import com.dtidigital.fretesdrones.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hangars")
public class HangarController {

    private final HangarRepository hangarRepository;
    private final UserRepository userRepository;

    public HangarController(HangarRepository hangarRepository, UserRepository userRepository) {
        this.hangarRepository = hangarRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/me")
    public List<HangarResponse> getMyHangars(Authentication authentication) {
        User user = getCurrentUser(authentication);
        return hangarRepository.findByUserId(user.getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    @GetMapping
    public List<HangarResponse> listAll(Authentication authentication) {
        User user = getCurrentUser(authentication);
        return hangarRepository.findByUserId(user.getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    @PostMapping
    public ResponseEntity<?> createHangar(@RequestBody HangarRequest request, Authentication authentication) {
        User user = getCurrentUser(authentication);

        if (request.getName() == null || request.getName().isBlank()) {
            return ResponseEntity.badRequest().body("Hangar name is required");
        }
        if (request.getPositionX() == null || request.getPositionY() == null) {
            return ResponseEntity.badRequest().body("Hangar position is required");
        }
        if (hangarRepository.existsByPositionXAndPositionY(request.getPositionX(), request.getPositionY())) {
            return ResponseEntity.badRequest().body("Ja existe um hangar nessa posicao.");
        }

        Hangar hangar = new Hangar(request.getName().trim(), request.getPositionX(), request.getPositionY(), user.getId());
        return ResponseEntity.ok(toResponse(hangarRepository.save(hangar)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateHangar(@PathVariable String id, @RequestBody HangarRequest request, Authentication authentication) {
        User user = getCurrentUser(authentication);

        return hangarRepository.findById(id)
                .map(hangar -> {
                    if (!hangar.getUserId().equals(user.getId())) {
                        return ResponseEntity.status(403).body("Voce nao pode alterar este hangar.");
                    }
                    if (request.getName() == null || request.getName().isBlank()) {
                        return ResponseEntity.badRequest().body("Hangar name is required");
                    }
                    if (request.getPositionX() == null || request.getPositionY() == null) {
                        return ResponseEntity.badRequest().body("Hangar position is required");
                    }
                    if (hangarRepository.existsByPositionXAndPositionYAndIdNot(request.getPositionX(), request.getPositionY(), id)) {
                        return ResponseEntity.badRequest().body("Ja existe um hangar nessa posicao.");
                    }

                    hangar.setName(request.getName().trim());
                    hangar.setPositionX(request.getPositionX());
                    hangar.setPositionY(request.getPositionY());
                    return ResponseEntity.ok(toResponse(hangarRepository.save(hangar)));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteHangar(@PathVariable String id, Authentication authentication) {
        User user = getCurrentUser(authentication);

        return hangarRepository.findById(id)
                .map(hangar -> {
                    if (!hangar.getUserId().equals(user.getId())) {
                        return ResponseEntity.status(403).body("Voce nao pode excluir este hangar.");
                    }
                    hangarRepository.delete(hangar);
                    return ResponseEntity.ok().build();
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    private User getCurrentUser(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found"));
    }

    private HangarResponse toResponse(Hangar hangar) {
        return new HangarResponse(hangar.getId(), hangar.getName(), hangar.getPositionX(), hangar.getPositionY());
    }
}
