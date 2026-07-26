package com.dtidigital.fretesdrones.controller;

import com.dtidigital.fretesdrones.dto.HangarRequest;
import com.dtidigital.fretesdrones.dto.ModeloRequest;
import com.dtidigital.fretesdrones.mapper.HangarMapper;
import com.dtidigital.fretesdrones.mapper.ModeloMapper;
import com.dtidigital.fretesdrones.model.Hangar;
import com.dtidigital.fretesdrones.model.Modelo;
import com.dtidigital.fretesdrones.model.User;
import com.dtidigital.fretesdrones.repository.HangarRepository;
import com.dtidigital.fretesdrones.repository.ModeloRepository;
import com.dtidigital.fretesdrones.repository.UserRepository;
import com.dtidigital.fretesdrones.security.AuthenticatedUserService;
import com.dtidigital.fretesdrones.service.HangarService;
import com.dtidigital.fretesdrones.service.ModeloService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.AccessDeniedException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CadastroBusinessRulesTest {

    private HangarRepository hangarRepository;
    private ModeloRepository modeloRepository;
    private HangarController hangarController;
    private ModeloController modeloController;
    private Authentication authentication;

    @BeforeEach
    void setUp() {
        hangarRepository = mock(HangarRepository.class);
        modeloRepository = mock(ModeloRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        hangarController = new HangarController(
                new HangarService(hangarRepository, new HangarMapper()),
                new AuthenticatedUserService(userRepository)
        );
        modeloController = new ModeloController(
                new ModeloService(modeloRepository, new ModeloMapper()),
                new AuthenticatedUserService(userRepository)
        );
        authentication = mock(Authentication.class);
        when(authentication.getName()).thenReturn("user@test.com");
        when(userRepository.findByEmail("user@test.com"))
                .thenReturn(Optional.of(User.builder().id("u1").email("user@test.com").build()));
    }

    @Test
    void refusesCreatingTwoHangarsAtSamePosition() {
        HangarRequest request = hangarRequest();
        when(hangarRepository.existsByPositionXAndPositionY(10, 20)).thenReturn(true);

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> hangarController.createHangar(request, authentication)
        );

        assertEquals("Ja existe um hangar nessa posicao.", exception.getMessage());
        verify(hangarRepository, never()).save(any());
    }

    @Test
    void refusesMovingHangarToOccupiedPosition() {
        Hangar hangar = Hangar.builder().id("h1").userId("u1").build();
        when(hangarRepository.findById("h1")).thenReturn(Optional.of(hangar));
        when(hangarRepository.existsByPositionXAndPositionYAndIdNot(10, 20, "h1")).thenReturn(true);

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> hangarController.updateHangar("h1", hangarRequest(), authentication)
        );

        assertEquals("Ja existe um hangar nessa posicao.", exception.getMessage());
        verify(hangarRepository, never()).save(hangar);
    }

    @Test
    void refusesChangingHangarOwnedByAnotherUser() {
        Hangar hangar = Hangar.builder().id("h1").userId("other-user").build();
        when(hangarRepository.findById("h1")).thenReturn(Optional.of(hangar));

        assertThrows(
                AccessDeniedException.class,
                () -> hangarController.updateHangar("h1", hangarRequest(), authentication)
        );
        verify(hangarRepository, never()).save(hangar);
    }

    @Test
    void refusesDeletingHangarOwnedByAnotherUser() {
        Hangar hangar = Hangar.builder().id("h1").userId("other-user").build();
        when(hangarRepository.findById("h1")).thenReturn(Optional.of(hangar));

        assertThrows(
                AccessDeniedException.class,
                () -> hangarController.deleteHangar("h1", authentication)
        );
        verify(hangarRepository, never()).delete(hangar);
    }

    @Test
    void returnsNotFoundForUnknownHangar() {
        when(hangarRepository.findById("missing")).thenReturn(Optional.empty());

        assertThrows(
                java.util.NoSuchElementException.class,
                () -> hangarController.deleteHangar("missing", authentication)
        );
    }

    @Test
    void refusesDuplicateModelNameForSameUser() {
        ModeloRequest request = modelRequest();
        when(modeloRepository.existsByUserIdAndNameIgnoreCase("u1", "Modelo A")).thenReturn(true);

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> modeloController.createModel(request, authentication)
        );

        assertEquals("Voce ja possui um modelo com esse nome.", exception.getMessage());
        verify(modeloRepository, never()).save(any());
    }

    @Test
    void refusesRenamingModelToExistingName() {
        Modelo model = Modelo.builder().id("m1").userId("u1").build();
        when(modeloRepository.findById("m1")).thenReturn(Optional.of(model));
        when(modeloRepository.existsByUserIdAndNameIgnoreCaseAndIdNot("u1", "Modelo A", "m1")).thenReturn(true);

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> modeloController.updateModel("m1", modelRequest(), authentication)
        );

        assertEquals("Voce ja possui um modelo com esse nome.", exception.getMessage());
        verify(modeloRepository, never()).save(model);
    }

    @Test
    void refusesChangingModelOwnedByAnotherUser() {
        Modelo model = Modelo.builder().id("m1").userId("other-user").build();
        when(modeloRepository.findById("m1")).thenReturn(Optional.of(model));

        assertThrows(
                AccessDeniedException.class,
                () -> modeloController.updateModel("m1", modelRequest(), authentication)
        );
        verify(modeloRepository, never()).save(model);
    }

    @Test
    void refusesDeletingModelOwnedByAnotherUser() {
        Modelo model = Modelo.builder().id("m1").userId("other-user").build();
        when(modeloRepository.findById("m1")).thenReturn(Optional.of(model));

        assertThrows(
                AccessDeniedException.class,
                () -> modeloController.deleteModel("m1", authentication)
        );
        verify(modeloRepository, never()).delete(model);
    }

    @Test
    void returnsNotFoundForUnknownModel() {
        when(modeloRepository.findById("missing")).thenReturn(Optional.empty());

        assertThrows(
                java.util.NoSuchElementException.class,
                () -> modeloController.deleteModel("missing", authentication)
        );
    }

    private HangarRequest hangarRequest() {
        HangarRequest request = new HangarRequest();
        request.setName("Hangar A");
        request.setPositionX(10);
        request.setPositionY(20);
        return request;
    }

    private ModeloRequest modelRequest() {
        ModeloRequest request = new ModeloRequest();
        request.setName("Modelo A");
        request.setAutonomy(100.0);
        request.setMaxWeight(20.0);
        request.setAverageSpeed(50.0);
        return request;
    }
}
