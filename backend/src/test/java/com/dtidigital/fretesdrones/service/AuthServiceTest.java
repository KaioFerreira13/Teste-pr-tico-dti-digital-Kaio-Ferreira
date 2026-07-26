package com.dtidigital.fretesdrones.service;

import com.dtidigital.fretesdrones.dto.AuthRequest;
import com.dtidigital.fretesdrones.dto.AuthResponse;
import com.dtidigital.fretesdrones.dto.RegisterRequest;
import com.dtidigital.fretesdrones.exception.InvalidCredentialsException;
import com.dtidigital.fretesdrones.model.Role;
import com.dtidigital.fretesdrones.model.User;
import com.dtidigital.fretesdrones.repository.UserRepository;
import com.dtidigital.fretesdrones.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AuthServiceTest {

    private AuthenticationManager authenticationManager;
    private JwtUtil jwtUtil;
    private UserDetailsService userDetailsService;
    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private AuthService service;

    @BeforeEach
    void setUp() {
        authenticationManager = mock(AuthenticationManager.class);
        jwtUtil = mock(JwtUtil.class);
        userDetailsService = mock(UserDetailsService.class);
        userRepository = mock(UserRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        service = new AuthService(
                authenticationManager,
                jwtUtil,
                userDetailsService,
                userRepository,
                passwordEncoder
        );
    }

    @Test
    void authenticatesAndReturnsGeneratedToken() {
        AuthRequest request = authRequest();
        UserDetails details = mock(UserDetails.class);
        when(userDetailsService.loadUserByUsername("user@test.com")).thenReturn(details);
        when(jwtUtil.generateToken(details)).thenReturn("jwt-token");

        AuthResponse response = service.authenticate(request);

        assertEquals("jwt-token", response.getToken());
        verify(authenticationManager).authenticate(any());
    }

    @Test
    void convertsAuthenticationFailureToDomainSpecificException() {
        AuthRequest request = authRequest();
        when(authenticationManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("bad credentials"));

        InvalidCredentialsException exception = assertThrows(
                InvalidCredentialsException.class,
                () -> service.authenticate(request)
        );

        assertEquals("Invalid credentials", exception.getMessage());
        verify(userDetailsService, never()).loadUserByUsername(any());
    }

    @Test
    void refusesRegisteringDuplicateEmail() {
        RegisterRequest request = registerRequest();
        when(userRepository.existsByEmail("user@test.com")).thenReturn(true);

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> service.register(request)
        );

        assertEquals("Error: Email is already in use!", exception.getMessage());
        verify(userRepository, never()).save(any());
    }

    @Test
    void encodesPasswordAndRegistersUserRole() {
        RegisterRequest request = registerRequest();
        when(passwordEncoder.encode("Password@1")).thenReturn("encoded-password");
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);

        service.register(request);

        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        assertEquals("Usuario", savedUser.getName());
        assertEquals("user@test.com", savedUser.getEmail());
        assertEquals("encoded-password", savedUser.getPassword());
        assertEquals(Set.of(Role.USER), savedUser.getRoles());
    }

    private AuthRequest authRequest() {
        AuthRequest request = new AuthRequest();
        request.setEmail("user@test.com");
        request.setPassword("Password@1");
        return request;
    }

    private RegisterRequest registerRequest() {
        RegisterRequest request = new RegisterRequest();
        request.setName("Usuario");
        request.setEmail("user@test.com");
        request.setPassword("Password@1");
        return request;
    }
}
