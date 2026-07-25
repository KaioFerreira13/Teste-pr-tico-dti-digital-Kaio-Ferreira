package com.dtidigital.fretesdrones.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class DroneRequest {
    @NotBlank(message = "O nome do drone e obrigatorio.")
    private String name;
    @NotNull(message = "A autonomia e obrigatoria.")
    @Positive(message = "A autonomia deve ser positiva.")
    private Double autonomy;
    @NotNull(message = "O peso maximo e obrigatorio.")
    @Positive(message = "O peso maximo deve ser positivo.")
    private Double maxWeight;
    @NotNull(message = "A velocidade media e obrigatoria.")
    @Positive(message = "A velocidade media deve ser positiva.")
    private Double averageSpeed;
    @NotBlank(message = "O hangar e obrigatorio.")
    private String hangarId;
    private String modelId;
}
