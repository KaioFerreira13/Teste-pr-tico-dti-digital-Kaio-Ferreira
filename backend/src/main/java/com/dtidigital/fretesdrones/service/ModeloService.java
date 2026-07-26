package com.dtidigital.fretesdrones.service;

import com.dtidigital.fretesdrones.dto.ModeloRequest;
import com.dtidigital.fretesdrones.dto.ModeloResponse;
import com.dtidigital.fretesdrones.mapper.ModeloMapper;
import com.dtidigital.fretesdrones.model.Modelo;
import com.dtidigital.fretesdrones.model.User;
import com.dtidigital.fretesdrones.repository.ModeloRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;

@Service
public class ModeloService {

    private final ModeloRepository modeloRepository;
    private final ModeloMapper modeloMapper;

    public ModeloService(ModeloRepository modeloRepository, ModeloMapper modeloMapper) {
        this.modeloRepository = modeloRepository;
        this.modeloMapper = modeloMapper;
    }

    public List<ModeloResponse> findByUser(User user) {
        return modeloRepository.findByUserId(user.getId()).stream()
                .map(modeloMapper::toResponse)
                .toList();
    }

    public ModeloResponse create(ModeloRequest request, User user) {
        validateRequiredFields(request);
        if (modeloRepository.existsByUserIdAndNameIgnoreCase(
                user.getId(),
                request.getName().trim()
        )) {
            throw new IllegalArgumentException("Voce ja possui um modelo com esse nome.");
        }
        Modelo model = new Modelo(
                request.getName().trim(),
                request.getAutonomy(),
                request.getMaxWeight(),
                request.getAverageSpeed(),
                user.getId()
        );
        return modeloMapper.toResponse(modeloRepository.save(model));
    }

    public ModeloResponse update(String id, ModeloRequest request, User user) {
        Modelo model = getOwned(id, user, "Voce nao pode alterar este modelo.");
        validateRequiredFields(request);
        if (modeloRepository.existsByUserIdAndNameIgnoreCaseAndIdNot(
                user.getId(),
                request.getName().trim(),
                id
        )) {
            throw new IllegalArgumentException("Voce ja possui um modelo com esse nome.");
        }
        model.setName(request.getName().trim());
        model.setAutonomy(request.getAutonomy());
        model.setMaxWeight(request.getMaxWeight());
        model.setAverageSpeed(request.getAverageSpeed());
        return modeloMapper.toResponse(modeloRepository.save(model));
    }

    public void delete(String id, User user) {
        Modelo model = getOwned(id, user, "Voce nao pode excluir este modelo.");
        modeloRepository.delete(model);
    }

    private Modelo getOwned(String id, User user, String forbiddenMessage) {
        Modelo model = modeloRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Modelo nao encontrado."));
        if (!user.getId().equals(model.getUserId())) {
            throw new AccessDeniedException(forbiddenMessage);
        }
        return model;
    }

    private void validateRequiredFields(ModeloRequest request) {
        if (request.getName() == null || request.getName().isBlank()) {
            throw new IllegalArgumentException("Model name is required");
        }
        if (request.getAutonomy() == null
                || request.getMaxWeight() == null
                || request.getAverageSpeed() == null) {
            throw new IllegalArgumentException("All model fields are required");
        }
    }
}

