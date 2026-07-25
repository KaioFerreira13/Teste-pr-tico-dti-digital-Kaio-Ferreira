package com.dtidigital.fretesdrones.controller;

import com.dtidigital.fretesdrones.dto.EntregaRequest;
import com.dtidigital.fretesdrones.dto.EntregaResponse;
import com.dtidigital.fretesdrones.model.DeliveryPriority;
import com.dtidigital.fretesdrones.model.Entrega;
import com.dtidigital.fretesdrones.model.Hangar;
import com.dtidigital.fretesdrones.model.User;
import com.dtidigital.fretesdrones.repository.HangarRepository;
import com.dtidigital.fretesdrones.repository.EntregaRepository;
import com.dtidigital.fretesdrones.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/entregas")
public class EntregaController {

    private final EntregaRepository entregaRepository;
    private final UserRepository userRepository;
    private final HangarRepository hangarRepository;

    public EntregaController(EntregaRepository entregaRepository, UserRepository userRepository, HangarRepository hangarRepository) {
        this.entregaRepository = entregaRepository;
        this.userRepository = userRepository;
        this.hangarRepository = hangarRepository;
    }

    @GetMapping("/me")
    public List<EntregaResponse> getMyDeliveries(Authentication authentication) {
        User user = getCurrentUser(authentication);
        return entregaRepository.findByUserId(user.getId()).stream().map(this::toResponse).toList();
    }

    @PostMapping
    public ResponseEntity<?> createDelivery(@Valid @RequestBody EntregaRequest request, Authentication authentication) {
        User user = getCurrentUser(authentication);

        DeliveryPriority priority = parsePriority(request.getPriority());
        if (priority == null) {
            return ResponseEntity.badRequest().body("A prioridade deve ser baixa, media ou alta.");
        }

        Hangar hangar = getOwnedHangar(request.getHangarId(), user);

        Entrega entrega = new Entrega(
                request.getWeight(),
                request.getDestinationX(),
                request.getDestinationY(),
                priority,
                request.getRecipientName().trim(),
                hangar.getId(),
                user.getId()
        );

        return ResponseEntity.ok(toResponse(entregaRepository.save(entrega)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateDelivery(@PathVariable String id, @Valid @RequestBody EntregaRequest request, Authentication authentication) {
        User user = getCurrentUser(authentication);
        DeliveryPriority priority = parsePriority(request.getPriority());
        if (priority == null) {
            return ResponseEntity.badRequest().body("A prioridade deve ser baixa, media ou alta.");
        }

        Hangar hangar = getOwnedHangar(request.getHangarId(), user);

        return entregaRepository.findById(id)
                .map(entrega -> {
                    if (!entrega.getUserId().equals(user.getId())) {
                        return ResponseEntity.status(403).body("Voce nao pode alterar esta entrega.");
                    }

                    entrega.setWeight(request.getWeight());
                    entrega.setDestinationX(request.getDestinationX());
                    entrega.setDestinationY(request.getDestinationY());
                    entrega.setPriority(priority);
                    entrega.setRecipientName(request.getRecipientName().trim());
                    entrega.setHangarId(hangar.getId());
                    return ResponseEntity.ok(toResponse(entregaRepository.save(entrega)));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDelivery(@PathVariable String id, Authentication authentication) {
        User user = getCurrentUser(authentication);

        return entregaRepository.findById(id)
                .map(entrega -> {
                    if (!entrega.getUserId().equals(user.getId())) {
                        return ResponseEntity.status(403).body("Voce nao pode excluir esta entrega.");
                    }
                    entregaRepository.delete(entrega);
                    return ResponseEntity.ok().build();
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    private DeliveryPriority parsePriority(String priority) {
        try {
            return DeliveryPriority.valueOf(priority.trim().toUpperCase());
        } catch (Exception exception) {
            return null;
        }
    }

    private User getCurrentUser(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found"));
    }

    private Hangar getOwnedHangar(String hangarId, User user) {
        return hangarRepository.findById(hangarId)
                .filter(hangar -> hangar.getUserId().equals(user.getId()))
                .orElseThrow(() -> new IllegalArgumentException("Selecione um hangar valido do seu cadastro."));
    }

    private EntregaResponse toResponse(Entrega entrega) {
        return new EntregaResponse(
                entrega.getId(),
                entrega.getWeight(),
                entrega.getDestinationX(),
                entrega.getDestinationY(),
                entrega.getPriority(),
                entrega.getRecipientName(),
                entrega.getHangarId()
        );
    }
}
