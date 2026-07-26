package com.dtidigital.fretesdrones.mapper;

import com.dtidigital.fretesdrones.dto.ModeloResponse;
import com.dtidigital.fretesdrones.model.Modelo;
import org.springframework.stereotype.Component;

@Component
public class ModeloMapper {

    public ModeloResponse toResponse(Modelo model) {
        return new ModeloResponse(
                model.getId(),
                model.getName(),
                model.getAutonomy(),
                model.getMaxWeight(),
                model.getAverageSpeed()
        );
    }
}

