package com.dtidigital.fretesdrones.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "hangars")
public class Hangar {

    @Id
    private String id;
    private String name;
    private Integer positionX;
    private Integer positionY;
    private String userId;

    public Hangar() {
    }

    public Hangar(String name, Integer positionX, Integer positionY, String userId) {
        this.name = name;
        this.positionX = positionX;
        this.positionY = positionY;
        this.userId = userId;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getPositionX() {
        return positionX;
    }

    public void setPositionX(Integer positionX) {
        this.positionX = positionX;
    }

    public Integer getPositionY() {
        return positionY;
    }

    public void setPositionY(Integer positionY) {
        this.positionY = positionY;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }
}
