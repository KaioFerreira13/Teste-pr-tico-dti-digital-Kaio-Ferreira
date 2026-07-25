import api from './api';
import { listHangars } from './hangarService';

const priorityWeight = { ALTA: 0, MEDIA: 1, BAIXA: 2 };

const normalizeManagement = data => ({
  deliveries: (data?.deliveries || [])
    .filter(delivery => delivery.status !== 'EM_DESPACHO' && delivery.status !== 'EM_ROTA')
    .map(delivery =>
      delivery.status === 'NA_FILA' ? { ...delivery, status: 'CONFIRMADA' } : delivery,
    ),
  drones: data?.drones || [],
});

export const listDeliveries = async () => {
  const { data } = await api.get('/entregas/me');
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

export const allocatePendingDeliveries = (deliveries, drones, hangar) => {
  const priority = { BAIXA: 1, MEDIA: 2, ALTA: 3 };
  const pending = deliveries
    .filter(delivery => delivery.status === 'AGUARDANDO_CONFIRMACAO')
    .sort((a, b) => (priority[b.priority] || 0) - (priority[a.priority] || 0));
  const nextDeliveries = deliveries.map(delivery => ({ ...delivery }));

  pending.forEach(delivery => {
    const roundTripDistance = hangar
      ? 2 *
        (Math.abs(delivery.destinationX - hangar.positionX) +
          Math.abs(delivery.destinationY - hangar.positionY))
      : Number.POSITIVE_INFINITY;
    const canEverFit = drones.some(
      drone => delivery.weight <= drone.maxWeight && roundTripDistance <= drone.autonomy,
    );
    const target = nextDeliveries.find(item => item.id === delivery.id);
    target.status = canEverFit ? 'CONFIRMADA' : 'INVIAVEL';
    target.droneId = null;
  });

  return { deliveries: nextDeliveries, drones };
};

