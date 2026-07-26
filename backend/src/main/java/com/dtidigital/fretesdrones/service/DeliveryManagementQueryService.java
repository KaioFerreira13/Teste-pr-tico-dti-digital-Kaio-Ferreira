package com.dtidigital.fretesdrones.service;

import com.dtidigital.fretesdrones.dto.DeliveryManagementResponse;
import com.dtidigital.fretesdrones.mapper.DeliveryMapper;
import com.dtidigital.fretesdrones.mapper.DroneMapper;
import com.dtidigital.fretesdrones.model.Drone;
import com.dtidigital.fretesdrones.model.Entrega;
import com.dtidigital.fretesdrones.model.User;
import com.dtidigital.fretesdrones.repository.DroneRepository;
import com.dtidigital.fretesdrones.repository.EntregaRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DeliveryManagementQueryService {

    private final EntregaRepository entregaRepository;
    private final DroneRepository droneRepository;
    private final HangarAccessService hangarAccessService;
    private final DeliveryMapper deliveryMapper;
    private final DroneMapper droneMapper;

    public DeliveryManagementQueryService(
            EntregaRepository entregaRepository,
            DroneRepository droneRepository,
            HangarAccessService hangarAccessService,
            DeliveryMapper deliveryMapper,
            DroneMapper droneMapper
    ) {
        this.entregaRepository = entregaRepository;
        this.droneRepository = droneRepository;
        this.hangarAccessService = hangarAccessService;
        this.deliveryMapper = deliveryMapper;
        this.droneMapper = droneMapper;
    }

    public DeliveryManagementResponse getManagement(String hangarId, User user) {
        hangarAccessService.getOwned(hangarId, user);
        return new DeliveryManagementResponse(
                findDeliveries(user, hangarId).stream()
                        .map(deliveryMapper::toResponse)
                        .toList(),
                findDrones(user, hangarId).stream()
                        .map(droneMapper::toResponse)
                        .toList()
        );
    }

    public List<Entrega> findDeliveries(User user, String hangarId) {
        return entregaRepository.findByUserId(user.getId()).stream()
                .filter(delivery -> hangarId.equals(delivery.getHangarId()))
                .toList();
    }

    public List<Drone> findDrones(User user, String hangarId) {
        return droneRepository.findByUserId(user.getId()).stream()
                .filter(drone -> hangarId.equals(drone.getHangarId()))
                .toList();
    }
}

