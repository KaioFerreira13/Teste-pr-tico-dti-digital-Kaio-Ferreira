package com.dtidigital.fretesdrones.service;

import com.dtidigital.fretesdrones.model.DeliveryStatus;
import com.dtidigital.fretesdrones.model.Entrega;
import com.dtidigital.fretesdrones.repository.EntregaRepository;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

class DeliveryCompletionServiceTest {

    @Test
    void completesOnlyDeliveriesWhoseEstimatedTimeHasPassed() {
        EntregaRepository repository = mock(EntregaRepository.class);
        Instant now = Instant.parse("2026-07-25T20:00:00Z");
        Entrega finished = Entrega.builder()
                .id("e1")
                .status(DeliveryStatus.EM_DESPACHO)
                .estimatedDeliveryAt(now.minusSeconds(1))
                .build();
        Entrega pending = Entrega.builder()
                .id("e2")
                .status(DeliveryStatus.EM_DESPACHO)
                .estimatedDeliveryAt(now.plusSeconds(60))
                .build();
        when(repository.findAll()).thenReturn(List.of(finished, pending));

        new DeliveryCompletionService(repository).completeDueDeliveries(now);

        assertEquals(DeliveryStatus.ENTREGUE, finished.getStatus());
        assertEquals(DeliveryStatus.EM_DESPACHO, pending.getStatus());
        verify(repository).save(finished);
        verify(repository, never()).save(pending);
    }
}

