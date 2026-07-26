package com.dtidigital.fretesdrones.repository;

import com.dtidigital.fretesdrones.model.AlertArea;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface AlertAreaRepository extends MongoRepository<AlertArea, String> {
    List<AlertArea> findByUserId(String userId);
}
