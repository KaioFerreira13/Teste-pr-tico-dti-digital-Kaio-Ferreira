package com.dtidigital.fretesdrones.controller;

import com.dtidigital.fretesdrones.repository.UserRepository;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class HealthControllerTest {

	private final UserRepository userRepository = mock(UserRepository.class);
	private final HealthController controller = new HealthController(userRepository);

	@Test
	void returnsBasicHealthWithoutHittingDatabase() {
		var response = controller.health();

		assertEquals("UP", response.get("status"));
		assertEquals("fretes-drones", response.get("service"));
	}

	@Test
	void keepAliveTouchesDatabaseAndReportsDbStatus() {
		when(userRepository.count()).thenReturn(12L);

		var response = controller.databaseHealth();

		assertEquals("UP", response.get("status"));
		assertEquals("MongoDB", response.get("database"));
		assertEquals(12L, response.get("userCount"));
		verify(userRepository).count();
	}

	@Test
	void keepAliveDelegatesToDatabaseHealth() {
		when(userRepository.count()).thenReturn(3L);

		var response = controller.keepAlive();

		assertEquals("UP", response.get("status"));
		assertEquals("MongoDB", response.get("database"));
		assertEquals(3L, response.get("userCount"));
		verify(userRepository).count();
	}
}
