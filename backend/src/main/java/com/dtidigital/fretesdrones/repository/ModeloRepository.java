package com.dtidigital.fretesdrones.repository;

import com.dtidigital.fretesdrones.model.Modelo;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ModeloRepository extends MongoRepository<Modelo, String> {
    List<Modelo> findByUserId(String userId);
    boolean existsByUserIdAndNameIgnoreCase(String userId, String name);
    boolean existsByUserIdAndNameIgnoreCaseAndIdNot(String userId, String name, String id);
}
