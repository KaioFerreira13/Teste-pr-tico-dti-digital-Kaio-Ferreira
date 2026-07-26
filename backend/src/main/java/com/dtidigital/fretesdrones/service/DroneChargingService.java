package com.dtidigital.fretesdrones.service;

import com.dtidigital.fretesdrones.model.Drone;
import com.dtidigital.fretesdrones.model.DroneStatus;
import com.dtidigital.fretesdrones.repository.DroneRepository;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;

@Service
public class DroneChargingService {

    private static final double CHARGE_PERCENTAGE_PER_MINUTE = 3.0;

    private final DroneRepository droneRepository;
    private final DeliveryAllocationService allocationService;

    public DroneChargingService(
            DroneRepository droneRepository,
            DeliveryAllocationService allocationService
    ) {
        this.droneRepository = droneRepository;
        this.allocationService = allocationService;
    }

    public void recharge(Instant now) {
        droneRepository.findAll().stream()
                .filter(drone -> drone.getStatus() == DroneStatus.RECARREGANDO)
                .forEach(drone -> recharge(drone, now));
    }

    private void recharge(Drone drone, Instant now) {
        double currentBattery = drone.getBatteryLevel() == null
                ? 0.0
                : drone.getBatteryLevel();
        if (currentBattery >= 100.0) {
            makeAvailable(drone);
            return;
        }
        if (drone.getChargingStartedAt() == null) {
            drone.setChargingStartedAt(now);
            droneRepository.save(drone);
            return;
        }
        double elapsedMinutes =
                Duration.between(drone.getChargingStartedAt(), now).toMillis() / 60000.0;
        double batteryLevel = Math.min(
                100.0,
                currentBattery + elapsedMinutes * CHARGE_PERCENTAGE_PER_MINUTE
        );
        drone.setBatteryLevel(batteryLevel);
        drone.setChargingStartedAt(now);
        if (batteryLevel >= 100.0) {
            makeAvailable(drone);
        } else {
            droneRepository.save(drone);
        }
    }

    private void makeAvailable(Drone drone) {
        drone.setBatteryLevel(100.0);
        drone.setChargingStartedAt(null);
        drone.setStatus(DroneStatus.DISPONIVEL);
        droneRepository.save(drone);
        allocationService.allocateConfirmed(drone.getUserId(), drone.getHangarId());
    }
}

