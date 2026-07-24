package com.dtidigital.fretesdrones.repository;

import com.dtidigital.fretesdrones.model.Hangar;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface HangarRepository extends MongoRepository<Hangar, String> {
    List<Hangar> findByUserId(String userId);
    boolean existsByPositionXAndPositionY(Integer positionX, Integer positionY);
    boolean existsByPositionXAndPositionYAndIdNot(Integer positionX, Integer positionY, String id);
}
