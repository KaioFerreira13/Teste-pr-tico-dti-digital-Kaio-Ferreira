package com.dtidigital.fretesdrones.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class HangarRequest {
    @NotBlank(message = "O nome do hangar e obrigatorio.")
    private String name;
    @NotNull(message = "A posicao X do hangar e obrigatoria.")
    private Integer positionX;
    @NotNull(message = "A posicao Y do hangar e obrigatoria.")
    private Integer positionY;
}
