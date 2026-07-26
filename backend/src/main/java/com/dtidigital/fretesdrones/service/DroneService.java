package com.dtidigital.fretesdrones.service;

import com.dtidigital.fretesdrones.dto.DroneOptionsResponse;
import com.dtidigital.fretesdrones.dto.DroneRequest;
import com.dtidigital.fretesdrones.dto.DroneResponse;
import com.dtidigital.fretesdrones.mapper.DroneMapper;
import com.dtidigital.fretesdrones.model.Drone;
import com.dtidigital.fretesdrones.model.DroneStatus;
import com.dtidigital.fretesdrones.model.User;
import com.dtidigital.fretesdrones.repository.DroneRepository;
import com.dtidigital.fretesdrones.repository.HangarRepository;
import com.dtidigital.fretesdrones.repository.ModeloRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;

@Service
public class DroneService {

    private final DroneRepository droneRepository;
    private final HangarRepository hangarRepository;
    private final ModeloRepository modeloRepository;
    private final DeliveryAllocationService allocationService;
    private final DroneMapper droneMapper;

    public DroneService(
            DroneRepository droneRepository,
            HangarRepository hangarRepository,
            ModeloRepository modeloRepository,
            DeliveryAllocationService allocationService,
            DroneMapper droneMapper
    ) {
        this.droneRepository = droneRepository;
        this.hangarRepository = hangarRepository;
        this.modeloRepository = modeloRepository;
        this.allocationService = allocationService;
        this.droneMapper = droneMapper;
    }

    public List<DroneResponse> findByUser(User user) {
        return droneRepository.findByUserId(user.getId()).stream()
                .map(droneMapper::toResponse)
                .toList();
    }

    public DroneResponse create(DroneRequest request, User user) {
        validateRequest(request, user.getId(), null);
        Drone drone = new Drone(
                request.getName().trim(),
                request.getAutonomy(),
                request.getMaxWeight(),
                request.getAverageSpeed(),
                request.getHangarId(),
                request.getModelId(),
                user.getId()
        );
        return droneMapper.toResponse(droneRepository.save(drone));
    }

    public DroneResponse update(String id, DroneRequest request, User user) {
        Drone drone = getOwnedDrone(id, user);
        validateRequest(request, user.getId(), id);
        drone.setName(request.getName().trim());
        drone.setAutonomy(request.getAutonomy());
        drone.setMaxWeight(request.getMaxWeight());
        drone.setAverageSpeed(request.getAverageSpeed());
        drone.setHangarId(request.getHangarId());
        drone.setModelId(request.getModelId());
        return droneMapper.toResponse(droneRepository.save(drone));
    }

    public void delete(String id, User user) {
        droneRepository.delete(getOwnedDrone(id, user));
    }

    public DroneOptionsResponse getOptions(User user) {
        return new DroneOptionsResponse(
                hangarRepository.findByUserId(user.getId()).stream()
                        .map(hangar -> new DroneOptionsResponse.SimpleOption(hangar.getId(), hangar.getName()))
                        .toList(),
                modeloRepository.findByUserId(user.getId()).stream()
                        .map(model -> new DroneOptionsResponse.SimpleOption(model.getId(), model.getName()))
                        .toList()
        );
    }

    public DroneResponse updateStatus(String id, String requestedStatus, User user) {
        Drone drone = getOwnedDrone(id, user);
        DroneStatus currentStatus = drone.getStatus() == null
                ? DroneStatus.DISPONIVEL
                : drone.getStatus();
        if (!isManuallyChangeable(currentStatus)) {
            throw new IllegalArgumentException(
                    "Somente drones disponiveis ou em manutencao podem ter o status alterado manualmente."
            );
        }
        DroneStatus newStatus;
        try {
            newStatus = DroneStatus.valueOf(requestedStatus.trim().toUpperCase());
        } catch (Exception exception) {
            throw new IllegalArgumentException("Status de drone invalido.");
        }
        if (!isManuallyChangeable(newStatus)) {
            throw new IllegalArgumentException(
                    "O status manual deve ser DISPONIVEL ou EM_MANUTENCAO."
            );
        }
        drone.setStatus(newStatus);
        droneRepository.save(drone);
        if (drone.getStatus() == DroneStatus.DISPONIVEL) {
            allocationService.allocateConfirmed(user.getId(), drone.getHangarId());
        }
        return droneMapper.toResponse(droneRepository.findById(id).orElse(drone));
    }

    private boolean isManuallyChangeable(DroneStatus status) {
        return status == DroneStatus.DISPONIVEL || status == DroneStatus.EM_MANUTENCAO;
    }

    private void validateRequest(DroneRequest request, String userId, String currentId) {
        if (request.getName() == null || request.getName().isBlank()) {
            throw new IllegalArgumentException("Drone name is required");
        }
        if (request.getAutonomy() == null || request.getMaxWeight() == null || request.getAverageSpeed() == null) {
            throw new IllegalArgumentException("All drone technical fields are required");
        }
        if (request.getHangarId() == null || request.getHangarId().isBlank()) {
            throw new IllegalArgumentException("Hangar is required");
        }
        var hangar = hangarRepository.findById(request.getHangarId())
                .orElseThrow(() -> new IllegalArgumentException("Hangar not found"));
        if (!hangar.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Hangar does not belong to current user");
        }
        if (request.getModelId() != null && !request.getModelId().isBlank()) {
            var model = modeloRepository.findById(request.getModelId())
                    .orElseThrow(() -> new IllegalArgumentException("Modelo not found"));
            if (!model.getUserId().equals(userId)) {
                throw new IllegalArgumentException("Modelo does not belong to current user");
            }
        }
        boolean duplicateName = currentId == null
                ? droneRepository.existsByUserIdAndNameIgnoreCase(userId, request.getName().trim())
                : droneRepository.existsByUserIdAndNameIgnoreCaseAndIdNot(userId, request.getName().trim(), currentId);
        if (duplicateName) {
            throw new IllegalArgumentException("Voce ja possui um drone com esse nome.");
        }
    }

    private Drone getOwnedDrone(String id, User user) {
        Drone drone = droneRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Drone nao encontrado."));
        if (!user.getId().equals(drone.getUserId())) {
            throw new AccessDeniedException("Voce nao pode alterar este drone.");
        }
        return drone;
    }
}
