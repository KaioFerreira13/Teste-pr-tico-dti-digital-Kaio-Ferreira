package com.dtidigital.fretesdrones.controller;

import com.dtidigital.fretesdrones.dto.EntregaRequest;
import com.dtidigital.fretesdrones.dto.EntregaResponse;
import com.dtidigital.fretesdrones.dto.DroneResponse;
import com.dtidigital.fretesdrones.model.DeliveryPriority;
import com.dtidigital.fretesdrones.model.DeliveryStatus;
import com.dtidigital.fretesdrones.model.Drone;
import com.dtidigital.fretesdrones.model.DroneStatus;
import com.dtidigital.fretesdrones.model.Entrega;
import com.dtidigital.fretesdrones.model.Hangar;
import com.dtidigital.fretesdrones.model.User;
import com.dtidigital.fretesdrones.repository.HangarRepository;
import com.dtidigital.fretesdrones.repository.EntregaRepository;
import com.dtidigital.fretesdrones.repository.UserRepository;
import com.dtidigital.fretesdrones.repository.DroneRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Comparator;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/entregas")
public class EntregaController {

    private final EntregaRepository entregaRepository;
    private final UserRepository userRepository;
    private final HangarRepository hangarRepository;
    private final DroneRepository droneRepository;

    public EntregaController(EntregaRepository entregaRepository, UserRepository userRepository, HangarRepository hangarRepository, DroneRepository droneRepository) {
        this.entregaRepository = entregaRepository;
        this.userRepository = userRepository;
        this.hangarRepository = hangarRepository;
        this.droneRepository = droneRepository;
    }

    @GetMapping("/me")
    public List<EntregaResponse> getMyDeliveries(Authentication authentication) {
        User user = getCurrentUser(authentication);
        return entregaRepository.findByUserId(user.getId()).stream().map(this::toResponse).toList();
    }

    @GetMapping("/gerenciamento/{hangarId}")
    public ResponseEntity<?> getManagement(@PathVariable String hangarId, Authentication authentication) {
        User user = getCurrentUser(authentication);
        getOwnedHangar(hangarId, user);
        return ResponseEntity.ok(buildManagement(hangarId, user));
    }

    @PostMapping("/gerenciamento/{hangarId}/preparar")
    public ResponseEntity<?> prepareDispatch(@PathVariable String hangarId, Authentication authentication) {
        User user = getCurrentUser(authentication);
        getOwnedHangar(hangarId, user);

        List<Drone> drones = droneRepository.findByUserId(user.getId()).stream()
                .filter(drone -> hangarId.equals(drone.getHangarId())).toList();
        List<Entrega> deliveries = entregaRepository.findByUserId(user.getId()).stream()
                .filter(delivery -> hangarId.equals(delivery.getHangarId()))
                .filter(delivery -> delivery.getStatus() == null || delivery.getStatus() == DeliveryStatus.AGUARDANDO_CONFIRMACAO || delivery.getStatus() == DeliveryStatus.NA_FILA)
                .sorted(Comparator.comparing(Entrega::getPriority, Comparator.nullsFirst(Comparator.naturalOrder())).reversed())
                .toList();

        Map<String, Double> loads = new HashMap<>();
        for (Drone drone : drones) {
            if (drone.getStatus() == null) drone.setStatus(DroneStatus.DISPONIVEL);
            loads.put(drone.getId(), drone.getCurrentLoad() == null ? 0.0 : drone.getCurrentLoad());
        }

        for (Entrega delivery : deliveries) {
            Drone best = drones.stream()
                    .filter(drone -> drone.getStatus() == DroneStatus.DISPONIVEL)
                    .filter(drone -> drone.getMaxWeight() != null && delivery.getWeight() != null && delivery.getWeight() <= drone.getMaxWeight())
                    .filter(drone -> loads.get(drone.getId()) + delivery.getWeight() <= drone.getMaxWeight())
                    .min(Comparator.comparingDouble(drone -> drone.getMaxWeight() - (loads.get(drone.getId()) + delivery.getWeight())))
                    .orElse(null);

            boolean canEverFit = drones.stream().anyMatch(drone -> drone.getMaxWeight() != null && delivery.getWeight() != null && delivery.getWeight() <= drone.getMaxWeight());
            if (best == null) {
                delivery.setStatus(canEverFit ? DeliveryStatus.NA_FILA : DeliveryStatus.INVIAVEL);
                delivery.setDroneId(null);
            } else {
                loads.put(best.getId(), loads.get(best.getId()) + delivery.getWeight());
                delivery.setStatus(DeliveryStatus.EM_DESPACHO);
                delivery.setDroneId(best.getId());
                best.setStatus(DroneStatus.EM_DESPACHO);
            }
            entregaRepository.save(delivery);
        }
        for (Drone drone : drones) {
            drone.setCurrentLoad(loads.get(drone.getId()));
            droneRepository.save(drone);
        }
        return ResponseEntity.ok(buildManagement(hangarId, user));
    }

    @PostMapping("/gerenciamento/{hangarId}/confirmar")
    public ResponseEntity<?> confirmDispatch(@PathVariable String hangarId, @RequestBody ConfirmRequest request, Authentication authentication) {
        User user = getCurrentUser(authentication);
        getOwnedHangar(hangarId, user);
        if (request == null || request.movements() == null) {
            return ResponseEntity.badRequest().body("Nenhuma movimentacao foi enviada.");
        }

        List<Drone> drones = droneRepository.findByUserId(user.getId()).stream()
                .filter(drone -> hangarId.equals(drone.getHangarId())).toList();
        boolean hasInviableDelivery = entregaRepository.findByUserId(user.getId()).stream()
                .filter(delivery -> hangarId.equals(delivery.getHangarId()))
                .filter(delivery -> delivery.getStatus() == null || delivery.getStatus() == DeliveryStatus.AGUARDANDO_CONFIRMACAO || delivery.getStatus() == DeliveryStatus.INVIAVEL)
                .anyMatch(delivery -> drones.stream().noneMatch(drone -> drone.getMaxWeight() != null && delivery.getWeight() != null && delivery.getWeight() <= drone.getMaxWeight()));
        if (hasInviableDelivery) {
            return ResponseEntity.badRequest().body("Trate todas as entregas inviaveis antes de confirmar a movimentacao.");
        }
        Map<String, Drone> dronesById = drones.stream().collect(java.util.stream.Collectors.toMap(Drone::getId, drone -> drone));
        Map<String, Double> loads = new HashMap<>();
        drones.forEach(drone -> loads.put(drone.getId(), drone.getCurrentLoad() == null ? 0.0 : drone.getCurrentLoad()));

        for (Movement movement : request.movements()) {
            Entrega delivery = entregaRepository.findById(movement.deliveryId()).orElse(null);
            Drone drone = dronesById.get(movement.droneId());
            if (delivery == null || !user.getId().equals(delivery.getUserId()) || !hangarId.equals(delivery.getHangarId())) {
                return ResponseEntity.badRequest().body("A entrega informada nao pertence ao usuario ou ao hangar selecionado.");
            }
            if (drone == null) {
                return ResponseEntity.badRequest().body("O drone informado nao pertence ao hangar selecionado.");
            }
            if (delivery.getStatus() != DeliveryStatus.AGUARDANDO_CONFIRMACAO && delivery.getStatus() != DeliveryStatus.NA_FILA) {
                return ResponseEntity.badRequest().body("A entrega ja foi tratada e nao pode ser movimentada novamente.");
            }
            if (delivery.getWeight() == null || drone.getMaxWeight() == null || loads.get(drone.getId()) + delivery.getWeight() > drone.getMaxWeight()) {
                return ResponseEntity.badRequest().body("A capacidade do drone nao comporta esta movimentacao.");
            }
            loads.put(drone.getId(), loads.get(drone.getId()) + delivery.getWeight());
            delivery.setStatus(DeliveryStatus.EM_DESPACHO);
            delivery.setDroneId(drone.getId());
            entregaRepository.save(delivery);
            drone.setStatus(DroneStatus.EM_DESPACHO);
        }
        drones.forEach(drone -> {
            drone.setCurrentLoad(loads.get(drone.getId()));
            droneRepository.save(drone);
        });
        return ResponseEntity.ok(buildManagement(hangarId, user));
    }

    private ManagementResponse buildManagement(String hangarId, User user) {
        List<EntregaResponse> deliveries = entregaRepository.findByUserId(user.getId()).stream()
                .filter(delivery -> hangarId.equals(delivery.getHangarId())).map(this::toResponse).toList();
        List<DroneResponse> drones = droneRepository.findByUserId(user.getId()).stream()
                .filter(drone -> hangarId.equals(drone.getHangarId())).map(this::toDroneResponse).toList();
        return new ManagementResponse(deliveries, drones);
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
                entrega.getHangarId(),
                entrega.getStatus() == null ? DeliveryStatus.AGUARDANDO_CONFIRMACAO : entrega.getStatus(),
                entrega.getDroneId()
        );
    }

    @PostMapping("/{id}/repartir")
    public ResponseEntity<?> splitDelivery(@PathVariable String id, @RequestBody SplitRequest request, Authentication authentication) {
        User user = getCurrentUser(authentication);
        Entrega original = entregaRepository.findById(id).orElse(null);
        if (original == null) return ResponseEntity.notFound().build();
        if (!user.getId().equals(original.getUserId())) return ResponseEntity.status(403).body("Voce nao pode alterar esta entrega.");
        boolean actuallyInviable = droneRepository.findByUserId(user.getId()).stream()
                .filter(drone -> original.getHangarId().equals(drone.getHangarId()))
                .noneMatch(drone -> drone.getMaxWeight() != null && original.getWeight() != null && original.getWeight() <= drone.getMaxWeight());
        boolean treatableStatus = original.getStatus() == null || original.getStatus() == DeliveryStatus.AGUARDANDO_CONFIRMACAO || original.getStatus() == DeliveryStatus.INVIAVEL;
        if (!actuallyInviable || !treatableStatus || request == null || request.weights() == null || request.weights().size() < 2 || request.weights().stream().anyMatch(weight -> weight == null || weight <= 0)) {
            return ResponseEntity.badRequest().body("Informe pelo menos duas particoes com pesos positivos para uma entrega inviavel.");
        }
        double total = request.weights().stream().mapToDouble(Double::doubleValue).sum();
        if (Math.abs(total - original.getWeight()) > 0.000001) {
            return ResponseEntity.badRequest().body("A soma das particoes deve ser igual ao peso total da entrega.");
        }

        List<Entrega> partitions = request.weights().stream().map(weight -> new Entrega(
                weight, original.getDestinationX(), original.getDestinationY(), original.getPriority(), original.getRecipientName(), original.getHangarId(), original.getUserId()
        )).toList();
        entregaRepository.delete(original);
        return ResponseEntity.ok(partitions.stream().map(entregaRepository::save).map(this::toResponse).toList());
    }

    private DroneResponse toDroneResponse(Drone drone) {
        return new DroneResponse(drone.getId(), drone.getName(), drone.getAutonomy(), drone.getMaxWeight(), drone.getAverageSpeed(), drone.getHangarId(), drone.getModelId(), drone.getStatus() == null ? DroneStatus.DISPONIVEL : drone.getStatus(), drone.getCurrentLoad() == null ? 0.0 : drone.getCurrentLoad());
    }

    public record ManagementResponse(List<EntregaResponse> deliveries, List<DroneResponse> drones) {}
    public record ConfirmRequest(List<Movement> movements) {}
    public record Movement(String deliveryId, String droneId) {}
    public record SplitRequest(List<Double> weights) {}
}
