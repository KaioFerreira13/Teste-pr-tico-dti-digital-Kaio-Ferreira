package com.dtidigital.fretesdrones.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class ModeloRequest {
    @NotBlank
    private String name;
    @NotNull
    @Positive
    private Double autonomy;
    @NotNull
    @Positive
    private Double maxWeight;
    @NotNull
    @Positive
    private Double averageSpeed;
}
