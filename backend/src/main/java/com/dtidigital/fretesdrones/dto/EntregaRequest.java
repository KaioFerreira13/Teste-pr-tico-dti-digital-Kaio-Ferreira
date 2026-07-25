package com.dtidigital.fretesdrones.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class EntregaRequest {
    @NotNull(message = "O peso do pacote e obrigatorio.")
    @Positive(message = "O peso do pacote deve ser positivo.")
    private Double weight;
    @NotNull(message = "A posicao X de destino e obrigatoria.")
    private Integer destinationX;
    @NotNull(message = "A posicao Y de destino e obrigatoria.")
    private Integer destinationY;
    @NotBlank(message = "A prioridade da entrega e obrigatoria.")
    private String priority;
    @NotBlank(message = "O nome do destinatario e obrigatorio.")
    @Size(min = 2, message = "O nome do destinatario deve ter pelo menos 2 caracteres.")
    private String recipientName;
    @NotBlank(message = "O hangar de origem e obrigatorio.")
    private String hangarId;
}
