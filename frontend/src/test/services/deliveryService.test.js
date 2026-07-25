import { describe, expect, it } from 'vitest';
import {
  allocatePendingDeliveries,
  getEditableDeliveries,
  groupDeliveriesByStatus,
} from '../../services/deliveryService';

describe('deliveryService', () => {
  it('groups deliveries using the provided status definitions', () => {
    const statuses = [
      { value: 'CONFIRMADA', label: 'Confirmada' },
      { value: 'ENTREGUE', label: 'Entregue' },
    ];
    const deliveries = [
      { id: '1', status: 'ENTREGUE' },
      { id: '2', status: 'CONFIRMADA' },
    ];

    const groups = groupDeliveriesByStatus(deliveries, statuses);

    expect(groups[0].items).toEqual([deliveries[1]]);
    expect(groups[1].items).toEqual([deliveries[0]]);
  });

  it('keeps editable deliveries ordered by priority', () => {
    const deliveries = [
      { id: '1', status: 'CONFIRMADA', priority: 'BAIXA' },
      { id: '2', status: 'CONFIRMADA', priority: 'ALTA' },
      { id: '3', status: 'ENTREGUE', priority: 'ALTA' },
    ];

    expect(getEditableDeliveries(deliveries).map(item => item.id)).toEqual(['2', '1']);
  });

  it('marks a delivery as viable only when a drone supports its route and weight', () => {
    const hangar = { positionX: 0, positionY: 0 };
    const drones = [{ maxWeight: 10, autonomy: 20 }];
    const deliveries = [
      {
        id: '1',
        status: 'AGUARDANDO_CONFIRMACAO',
        priority: 'ALTA',
        weight: 5,
        destinationX: 2,
        destinationY: 2,
      },
      {
        id: '2',
        status: 'AGUARDANDO_CONFIRMACAO',
        priority: 'BAIXA',
        weight: 15,
        destinationX: 1,
        destinationY: 1,
      },
    ];

    const result = allocatePendingDeliveries(deliveries, drones, hangar);

    expect(result.deliveries.find(item => item.id === '1').status).toBe('CONFIRMADA');
    expect(result.deliveries.find(item => item.id === '2').status).toBe('INVIAVEL');
  });
});

