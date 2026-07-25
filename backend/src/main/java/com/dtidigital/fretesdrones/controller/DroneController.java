package com.dtidigital.fretesdrones.controller;

import com.dtidigital.fretesdrones.dto.DroneRequest;
import com.dtidigital.fretesdrones.dto.DroneResponse;
import com.dtidigital.fretesdrones.model.Drone;
import com.dtidigital.fretesdrones.model.Hangar;
import com.dtidigital.fretesdrones.model.Modelo;
import com.dtidigital.fretesdrones.model.User;
import com.dtidigital.fretesdrones.repository.DroneRepository;
import com.dtidigital.fretesdrones.repository.HangarRepository;
import com.dtidigital.fretesdrones.repository.ModeloRepository;
import com.dtidigital.fretesdrones.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/drones")
public class DroneController {

    private final DroneRepository droneRepository;
    private final HangarRepository hangarRepository;
    private final ModeloRepository modeloRepository;
    private final UserRepository userRepository;

    public DroneController(DroneRepository droneRepository, HangarRepository hangarRepository, ModeloRepository modeloRepository, UserRepository userRepository) {
        this.droneRepository = droneRepository;
        this.hangarRepository = hangarRepository;
        this.modeloRepository = modeloRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/me")
    public List<DroneResponse> getMyDrones(Authentication authentication) {
        User user = getCurrentUser(authentication);
        return droneRepository.findByUserId(user.getId()).stream().map(this::toResponse).toList();
    }

    @PostMapping
    public ResponseEntity<?> createDrone(@RequestBody DroneRequest request, Authentication authentication) {
        User user = getCurrentUser(authentication);

        String validation = validateRequest(request, user.getId(), null);
        if (validation != null) {
            return ResponseEntity.badRequest().body(validation);
        }

        Drone drone = new Drone(
                request.getName().trim(),
                request.getAutonomy(),
                request.getMaxWeight(),
                request.getAverageSpeed(),
                request.getHangarId(),
                request.getModelId(),
                user.getId()
        );
        return ResponseEntity.ok(toResponse(droneRepository.save(drone)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateDrone(@PathVariable String id, @RequestBody DroneRequest request, Authentication authentication) {
        User user = getCurrentUser(authentication);

        return droneRepository.findById(id)
                .map(drone -> {
                    if (!drone.getUserId().equals(user.getId())) {
                        return ResponseEntity.status(403).body("Voce nao pode alterar este drone.");
                    }
                    String validation = validateRequest(request, user.getId(), id);
                    if (validation != null) {
                        return ResponseEntity.badRequest().body(validation);
                    }

                    drone.setName(request.getName().trim());
                    drone.setAutonomy(request.getAutonomy());
                    drone.setMaxWeight(request.getMaxWeight());
                    drone.setAverageSpeed(request.getAverageSpeed());
                    drone.setHangarId(request.getHangarId());
                    drone.setModelId(request.getModelId());
                    return ResponseEntity.ok(toResponse(droneRepository.save(drone)));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDrone(@PathVariable String id, Authentication authentication) {
        User user = getCurrentUser(authentication);

        return droneRepository.findById(id)
                .map(drone -> {
                    if (!drone.getUserId().equals(user.getId())) {
                        return ResponseEntity.status(403).body("Voce nao pode excluir este drone.");
                    }
                    droneRepository.delete(drone);
                    return ResponseEntity.ok().build();
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/options")
    public ResponseEntity<?> getOptions(Authentication authentication) {
        User user = getCurrentUser(authentication);
        List<Hangar> hangars = hangarRepository.findByUserId(user.getId());
        List<Modelo> models = modeloRepository.findByUserId(user.getId());
        return ResponseEntity.ok(new DroneOptionsResponse(
                hangars.stream().map(h -> new SimpleOption(h.getId(), h.getName())).toList(),
                models.stream().map(m -> new SimpleOption(m.getId(), m.getName())).toList()
        ));
    }

    private String validateRequest(DroneRequest request, String userId, String currentId) {
        if (request.getName() == null || request.getName().isBlank()) {
            return "Drone name is required";
        }
        if (request.getAutonomy() == null || request.getMaxWeight() == null || request.getAverageSpeed() == null) {
            return "All drone technical fields are required";
        }
        if (request.getHangarId() == null || request.getHangarId().isBlank()) {
            return "Hangar is required";
        }
        if (hangarRepository.findById(request.getHangarId()).isEmpty()) {
            return "Hangar not found";
        }
        if (!hangarRepository.findById(request.getHangarId()).get().getUserId().equals(userId)) {
            return "Hangar does not belong to current user";
        }
        if (request.getModelId() != null && !request.getModelId().isBlank()) {
            if (modeloRepository.findById(request.getModelId()).isEmpty()) {
                return "Modelo not found";
            }
            if (!modeloRepository.findById(request.getModelId()).get().getUserId().equals(userId)) {
                return "Modelo does not belong to current user";
            }
        }
        if (currentId == null) {
            if (droneRepository.existsByUserIdAndNameIgnoreCase(userId, request.getName().trim())) {
                return "Voce ja possui um drone com esse nome.";
            }
        } else if (droneRepository.existsByUserIdAndNameIgnoreCaseAndIdNot(userId, request.getName().trim(), currentId)) {
            return "Voce ja possui um drone com esse nome.";
        }
        return null;
    }

    private User getCurrentUser(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found"));
    }

    private DroneResponse toResponse(Drone drone) {
        return new DroneResponse(
                drone.getId(),
                drone.getName(),
                drone.getAutonomy(),
                drone.getMaxWeight(),
                drone.getAverageSpeed(),
                drone.getHangarId(),
                drone.getModelId()
        );
    }

    public static class DroneOptionsResponse {
        private final List<SimpleOption> hangars;
        private final List<SimpleOption> models;

        public DroneOptionsResponse(List<SimpleOption> hangars, List<SimpleOption> models) {
            this.hangars = hangars;
            this.models = models;
        }

        public List<SimpleOption> getHangars() {
            return hangars;
        }

        public List<SimpleOption> getModels() {
            return models;
        }
    }

    public static class SimpleOption {
        private final String id;
        private final String name;

        public SimpleOption(String id, String name) {
            this.id = id;
            this.name = name;
        }

        public String getId() {
            return id;
        }

        public String getName() {
            return name;
        }
    }
}
