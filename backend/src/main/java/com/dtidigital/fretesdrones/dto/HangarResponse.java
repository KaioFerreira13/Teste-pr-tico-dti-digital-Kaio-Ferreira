package com.dtidigital.fretesdrones.dto;

public class HangarResponse {
    private String id;
    private String name;
    private Integer positionX;
    private Integer positionY;

    public HangarResponse(String id, String name, Integer positionX, Integer positionY) {
        this.id = id;
        this.name = name;
        this.positionX = positionX;
        this.positionY = positionY;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public Integer getPositionX() {
        return positionX;
    }

    public Integer getPositionY() {
        return positionY;
    }
}
