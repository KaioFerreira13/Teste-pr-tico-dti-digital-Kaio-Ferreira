package com.dtidigital.fretesdrones.dto;

import java.util.List;

public record DeliveryManagementResponse(
        List<EntregaResponse> deliveries,
        List<DroneResponse> drones
) {}

