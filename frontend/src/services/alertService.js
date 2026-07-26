import api from './api';

export const listAlertAreas = async () => {
  const { data } = await api.get('/alertas');
  return Array.isArray(data) ? data : [];
};

export const saveAlertArea = async (id, area) => {
  const { data } = id
    ? await api.put(`/alertas/${id}`, area)
    : await api.post('/alertas', area);
  return data;
};

export const deleteAlertArea = id => api.delete(`/alertas/${id}`);
