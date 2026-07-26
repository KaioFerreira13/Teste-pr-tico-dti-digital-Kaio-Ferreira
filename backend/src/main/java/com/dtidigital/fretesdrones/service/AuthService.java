package com.dtidigital.fretesdrones.service;

import com.dtidigital.fretesdrones.dto.AuthRequest;
import com.dtidigital.fretesdrones.dto.AuthResponse;
import com.dtidigital.fretesdrones.dto.RegisterRequest;
import com.dtidigital.fretesdrones.exception.InvalidCredentialsException;
import com.dtidigital.fretesdrones.model.Role;
import com.dtidigital.fretesdrones.model.User;
import com.dtidigital.fretesdrones.repository.UserRepository;
import com.dtidigital.fretesdrones.security.JwtUtil;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
            AuthenticationManager authenticationManager,
            JwtUtil jwtUtil,
            UserDetailsService userDetailsService,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public AuthResponse authenticate(AuthRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );
        } catch (AuthenticationException exception) {
            throw new InvalidCredentialsException();
        }
        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getEmail());
        return new AuthResponse(jwtUtil.generateToken(userDetails));
    }

    public void register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Error: Email is already in use!");
        }
        User user = new User(
                request.getName(),
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                Set.of(Role.USER)
        );
        userRepository.save(user);
    }
}

