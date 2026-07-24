package com.dtidigital.fretesdrones.controller;

import com.dtidigital.fretesdrones.dto.ModeloRequest;
import com.dtidigital.fretesdrones.dto.ModeloResponse;
import com.dtidigital.fretesdrones.model.Modelo;
import com.dtidigital.fretesdrones.model.User;
import com.dtidigital.fretesdrones.repository.ModeloRepository;
import com.dtidigital.fretesdrones.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/modelos")
public class ModeloController {

    private final ModeloRepository modeloRepository;
    private final UserRepository userRepository;

    public ModeloController(ModeloRepository modeloRepository, UserRepository userRepository) {
        this.modeloRepository = modeloRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/me")
    public List<ModeloResponse> getMyModels(Authentication authentication) {
        User user = getCurrentUser(authentication);
        return modeloRepository.findByUserId(user.getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    @PostMapping
    public ResponseEntity<?> createModel(@RequestBody ModeloRequest request, Authentication authentication) {
        User user = getCurrentUser(authentication);

        if (request.getName() == null || request.getName().isBlank()) {
            return ResponseEntity.badRequest().body("Model name is required");
        }
        if (request.getAutonomy() == null || request.getMaxWeight() == null || request.getAverageSpeed() == null) {
            return ResponseEntity.badRequest().body("All model fields are required");
        }
        if (modeloRepository.existsByUserIdAndNameIgnoreCase(user.getId(), request.getName().trim())) {
            return ResponseEntity.badRequest().body("Voce ja possui um modelo com esse nome.");
        }

        Modelo modelo = new Modelo(
                request.getName().trim(),
                request.getAutonomy(),
                request.getMaxWeight(),
                request.getAverageSpeed(),
                user.getId()
        );
        return ResponseEntity.ok(toResponse(modeloRepository.save(modelo)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateModel(@PathVariable String id, @RequestBody ModeloRequest request, Authentication authentication) {
        User user = getCurrentUser(authentication);

        return modeloRepository.findById(id)
                .map(modelo -> {
                    if (!modelo.getUserId().equals(user.getId())) {
                        return ResponseEntity.status(403).body("Voce nao pode alterar este modelo.");
                    }
                    if (request.getName() == null || request.getName().isBlank()) {
                        return ResponseEntity.badRequest().body("Model name is required");
                    }
                    if (request.getAutonomy() == null || request.getMaxWeight() == null || request.getAverageSpeed() == null) {
                        return ResponseEntity.badRequest().body("All model fields are required");
                    }
                    if (modeloRepository.existsByUserIdAndNameIgnoreCaseAndIdNot(user.getId(), request.getName().trim(), id)) {
                        return ResponseEntity.badRequest().body("Voce ja possui um modelo com esse nome.");
                    }

                    modelo.setName(request.getName().trim());
                    modelo.setAutonomy(request.getAutonomy());
                    modelo.setMaxWeight(request.getMaxWeight());
                    modelo.setAverageSpeed(request.getAverageSpeed());
                    return ResponseEntity.ok(toResponse(modeloRepository.save(modelo)));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteModel(@PathVariable String id, Authentication authentication) {
        User user = getCurrentUser(authentication);

        return modeloRepository.findById(id)
                .map(modelo -> {
                    if (!modelo.getUserId().equals(user.getId())) {
                        return ResponseEntity.status(403).body("Voce nao pode excluir este modelo.");
                    }
                    modeloRepository.delete(modelo);
                    return ResponseEntity.ok().build();
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    private User getCurrentUser(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found"));
    }

    private ModeloResponse toResponse(Modelo modelo) {
        return new ModeloResponse(modelo.getId(), modelo.getName(), modelo.getAutonomy(), modelo.getMaxWeight(), modelo.getAverageSpeed());
    }
}
