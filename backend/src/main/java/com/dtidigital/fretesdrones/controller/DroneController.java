package com.dtidigital.fretesdrones.controller;

import com.dtidigital.fretesdrones.dto.DroneRequest;
import com.dtidigital.fretesdrones.dto.DroneResponse;
import com.dtidigital.fretesdrones.model.Drone;
import com.dtidigital.fretesdrones.model.DroneStatus;
import com.dtidigital.fretesdrones.model.DeliveryStatus;
import com.dtidigital.fretesdrones.model.Entrega;
import com.dtidigital.fretesdrones.model.Hangar;
import com.dtidigital.fretesdrones.model.Modelo;
import com.dtidigital.fretesdrones.model.User;
import com.dtidigital.fretesdrones.repository.DroneRepository;
import com.dtidigital.fretesdrones.repository.HangarRepository;
import com.dtidigital.fretesdrones.repository.ModeloRepository;
import com.dtidigital.fretesdrones.repository.UserRepository;
import com.dtidigital.fretesdrones.repository.EntregaRepository;
import com.dtidigital.fretesdrones.service.DeliveryAllocationService;
import com.dtidigital.fretesdrones.service.RoutePlanningService;
import com.dtidigital.fretesdrones.model.RouteStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/drones")
public class DroneController {

    private final DroneRepository droneRepository;
    private final HangarRepository hangarRepository;
    private final ModeloRepository modeloRepository;
    private final UserRepository userRepository;
    private final EntregaRepository entregaRepository;
    private final DeliveryAllocationService allocationService;
    private final RoutePlanningService routePlanningService;

    public DroneController(DroneRepository droneRepository, HangarRepository hangarRepository, ModeloRepository modeloRepository, UserRepository userRepository, EntregaRepository entregaRepository, DeliveryAllocationService allocationService, RoutePlanningService routePlanningService) {
        this.droneRepository = droneRepository;
        this.hangarRepository = hangarRepository;
        this.modeloRepository = modeloRepository;
        this.userRepository = userRepository;
        this.entregaRepository = entregaRepository;
        this.allocationService = allocationService;
        this.routePlanningService = routePlanningService;
    }

    @GetMapping("/me")
    public List<DroneResponse> getMyDrones(Authentication authentication) {
        User user = getCurrentUser(authentication);
        return droneRepository.findByUserId(user.getId()).stream().map(this::toResponse).toList();
    }

    @PostMapping
    public ResponseEntity<?> createDrone(@Valid @RequestBody DroneRequest request, Authentication authentication) {
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
    public ResponseEntity<?> updateDrone(@PathVariable String id, @Valid @RequestBody DroneRequest request, Authentication authentication) {
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

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable String id, @RequestBody StatusRequest request, Authentication authentication) {
        User user = getCurrentUser(authentication);
        Drone drone = droneRepository.findById(id).orElse(null);
        if (drone == null) return ResponseEntity.notFound().build();
        if (!user.getId().equals(drone.getUserId())) return ResponseEntity.status(403).body("Voce nao pode alterar este drone.");
        if (drone.getStatus() == DroneStatus.EM_DESPACHO) {
            return ResponseEntity.badRequest().body("O status de um drone em despacho nao pode ser alterado manualmente.");
        }
        try {
            drone.setStatus(DroneStatus.valueOf(request.status().trim().toUpperCase()));
        } catch (Exception exception) {
            return ResponseEntity.badRequest().body("Status de drone invalido.");
        }
        droneRepository.save(drone);
        if (drone.getStatus() == DroneStatus.DISPONIVEL) {
            allocationService.allocateConfirmed(user.getId(), drone.getHangarId());
        }
        return ResponseEntity.ok(toResponse(droneRepository.findById(id).orElse(drone)));
    }

    @DeleteMapping("/{droneId}/entregas/{deliveryId}")
    public ResponseEntity<?> unassignDelivery(@PathVariable String droneId, @PathVariable String deliveryId, Authentication authentication) {
        User user = getCurrentUser(authentication);
        Drone drone = droneRepository.findById(droneId).orElse(null);
        Entrega delivery = entregaRepository.findById(deliveryId).orElse(null);
        if (drone == null || delivery == null) return ResponseEntity.notFound().build();
        if (!user.getId().equals(drone.getUserId()) || !user.getId().equals(delivery.getUserId()) || !droneId.equals(delivery.getDroneId())) {
            return ResponseEntity.status(403).body("Entrega ou drone invalido para esta operacao.");
        }

        delivery.setDroneId(null);
        delivery.setStatus(DeliveryStatus.AGUARDANDO_CONFIRMACAO);
        entregaRepository.save(delivery);

        double remainingLoad = entregaRepository.findByUserId(user.getId()).stream()
                .filter(item -> droneId.equals(item.getDroneId()) && item.getStatus() == DeliveryStatus.EM_DESPACHO)
                .mapToDouble(item -> item.getWeight() == null ? 0.0 : item.getWeight()).sum();
        drone.setCurrentLoad(remainingLoad);
        if (remainingLoad == 0.0 && drone.getStatus() == DroneStatus.EM_DESPACHO) drone.setStatus(DroneStatus.DISPONIVEL);
        droneRepository.save(drone);
        List<Entrega> remainingDeliveries = entregaRepository.findByUserId(user.getId()).stream()
                .filter(item -> droneId.equals(item.getDroneId()) && item.getStatus() == DeliveryStatus.EM_DESPACHO).toList();
        if (remainingDeliveries.isEmpty()) routePlanningService.clear(drone);
        else routePlanningService.plan(drone, remainingDeliveries);
        if (drone.getStatus() == DroneStatus.DISPONIVEL) {
            allocationService.allocateConfirmed(user.getId(), drone.getHangarId());
        }
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{droneId}/entregas/remover")
    public ResponseEntity<?> unassignDeliveries(@PathVariable String droneId, @RequestBody BulkUnassignRequest request, Authentication authentication) {
        User user = getCurrentUser(authentication);
        Drone drone = droneRepository.findById(droneId).orElse(null);
        if (drone == null) return ResponseEntity.notFound().build();
        if (!user.getId().equals(drone.getUserId())) return ResponseEntity.status(403).body("Voce nao pode alterar este drone.");
        if (request == null || request.deliveryIds() == null || request.deliveryIds().isEmpty()) {
            return ResponseEntity.badRequest().body("Selecione ao menos uma entrega.");
        }

        List<Entrega> selectedDeliveries = request.deliveryIds().stream()
                .map(entregaRepository::findById)
                .filter(java.util.Optional::isPresent)
                .map(java.util.Optional::get)
                .toList();
        boolean invalidSelection = selectedDeliveries.size() != request.deliveryIds().size()
                || selectedDeliveries.stream().anyMatch(delivery -> !user.getId().equals(delivery.getUserId()) || !droneId.equals(delivery.getDroneId()));
        if (invalidSelection) {
            return ResponseEntity.badRequest().body("A selecao contem uma entrega que nao pertence a este drone.");
        }

        selectedDeliveries.forEach(delivery -> {
            delivery.setDroneId(null);
            delivery.setStatus(DeliveryStatus.AGUARDANDO_CONFIRMACAO);
            entregaRepository.save(delivery);
        });

        List<Entrega> remainingDeliveries = entregaRepository.findByUserId(user.getId()).stream()
                .filter(delivery -> droneId.equals(delivery.getDroneId()) && delivery.getStatus() == DeliveryStatus.EM_DESPACHO)
                .toList();
        double remainingLoad = remainingDeliveries.stream().mapToDouble(delivery -> delivery.getWeight() == null ? 0.0 : delivery.getWeight()).sum();
        drone.setCurrentLoad(remainingLoad);
        if (remainingDeliveries.isEmpty()) {
            if (drone.getStatus() == DroneStatus.EM_DESPACHO) drone.setStatus(DroneStatus.DISPONIVEL);
            routePlanningService.clear(drone);
        } else {
            droneRepository.save(drone);
            routePlanningService.plan(drone, remainingDeliveries);
        }
        if (drone.getStatus() == DroneStatus.DISPONIVEL) {
            allocationService.allocateConfirmed(user.getId(), drone.getHangarId());
        }
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/iniciar-frete")
    public ResponseEntity<?> startFreight(@PathVariable String id, Authentication authentication) {
        User user = getCurrentUser(authentication);
        Drone drone = droneRepository.findById(id).orElse(null);
        if (drone == null) return ResponseEntity.notFound().build();
        if (!user.getId().equals(drone.getUserId())) return ResponseEntity.status(403).body("Voce nao pode alterar este drone.");
        if (drone.getStatus() != DroneStatus.EM_DESPACHO || drone.getRouteStatus() != RouteStatus.AGUARDANDO_INICIO) {
            return ResponseEntity.badRequest().body("O drone nao possui um frete aguardando inicio.");
        }
        drone.setRouteStatus(RouteStatus.EM_ANDAMENTO);
        return ResponseEntity.ok(toResponse(droneRepository.save(drone)));
    }

    @PostMapping("/{id}/reset")
    public ResponseEntity<?> resetDrone(@PathVariable String id, Authentication authentication) {
        User user = getCurrentUser(authentication);
        Drone drone = droneRepository.findById(id).orElse(null);
        if (drone == null) return ResponseEntity.notFound().build();
        if (!user.getId().equals(drone.getUserId())) {
            return ResponseEntity.status(403).body("Voce nao pode resetar este drone.");
        }

        entregaRepository.findByUserId(user.getId()).stream()
                .filter(delivery -> id.equals(delivery.getDroneId()))
                .forEach(delivery -> {
                    delivery.setDroneId(null);
                    delivery.setStatus(DeliveryStatus.AGUARDANDO_CONFIRMACAO);
                    entregaRepository.save(delivery);
                });

        drone.setStatus(DroneStatus.DISPONIVEL);
        drone.setCurrentLoad(0.0);
        routePlanningService.clear(drone);
        return ResponseEntity.ok(toResponse(droneRepository.findById(id).orElse(drone)));
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
                drone.getModelId(),
                drone.getStatus(),
                drone.getCurrentLoad(),
                drone.getRouteDeliveryIds(),
                drone.getRouteDistance(),
                drone.getRouteStatus()
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

    public record StatusRequest(String status) {}
    public record BulkUnassignRequest(List<String> deliveryIds) {}
}
