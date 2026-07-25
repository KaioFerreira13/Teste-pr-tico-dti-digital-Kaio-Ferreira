package com.dtidigital.fretesdrones.repository;

import com.dtidigital.fretesdrones.model.Entrega;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface EntregaRepository extends MongoRepository<Entrega, String> {
    List<Entrega> findByUserId(String userId);
}
