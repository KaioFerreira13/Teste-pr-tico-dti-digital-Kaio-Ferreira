import api from './api';

export const listHangars = async () => {
  const { data } = await api.get('/hangars/me');
  return Array.isArray(data) ? data : [];
};

export const saveHangar = async (id, form) => {
  const payload = {
    name: form.name.trim(),
    positionX: Number(form.positionX),
    positionY: Number(form.positionY),
  };

  const { data } = id
    ? await api.put(`/hangars/${id}`, payload)
    : await api.post('/hangars', payload);

  return data;
};

export const deleteHangar = id => api.delete(`/hangars/${id}`);

export const toHangarForm = hangar => ({
  name: hangar.name || '',
  positionX: hangar.positionX ?? '',
  positionY: hangar.positionY ?? '',
});

