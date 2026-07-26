package com.dtidigital.fretesdrones.service;

import com.dtidigital.fretesdrones.dto.EntregaRequest;
import com.dtidigital.fretesdrones.dto.EntregaResponse;
import com.dtidigital.fretesdrones.mapper.DeliveryMapper;
import com.dtidigital.fretesdrones.model.*;
import com.dtidigital.fretesdrones.repository.EntregaRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;

@Service
public class DeliveryService {

    private final EntregaRepository entregaRepository;
    private final HangarAccessService hangarAccessService;
    private final DeliveryMapper deliveryMapper;

    public DeliveryService(
            EntregaRepository entregaRepository,
            HangarAccessService hangarAccessService,
            DeliveryMapper deliveryMapper
    ) {
        this.entregaRepository = entregaRepository;
        this.hangarAccessService = hangarAccessService;
        this.deliveryMapper = deliveryMapper;
    }

    public List<EntregaResponse> findByUser(User user) {
        return entregaRepository.findByUserId(user.getId()).stream()
                .map(deliveryMapper::toResponse)
                .toList();
    }

    public EntregaResponse create(EntregaRequest request, User user) {
        DeliveryPriority priority = parsePriority(request.getPriority());
        Hangar hangar = hangarAccessService.getOwned(request.getHangarId(), user);
        Entrega delivery = new Entrega(
                request.getWeight(),
                request.getDestinationX(),
                request.getDestinationY(),
                priority,
                request.getRecipientName().trim(),
                hangar.getId(),
                user.getId()
        );
        delivery.setCodigo(nextCode());
        return deliveryMapper.toResponse(entregaRepository.save(delivery));
    }

    public EntregaResponse update(String id, EntregaRequest request, User user) {
        Entrega delivery = getOwned(id, user);
        if (delivery.getStatus() == DeliveryStatus.EM_DESPACHO
                || delivery.getStatus() == DeliveryStatus.ENTREGUE) {
            throw new IllegalArgumentException("Entregas ja despachadas nao podem ser editadas.");
        }
        DeliveryPriority priority = parsePriority(request.getPriority());
        Hangar hangar = hangarAccessService.getOwned(request.getHangarId(), user);
        delivery.setWeight(request.getWeight());
        delivery.setDestinationX(request.getDestinationX());
        delivery.setDestinationY(request.getDestinationY());
        delivery.setPriority(priority);
        delivery.setRecipientName(request.getRecipientName().trim());
        delivery.setHangarId(hangar.getId());
        return deliveryMapper.toResponse(entregaRepository.save(delivery));
    }

    public void delete(String id, User user) {
        entregaRepository.delete(getOwned(id, user));
    }

    public Entrega getOwned(String id, User user) {
        Entrega delivery = entregaRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Entrega nao encontrada."));
        if (!user.getId().equals(delivery.getUserId())) {
            throw new AccessDeniedException("Voce nao pode alterar esta entrega.");
        }
        return delivery;
    }

    public int nextCode() {
        return entregaRepository.findTopByOrderByCodigoDesc()
                .map(Entrega::getCodigo)
                .map(code -> code + 1)
                .orElse(0);
    }

    private DeliveryPriority parsePriority(String priority) {
        try {
            return DeliveryPriority.valueOf(priority.trim().toUpperCase());
        } catch (Exception exception) {
            throw new IllegalArgumentException("A prioridade deve ser baixa, media ou alta.");
        }
    }
}

