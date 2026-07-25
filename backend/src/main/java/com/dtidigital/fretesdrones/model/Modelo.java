package com.dtidigital.fretesdrones.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "modelos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Modelo {

    @Id
    private String id;
    private String name;
    private Double autonomy;
    private Double maxWeight;
    private Double averageSpeed;
    private String userId;

    public Modelo(String name, Double autonomy, Double maxWeight, Double averageSpeed, String userId) {
        this.name = name;
        this.autonomy = autonomy;
        this.maxWeight = maxWeight;
        this.averageSpeed = averageSpeed;
        this.userId = userId;
    }
}
