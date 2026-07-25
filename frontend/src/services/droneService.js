import api from './api';
import { listHangars } from './hangarService';
import { listModels } from './modelService';

export const listDrones = async () => {
  const { data } = await api.get('/drones/me');
  return Array.isArray(data) ? data : [];
};

export const getDroneRegistrationData = async () => {
  const [drones, models, hangars] = await Promise.all([
    listDrones(),
    listModels(),
    listHangars(),
  ]);
  return { drones, models, hangars };
};

export const saveDrone = async (id, form) => {
  const payload = {
    name: form.name.trim(),
    autonomy: Number(form.autonomy),
    maxWeight: Number(form.maxWeight),
    averageSpeed: Number(form.averageSpeed),
    hangarId: form.hangarId,
    modelId: form.modelId || null,
  };

  const { data } = id
    ? await api.put(`/drones/${id}`, payload)
    : await api.post('/drones', payload);

  return data;
};

export const deleteDrone = id => api.delete(`/drones/${id}`);

export const updateDroneStatus = async (id, status) => {
  const { data } = await api.patch(`/drones/${id}/status`, { status });
  return data;
};

export const unassignDroneDeliveries = (id, deliveryIds) =>
  api.post(`/drones/${id}/entregas/remover`, { deliveryIds });

export const startDroneFreight = async id => {
  const { data } = await api.post(`/drones/${id}/iniciar-frete`);
  return data;
};

export const resetDroneOperation = async id => {
  const { data } = await api.post(`/drones/${id}/reset`);
  return data;
};

export const toDroneForm = drone => ({
  name: drone.name || '',
  autonomy: drone.autonomy ?? '',
  maxWeight: drone.maxWeight ?? '',
  averageSpeed: drone.averageSpeed ?? '',
  hangarId: drone.hangarId || '',
  modelId: drone.modelId || '',
});

export const applyModelToDroneForm = (form, modelId, models) => {
  if (!modelId) {
    return { ...form, modelId: '', autonomy: '', maxWeight: '', averageSpeed: '' };
  }

  const model = models.find(item => item.id === modelId);
  if (!model) return { ...form, modelId };

  return {
    ...form,
    modelId,
    autonomy: String(model.autonomy ?? ''),
    maxWeight: String(model.maxWeight ?? ''),
    averageSpeed: String(model.averageSpeed ?? ''),
  };
};

export const groupDronesByHangar = (hangars, drones) =>
  Object.fromEntries(
    hangars.map(hangar => [
      hangar.id,
      drones.filter(drone => drone.hangarId === hangar.id),
    ]),
  );

