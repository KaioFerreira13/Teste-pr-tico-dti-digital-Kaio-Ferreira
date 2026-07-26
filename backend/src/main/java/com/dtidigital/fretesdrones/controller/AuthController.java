package com.dtidigital.fretesdrones.controller;

import com.dtidigital.fretesdrones.dto.AuthRequest;
import com.dtidigital.fretesdrones.dto.AuthResponse;
import com.dtidigital.fretesdrones.dto.RegisterRequest;
import com.dtidigital.fretesdrones.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public AuthResponse createAuthenticationToken(
            @Valid @RequestBody AuthRequest authRequest
    ) {
        return authService.authenticate(authRequest);
    }

    @PostMapping("/register")
    public ResponseEntity<String> registerUser(
            @Valid @RequestBody RegisterRequest registerRequest
    ) {
        authService.register(registerRequest);
        return ResponseEntity.ok("User registered successfully!");
    }
}
