import api from './api';
import { listHangars } from './hangarService';

const priorityWeight = { ALTA: 0, MEDIA: 1, BAIXA: 2 };
const restrictedDistance = (start, target, areas) => {
  if (!areas.length) return Math.abs(start.x - target.x) + Math.abs(start.y - target.y);
  const blocked = (x, y) => areas.some(area =>
    x >= Math.floor(area.minX) - 1 && x <= Math.ceil(area.maxX) + 1
    && y >= Math.floor(area.minY) - 1 && y <= Math.ceil(area.maxY) + 1);
  const xs = [start.x, target.x, ...areas.flatMap(area => [area.minX - 2, area.maxX + 2])];
  const ys = [start.y, target.y, ...areas.flatMap(area => [area.minY - 2, area.maxY + 2])];
  const margin = Math.max(8, Math.abs(start.x - target.x) + Math.abs(start.y - target.y));
  const minX = Math.floor(Math.min(...xs) - margin), maxX = Math.ceil(Math.max(...xs) + margin);
  const minY = Math.floor(Math.min(...ys) - margin), maxY = Math.ceil(Math.max(...ys) + margin);
  const queue = [{ ...start, distance: 0 }];
  const visited = new Set([`${start.x},${start.y}`]);
  while (queue.length) {
    const current = queue.shift();
    if (current.x === target.x && current.y === target.y) return current.distance;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = current.x + dx, y = current.y + dy, key = `${x},${y}`;
      if (x < minX || x > maxX || y < minY || y > maxY || visited.has(key)) continue;
      if (blocked(x, y) && !(x === target.x && y === target.y)) continue;
      visited.add(key);
      queue.push({ x, y, distance: current.distance + 1 });
    }
  }
  return Number.POSITIVE_INFINITY;
};

const normalizeManagement = data => ({
  deliveries: (data?.deliveries || [])
    .filter(delivery => delivery.status !== 'EM_DESPACHO' && delivery.status !== 'EM_ROTA')
    .map(delivery =>
      delivery.status === 'NA_FILA' ? { ...delivery, status: 'CONFIRMADA' } : delivery,
    ),
  drones: data?.drones || [],
});

export const listDeliveries = async () => {
  const { data } = await api.get('/entregas');
  return Array.isArray(data) ? data : [];
};

export const getDeliveryRegistrationData = async () => {
  const [deliveries, hangars] = await Promise.all([listDeliveries(), listHangars()]);
  return { deliveries, hangars };
};

export const saveDelivery = async (id, form) => {
  const payload = {
    weight: Number(form.weight),
    destinationX: Number(form.destinationX),
    destinationY: Number(form.destinationY),
    priority: form.priority,
    recipientName: form.recipientName.trim(),
    hangarId: form.hangarId,
  };

  const { data } = id
    ? await api.put(`/entregas/${id}`, payload)
    : await api.post('/entregas', payload);

  return data;
};

export const deleteDelivery = id => api.delete(`/entregas/${id}`);

export const toDeliveryForm = delivery => ({
  weight: delivery.weight ?? '',
  destinationX: delivery.destinationX ?? '',
  destinationY: delivery.destinationY ?? '',
  priority: delivery.priority || 'MEDIA',
  recipientName: delivery.recipientName || '',
  hangarId: delivery.hangarId || '',
});

export const getEditableDeliveries = deliveries =>
  deliveries
    .filter(delivery => delivery.status !== 'EM_DESPACHO' && delivery.status !== 'ENTREGUE')
    .sort(
      (a, b) =>
        (priorityWeight[a.priority] ?? 3) - (priorityWeight[b.priority] ?? 3),
    );

export const groupDeliveriesByStatus = (deliveries, statuses) =>
  statuses.map(status => ({
    ...status,
    items: deliveries.filter(delivery => delivery.status === status.value),
  }));

export const getDeliveryManagement = async hangarId => {
  const { data } = await api.get(`/entregas/gerenciamento/${hangarId}`);
  return normalizeManagement(data);
};

export const confirmDeliveryDispatch = async (hangarId, deliveryIds) => {
  const { data } = await api.post(`/entregas/gerenciamento/${hangarId}/confirmar`, {
    deliveryIds,
  });
  return normalizeManagement(data);
};

export const clearDeliveryQueue = async hangarId => {
  const { data } = await api.post(`/entregas/gerenciamento/${hangarId}/limpar-fila`);
  return normalizeManagement(data);
};

export const splitDelivery = async (id, weights) => {
  const { data } = await api.post(`/entregas/${id}/repartir`, { weights });
  return data;
};

export const allocatePendingDeliveries = (deliveries, drones, hangar, restrictedAreas = []) => {
  const priority = { BAIXA: 1, MEDIA: 2, ALTA: 3 };
  const pending = deliveries
    .filter(delivery => delivery.status === 'AGUARDANDO_CONFIRMACAO')
    .sort((a, b) => (priority[b.priority] || 0) - (priority[a.priority] || 0));
  const nextDeliveries = deliveries.map(delivery => ({ ...delivery }));

  pending.forEach(delivery => {
    const destinationRestricted = restrictedAreas.some(area =>
      delivery.destinationX >= area.minX && delivery.destinationX <= area.maxX
      && delivery.destinationY >= area.minY && delivery.destinationY <= area.maxY);
    const roundTripDistance = hangar
      ? 2 * restrictedDistance(
        { x: hangar.positionX, y: hangar.positionY },
        { x: delivery.destinationX, y: delivery.destinationY },
        restrictedAreas,
      )
      : Number.POSITIVE_INFINITY;
    const supportsWeight = drones.some(drone => delivery.weight <= drone.maxWeight);
    const supportsDistance = drones.some(drone => roundTripDistance <= drone.autonomy);
    const canEverFit = !destinationRestricted && drones.some(
      drone => delivery.weight <= drone.maxWeight && roundTripDistance <= drone.autonomy,
    );
    const target = nextDeliveries.find(item => item.id === delivery.id);
    target.status = canEverFit ? 'CONFIRMADA' : 'INVIAVEL';
    target.droneId = null;
    if (canEverFit) {
      delete target.inviabilityReason;
    } else if (destinationRestricted) {
      target.inviabilityReason = 'AREA_RESTRITA';
    } else if (!supportsWeight && !supportsDistance) {
      target.inviabilityReason = 'PESO_E_DISTANCIA';
    } else if (!supportsWeight) {
      target.inviabilityReason = 'PESO';
    } else if (!supportsDistance) {
      target.inviabilityReason = 'DISTANCIA';
    } else {
      target.inviabilityReason = 'PESO_E_DISTANCIA';
    }
  });

  return { deliveries: nextDeliveries, drones };
};
