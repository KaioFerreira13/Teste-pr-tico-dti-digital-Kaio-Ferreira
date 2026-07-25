import { listDeliveries } from './deliveryService';
import { listDrones } from './droneService';
import { listHangars } from './hangarService';
import { listModels } from './modelService';

export const getDashboardData = async () => {
  const [deliveries, drones, hangars] = await Promise.all([
    listDeliveries(),
    listDrones(),
    listHangars(),
  ]);
  return { deliveries, drones, hangars };
};

export const getDroneDashboardData = async () => {
  const [drones, deliveries, hangars, models] = await Promise.all([
    listDrones(),
    listDeliveries(),
    listHangars(),
    listModels(),
  ]);
  return { drones, deliveries, hangars, models };
};

export const getDeliveryMetrics = (deliveries, drones) => {
  const delivered = deliveries.filter(item => item.status === 'ENTREGUE');
  const durations = delivered
    .map(item => {
      const drone = drones.find(entry => entry.id === item.droneId);
      const distance = Number(drone?.routeDistance || 0);
      const speed = Number(drone?.averageSpeed || 0);
      return distance && speed ? (distance / speed) * 60 * 60 * 1000 : null;
    })
    .filter(value => value !== null);
  const averageMinutes = durations.length
    ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length / 60000)
    : 0;

  return [
    { label: 'Entregas cadastradas', value: deliveries.length },
    { label: 'Entregas realizadas', value: delivered.length },
    { label: 'Tempo medio por entrega', value: delivered.length ? `${averageMinutes} min` : '0 min' },
    { label: 'Prioridade alta', value: deliveries.filter(item => item.priority === 'ALTA').length },
  ];
};

export const getDroneRanking = (deliveries, drones) =>
  drones
    .map(drone => {
      const deliveredCount = deliveries.filter(
        delivery => delivery.droneId === drone.id && delivery.status === 'ENTREGUE',
      ).length;
      const routeDistance = Number(drone.routeDistance || 0);
      const averageSpeed = Number(drone.averageSpeed || 0);
      return {
        drone,
        deliveredCount,
        routeDistance,
        averageSpeed,
        efficiencyScore: deliveredCount / Math.max(routeDistance, 1),
      };
    })
    .filter(item => item.deliveredCount > 0)
    .sort((a, b) => b.efficiencyScore - a.efficiencyScore)
    .slice(0, 5);

export const getDroneMetrics = drones => [
  { label: 'Drones cadastrados', value: drones.length },
  {
    label: 'Disponiveis',
    value: drones.filter(drone => !drone.status || drone.status === 'DISPONIVEL').length,
  },
  {
    label: 'Em despacho',
    value: drones.filter(drone => drone.status === 'EM_DESPACHO').length,
  },
  { label: 'Em rota', value: drones.filter(drone => drone.status === 'EM_ROTA').length },
  {
    label: 'Carga total alocada',
    value: `${drones.reduce((sum, drone) => sum + Number(drone.currentLoad || 0), 0).toFixed(1)} kg`,
  },
];

