package com.dtidigital.fretesdrones.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class HangarRequest {
    @NotBlank
    private String name;
    @NotNull
    private Integer positionX;
    @NotNull
    private Integer positionY;
}
