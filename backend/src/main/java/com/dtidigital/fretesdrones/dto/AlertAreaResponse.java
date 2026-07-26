package com.dtidigital.fretesdrones.dto;

import com.dtidigital.fretesdrones.model.AlertAreaType;

public record AlertAreaResponse(
        String id,
        Double minX,
        Double minY,
        Double maxX,
        Double maxY,
        AlertAreaType type,
        String description
) {}
