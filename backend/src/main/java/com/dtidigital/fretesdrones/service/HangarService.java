package com.dtidigital.fretesdrones.service;

import com.dtidigital.fretesdrones.dto.HangarRequest;
import com.dtidigital.fretesdrones.dto.HangarResponse;
import com.dtidigital.fretesdrones.mapper.HangarMapper;
import com.dtidigital.fretesdrones.model.Hangar;
import com.dtidigital.fretesdrones.model.User;
import com.dtidigital.fretesdrones.repository.HangarRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;

@Service
public class HangarService {

    private final HangarRepository hangarRepository;
    private final HangarMapper hangarMapper;

    public HangarService(HangarRepository hangarRepository, HangarMapper hangarMapper) {
        this.hangarRepository = hangarRepository;
        this.hangarMapper = hangarMapper;
    }

    public List<HangarResponse> findByUser(User user) {
        return hangarRepository.findByUserId(user.getId()).stream()
                .map(hangarMapper::toResponse)
                .toList();
    }

    public HangarResponse create(HangarRequest request, User user) {
        validateRequiredFields(request);
        if (hangarRepository.existsByPositionXAndPositionY(
                request.getPositionX(),
                request.getPositionY()
        )) {
            throw new IllegalArgumentException("Ja existe um hangar nessa posicao.");
        }
        Hangar hangar = new Hangar(
                request.getName().trim(),
                request.getPositionX(),
                request.getPositionY(),
                user.getId()
        );
        return hangarMapper.toResponse(hangarRepository.save(hangar));
    }

    public HangarResponse update(String id, HangarRequest request, User user) {
        Hangar hangar = getOwned(id, user, "Voce nao pode alterar este hangar.");
        validateRequiredFields(request);
        if (hangarRepository.existsByPositionXAndPositionYAndIdNot(
                request.getPositionX(),
                request.getPositionY(),
                id
        )) {
            throw new IllegalArgumentException("Ja existe um hangar nessa posicao.");
        }
        hangar.setName(request.getName().trim());
        hangar.setPositionX(request.getPositionX());
        hangar.setPositionY(request.getPositionY());
        return hangarMapper.toResponse(hangarRepository.save(hangar));
    }

    public void delete(String id, User user) {
        Hangar hangar = getOwned(id, user, "Voce nao pode excluir este hangar.");
        hangarRepository.delete(hangar);
    }

    private Hangar getOwned(String id, User user, String forbiddenMessage) {
        Hangar hangar = hangarRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Hangar nao encontrado."));
        if (!user.getId().equals(hangar.getUserId())) {
            throw new AccessDeniedException(forbiddenMessage);
        }
        return hangar;
    }

    private void validateRequiredFields(HangarRequest request) {
        if (request.getName() == null || request.getName().isBlank()) {
            throw new IllegalArgumentException("Hangar name is required");
        }
        if (request.getPositionX() == null || request.getPositionY() == null) {
            throw new IllegalArgumentException("Hangar position is required");
        }
    }
}

