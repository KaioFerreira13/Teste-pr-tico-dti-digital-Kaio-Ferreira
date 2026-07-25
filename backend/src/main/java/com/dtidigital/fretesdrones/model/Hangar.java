package com.dtidigital.fretesdrones.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "hangars")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Hangar {

    @Id
    private String id;
    private String name;
    private Integer positionX;
    private Integer positionY;
    private String userId;

    public Hangar(String name, Integer positionX, Integer positionY, String userId) {
        this.name = name;
        this.positionX = positionX;
        this.positionY = positionY;
        this.userId = userId;
    }
}
