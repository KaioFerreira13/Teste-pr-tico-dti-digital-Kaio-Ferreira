package com.dtidigital.fretesdrones.dto;

import java.util.List;

public record DroneOptionsResponse(List<SimpleOption> hangars, List<SimpleOption> models) {
    public record SimpleOption(String id, String name) {}
}

