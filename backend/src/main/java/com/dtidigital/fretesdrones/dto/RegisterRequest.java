package com.dtidigital.fretesdrones.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank(message = "O nome e obrigatorio.")
    private String name;
    @NotBlank(message = "O email e obrigatorio.")
    @Email(message = "Informe um email valido.")
    private String email;
    @NotBlank(message = "A senha e obrigatoria.")
    private String password;
}
