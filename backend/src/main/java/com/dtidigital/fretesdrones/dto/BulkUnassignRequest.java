package com.dtidigital.fretesdrones.dto;

import java.util.List;

public record BulkUnassignRequest(List<String> deliveryIds) {}

