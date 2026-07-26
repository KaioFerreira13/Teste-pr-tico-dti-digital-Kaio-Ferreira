package com.dtidigital.fretesdrones.mapper;

import com.dtidigital.fretesdrones.dto.HangarResponse;
import com.dtidigital.fretesdrones.model.Hangar;
import org.springframework.stereotype.Component;

@Component
public class HangarMapper {

    public HangarResponse toResponse(Hangar hangar) {
        return new HangarResponse(
                hangar.getId(),
                hangar.getName(),
                hangar.getPositionX(),
                hangar.getPositionY()
        );
    }
}

