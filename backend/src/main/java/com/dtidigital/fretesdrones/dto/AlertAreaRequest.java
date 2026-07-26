package com.dtidigital.fretesdrones.dto;

import com.dtidigital.fretesdrones.model.AlertAreaType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;

public record AlertAreaRequest(
        @NotNull Double minX,
        @NotNull Double minY,
        @NotNull Double maxX,
        @NotNull Double maxY,
        @NotNull AlertAreaType type,
        @NotBlank String description
) {}
