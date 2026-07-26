package com.dtidigital.fretesdrones.routing;

import com.dtidigital.fretesdrones.model.Entrega;

import java.util.List;

public record RoutePlan(List<Entrega> deliveries, double distance) {}

