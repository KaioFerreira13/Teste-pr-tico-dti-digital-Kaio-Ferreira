package com.dtidigital.fretesdrones.controller;

import com.dtidigital.fretesdrones.dto.HangarRequest;
import com.dtidigital.fretesdrones.dto.ModeloRequest;
import com.dtidigital.fretesdrones.model.Hangar;
import com.dtidigital.fretesdrones.model.Modelo;
import com.dtidigital.fretesdrones.model.User;
import com.dtidigital.fretesdrones.repository.HangarRepository;
import com.dtidigital.fretesdrones.repository.ModeloRepository;
import com.dtidigital.fretesdrones.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
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
        hangarController = new HangarController(hangarRepository, userRepository);
        modeloController = new ModeloController(modeloRepository, userRepository);
        authentication = mock(Authentication.class);
        when(authentication.getName()).thenReturn("user@test.com");
        when(userRepository.findByEmail("user@test.com"))
                .thenReturn(Optional.of(User.builder().id("u1").email("user@test.com").build()));
    }

    @Test
    void refusesCreatingTwoHangarsAtSamePosition() {
        HangarRequest request = hangarRequest();
        when(hangarRepository.existsByPositionXAndPositionY(10, 20)).thenReturn(true);

        ResponseEntity<?> response = hangarController.createHangar(request, authentication);

        assertEquals(400, response.getStatusCode().value());
        assertEquals("Ja existe um hangar nessa posicao.", response.getBody());
        verify(hangarRepository, never()).save(any());
    }

    @Test
    void refusesMovingHangarToOccupiedPosition() {
        Hangar hangar = Hangar.builder().id("h1").userId("u1").build();
        when(hangarRepository.findById("h1")).thenReturn(Optional.of(hangar));
        when(hangarRepository.existsByPositionXAndPositionYAndIdNot(10, 20, "h1")).thenReturn(true);

        ResponseEntity<?> response = hangarController.updateHangar("h1", hangarRequest(), authentication);

        assertEquals(400, response.getStatusCode().value());
        assertEquals("Ja existe um hangar nessa posicao.", response.getBody());
        verify(hangarRepository, never()).save(hangar);
    }

    @Test
    void refusesChangingHangarOwnedByAnotherUser() {
        Hangar hangar = Hangar.builder().id("h1").userId("other-user").build();
        when(hangarRepository.findById("h1")).thenReturn(Optional.of(hangar));

        ResponseEntity<?> response = hangarController.updateHangar("h1", hangarRequest(), authentication);

        assertEquals(403, response.getStatusCode().value());
        verify(hangarRepository, never()).save(hangar);
    }

    @Test
    void refusesDeletingHangarOwnedByAnotherUser() {
        Hangar hangar = Hangar.builder().id("h1").userId("other-user").build();
        when(hangarRepository.findById("h1")).thenReturn(Optional.of(hangar));

        ResponseEntity<?> response = hangarController.deleteHangar("h1", authentication);

        assertEquals(403, response.getStatusCode().value());
        verify(hangarRepository, never()).delete(hangar);
    }

    @Test
    void returnsNotFoundForUnknownHangar() {
        when(hangarRepository.findById("missing")).thenReturn(Optional.empty());

        ResponseEntity<?> response = hangarController.deleteHangar("missing", authentication);

        assertEquals(404, response.getStatusCode().value());
    }

    @Test
    void refusesDuplicateModelNameForSameUser() {
        ModeloRequest request = modelRequest();
        when(modeloRepository.existsByUserIdAndNameIgnoreCase("u1", "Modelo A")).thenReturn(true);

        ResponseEntity<?> response = modeloController.createModel(request, authentication);

        assertEquals(400, response.getStatusCode().value());
        assertEquals("Voce ja possui um modelo com esse nome.", response.getBody());
        verify(modeloRepository, never()).save(any());
    }

    @Test
    void refusesRenamingModelToExistingName() {
        Modelo model = Modelo.builder().id("m1").userId("u1").build();
        when(modeloRepository.findById("m1")).thenReturn(Optional.of(model));
        when(modeloRepository.existsByUserIdAndNameIgnoreCaseAndIdNot("u1", "Modelo A", "m1")).thenReturn(true);

        ResponseEntity<?> response = modeloController.updateModel("m1", modelRequest(), authentication);

        assertEquals(400, response.getStatusCode().value());
        assertEquals("Voce ja possui um modelo com esse nome.", response.getBody());
        verify(modeloRepository, never()).save(model);
    }

    @Test
    void refusesChangingModelOwnedByAnotherUser() {
        Modelo model = Modelo.builder().id("m1").userId("other-user").build();
        when(modeloRepository.findById("m1")).thenReturn(Optional.of(model));

        ResponseEntity<?> response = modeloController.updateModel("m1", modelRequest(), authentication);

        assertEquals(403, response.getStatusCode().value());
        verify(modeloRepository, never()).save(model);
    }

    @Test
    void refusesDeletingModelOwnedByAnotherUser() {
        Modelo model = Modelo.builder().id("m1").userId("other-user").build();
        when(modeloRepository.findById("m1")).thenReturn(Optional.of(model));

        ResponseEntity<?> response = modeloController.deleteModel("m1", authentication);

        assertEquals(403, response.getStatusCode().value());
        verify(modeloRepository, never()).delete(model);
    }

    @Test
    void returnsNotFoundForUnknownModel() {
        when(modeloRepository.findById("missing")).thenReturn(Optional.empty());

        ResponseEntity<?> response = modeloController.deleteModel("missing", authentication);

        assertEquals(404, response.getStatusCode().value());
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
