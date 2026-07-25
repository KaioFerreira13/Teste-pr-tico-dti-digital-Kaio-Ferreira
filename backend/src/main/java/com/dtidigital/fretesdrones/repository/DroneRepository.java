package com.dtidigital.fretesdrones.repository;

import com.dtidigital.fretesdrones.model.Drone;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface DroneRepository extends MongoRepository<Drone, String> {
    List<Drone> findByUserId(String userId);
    boolean existsByUserIdAndNameIgnoreCase(String userId, String name);
    boolean existsByUserIdAndNameIgnoreCaseAndIdNot(String userId, String name, String id);
}
