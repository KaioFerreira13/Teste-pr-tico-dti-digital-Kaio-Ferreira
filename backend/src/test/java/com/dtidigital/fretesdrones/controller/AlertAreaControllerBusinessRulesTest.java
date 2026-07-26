package com.dtidigital.fretesdrones.controller;

import com.dtidigital.fretesdrones.dto.AlertAreaRequest;
import com.dtidigital.fretesdrones.dto.AlertAreaResponse;
import com.dtidigital.fretesdrones.model.*;
import com.dtidigital.fretesdrones.repository.AlertAreaRepository;
import com.dtidigital.fretesdrones.repository.HangarRepository;
import com.dtidigital.fretesdrones.repository.UserRepository;
import com.dtidigital.fretesdrones.security.AuthenticatedUserService;
import com.dtidigital.fretesdrones.service.AlertAreaService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AlertAreaControllerBusinessRulesTest {
    private AlertAreaRepository repository;
    private HangarRepository hangarRepository;
    private AlertAreaController controller;
    private Authentication authentication;

    @BeforeEach
    void setUp() {
        repository = mock(AlertAreaRepository.class);
        hangarRepository = mock(HangarRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        authentication = mock(Authentication.class);
        when(authentication.getName()).thenReturn("user@test.com");
        when(userRepository.findByEmail("user@test.com"))
                .thenReturn(Optional.of(User.builder().id("u1").email("user@test.com").build()));
        when(repository.findByUserId("u1")).thenReturn(List.of());
        when(hangarRepository.findByUserId("u1")).thenReturn(List.of());
        when(repository.save(any(AlertArea.class))).thenAnswer(invocation -> {
            AlertArea area = invocation.getArgument(0);
            if (area.getId() == null) area.setId("a1");
            return area;
        });
        controller = new AlertAreaController(
                new AlertAreaService(repository, hangarRepository),
                new AuthenticatedUserService(userRepository)
        );
    }

    @Test
    void createsAreaWithRoundedCoordinatesAndDescription() {
        AlertAreaResponse response = controller.create(
                request(1.4, 2.6, 8.7, 10.2, "  Obras na avenida  "),
                authentication
        );

        assertEquals(1.0, response.minX());
        assertEquals(3.0, response.minY());
        assertEquals(9.0, response.maxX());
        assertEquals(10.0, response.maxY());
        assertEquals("Obras na avenida", response.description());
        assertEquals(AlertAreaType.CONSTRUCAO, response.type());
        verify(repository).save(any(AlertArea.class));
    }

    @Test
    void refusesAreaContainingHangarIncludingItsBorder() {
        when(hangarRepository.findByUserId("u1")).thenReturn(List.of(
                Hangar.builder().positionX(5).positionY(10).userId("u1").build()
        ));

        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> controller.create(request(0, 0, 5, 10, "Area"), authentication));

        assertEquals("A area selecionada nao pode conter um hangar.", error.getMessage());
        verify(repository, never()).save(any());
    }

    @Test
    void refusesOverlappingAreaButAllowsTouchingBorders() {
        AlertArea existing = area("existing", "u1", 5, 5, 10, 10);
        when(repository.findByUserId("u1")).thenReturn(List.of(existing));

        assertThrows(IllegalArgumentException.class,
                () -> controller.create(request(9, 9, 12, 12, "Sobreposta"), authentication));

        controller.create(request(10, 5, 14, 9, "Encostada"), authentication);
        verify(repository, times(1)).save(any(AlertArea.class));
    }

    @Test
    void updatesAreaWithoutTreatingItselfAsOverlap() {
        AlertArea existing = area("a1", "u1", 1, 1, 4, 4);
        when(repository.findById("a1")).thenReturn(Optional.of(existing));
        when(repository.findByUserId("u1")).thenReturn(List.of(existing));

        AlertAreaResponse response = controller.update(
                "a1", request(2, 2, 5, 5, "Atualizada"), authentication
        );

        assertEquals("Atualizada", response.description());
        assertEquals(2.0, response.minX());
    }

    @Test
    void refusesDeletingAreaOwnedByAnotherUser() {
        when(repository.findById("a1")).thenReturn(Optional.of(area("a1", "other", 1, 1, 4, 4)));

        assertThrows(AccessDeniedException.class, () -> controller.delete("a1", authentication));
        verify(repository, never()).delete(any());
    }

    private AlertAreaRequest request(double minX, double minY, double maxX, double maxY, String description) {
        return new AlertAreaRequest(minX, minY, maxX, maxY, AlertAreaType.CONSTRUCAO, description);
    }

    private AlertArea area(String id, String userId, double minX, double minY, double maxX, double maxY) {
        return AlertArea.builder().id(id).userId(userId).minX(minX).minY(minY)
                .maxX(maxX).maxY(maxY).type(AlertAreaType.INVIAVEL).description("Area").build();
    }
}
