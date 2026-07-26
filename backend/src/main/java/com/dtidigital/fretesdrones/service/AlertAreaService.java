package com.dtidigital.fretesdrones.service;

import com.dtidigital.fretesdrones.dto.AlertAreaRequest;
import com.dtidigital.fretesdrones.dto.AlertAreaResponse;
import com.dtidigital.fretesdrones.model.AlertArea;
import com.dtidigital.fretesdrones.model.User;
import com.dtidigital.fretesdrones.repository.AlertAreaRepository;
import com.dtidigital.fretesdrones.repository.HangarRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class AlertAreaService {
    private final AlertAreaRepository repository;
    private final HangarRepository hangarRepository;

    public AlertAreaService(AlertAreaRepository repository, HangarRepository hangarRepository) {
        this.repository = repository;
        this.hangarRepository = hangarRepository;
    }

    public List<AlertAreaResponse> findByUser(User user) {
        return repository.findByUserId(user.getId()).stream().map(this::response).toList();
    }

    public AlertAreaResponse create(AlertAreaRequest request, User user) {
        validate(request, user, null);
        return response(repository.save(toArea(null, request, user.getId())));
    }

    public AlertAreaResponse update(String id, AlertAreaRequest request, User user) {
        validate(request, user, id);
        AlertArea area = owned(id, user);
        area.setMinX(minX(request));
        area.setMinY(minY(request));
        area.setMaxX(maxX(request));
        area.setMaxY(maxY(request));
        area.setType(request.type());
        area.setDescription(request.description().trim());
        return response(repository.save(area));
    }

    public void delete(String id, User user) {
        repository.delete(owned(id, user));
    }

    private AlertArea owned(String id, User user) {
        AlertArea area = repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Area de alerta nao encontrada."));
        if (!user.getId().equals(area.getUserId())) {
            throw new AccessDeniedException("Voce nao pode alterar esta area.");
        }
        return area;
    }

    private AlertArea toArea(String id, AlertAreaRequest request, String userId) {
        return AlertArea.builder().id(id)
                .minX(minX(request)).minY(minY(request))
                .maxX(maxX(request)).maxY(maxY(request))
                .type(request.type()).description(request.description().trim()).userId(userId).build();
    }

    private void validate(AlertAreaRequest request, User user, String editingId) {
        if (request.description() == null || request.description().isBlank()) {
            throw new IllegalArgumentException("A descricao da area e obrigatoria.");
        }
        if (minX(request).equals(maxX(request)) || minY(request).equals(maxY(request))) {
            throw new IllegalArgumentException("Selecione uma area com largura e altura.");
        }
        boolean containsHangar = hangarRepository.findByUserId(user.getId()).stream().anyMatch(hangar ->
                hangar.getPositionX() >= minX(request) && hangar.getPositionX() <= maxX(request)
                        && hangar.getPositionY() >= minY(request) && hangar.getPositionY() <= maxY(request));
        if (containsHangar) {
            throw new IllegalArgumentException("A area selecionada nao pode conter um hangar.");
        }
        boolean overlapsArea = repository.findByUserId(user.getId()).stream()
                .filter(area -> editingId == null || !editingId.equals(area.getId()))
                .anyMatch(area ->
                        minX(request) < area.getMaxX() && maxX(request) > area.getMinX()
                                && minY(request) < area.getMaxY() && maxY(request) > area.getMinY());
        if (overlapsArea) {
            throw new IllegalArgumentException("A area selecionada nao pode sobrepor outra area cadastrada.");
        }
    }

    private AlertAreaResponse response(AlertArea area) {
        return new AlertAreaResponse(area.getId(), area.getMinX(), area.getMinY(),
                area.getMaxX(), area.getMaxY(), area.getType(), area.getDescription());
    }

    private Double minX(AlertAreaRequest request) { return (double) Math.min(Math.round(request.minX()), Math.round(request.maxX())); }
    private Double maxX(AlertAreaRequest request) { return (double) Math.max(Math.round(request.minX()), Math.round(request.maxX())); }
    private Double minY(AlertAreaRequest request) { return (double) Math.min(Math.round(request.minY()), Math.round(request.maxY())); }
    private Double maxY(AlertAreaRequest request) { return (double) Math.max(Math.round(request.minY()), Math.round(request.maxY())); }
}
