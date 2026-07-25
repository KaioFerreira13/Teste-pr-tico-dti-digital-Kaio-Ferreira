import { describe, expect, it } from 'vitest';
import {
  getDeliveryMetrics,
  getDroneMetrics,
  getDroneRanking,
} from '../../services/dashboardService';

describe('dashboardService', () => {
  it('calculates delivery metrics and drone ranking', () => {
    const drones = [{ id: 'd1', routeDistance: 10, averageSpeed: 20 }];
    const deliveries = [
      { id: 'e1', droneId: 'd1', status: 'ENTREGUE', priority: 'ALTA' },
      { id: 'e2', droneId: null, status: 'CONFIRMADA', priority: 'MEDIA' },
    ];

    const metrics = getDeliveryMetrics(deliveries, drones);
    const ranking = getDroneRanking(deliveries, drones);

    expect(metrics.map(item => item.value)).toEqual([2, 1, '30 min', 1]);
    expect(ranking[0]).toMatchObject({ deliveredCount: 1, efficiencyScore: 0.1 });
  });

  it('summarizes operational drone states and load', () => {
    const metrics = getDroneMetrics([
      { status: 'DISPONIVEL', currentLoad: 2.5 },
      { status: 'EM_ROTA', currentLoad: 3 },
    ]);

    expect(metrics.map(item => item.value)).toEqual([2, 1, 0, 1, '5.5 kg']);
  });
});

