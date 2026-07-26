package com.dtidigital.fretesdrones.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "alert_areas")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AlertArea {
    @Id
    private String id;
    private Double minX;
    private Double minY;
    private Double maxX;
    private Double maxY;
    private AlertAreaType type;
    private String description;
    private String userId;
}
