package com.dtidigital.fretesdrones.service;

import com.dtidigital.fretesdrones.model.Hangar;
import com.dtidigital.fretesdrones.model.User;
import com.dtidigital.fretesdrones.repository.HangarRepository;
import org.springframework.stereotype.Service;

@Service
public class HangarAccessService {

    private final HangarRepository hangarRepository;

    public HangarAccessService(HangarRepository hangarRepository) {
        this.hangarRepository = hangarRepository;
    }

    public Hangar getOwned(String hangarId, User user) {
        return hangarRepository.findById(hangarId)
                .filter(hangar -> user.getId().equals(hangar.getUserId()))
                .orElseThrow(() ->
                        new IllegalArgumentException("Selecione um hangar valido do seu cadastro.")
                );
    }
}

