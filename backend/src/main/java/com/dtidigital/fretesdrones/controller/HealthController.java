package com.dtidigital.fretesdrones.controller;

import java.time.Instant;
import java.util.Map;

import com.dtidigital.fretesdrones.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health")
public class HealthController {

	private final UserRepository userRepository;

	@Autowired
	public HealthController(UserRepository userRepository) {
		this.userRepository = userRepository;
	}

	@GetMapping
	public Map<String, Object> health() {
		return Map.of(
				"status", "UP",
				"service", "fretes-drones",
				"timestamp", Instant.now());
	}

	@GetMapping("/db")
	public Map<String, Object> databaseHealth() {
		long userCount = userRepository.count();

		return Map.of(
				"status", "UP",
				"service", "fretes-drones",
				"database", "MongoDB",
				"userCount", userCount,
				"timestamp", Instant.now());
	}

	@GetMapping("/keepalive")
	public Map<String, Object> keepAlive() {
		return databaseHealth();
	}
}
