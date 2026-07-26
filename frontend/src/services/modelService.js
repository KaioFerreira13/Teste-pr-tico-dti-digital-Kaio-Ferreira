import api from './api';

export const listModels = async () => {
  const { data } = await api.get('/modelos');
  return Array.isArray(data) ? data : [];
};

export const saveModel = async (id, form) => {
  const payload = {
    name: form.name.trim(),
    autonomy: Number(form.autonomy),
    maxWeight: Number(form.maxWeight),
    averageSpeed: Number(form.averageSpeed),
  };

  const { data } = id
    ? await api.put(`/modelos/${id}`, payload)
    : await api.post('/modelos', payload);

  return data;
};

export const deleteModel = id => api.delete(`/modelos/${id}`);

export const toModelForm = model => ({
  name: model.name || '',
  autonomy: model.autonomy ?? '',
  maxWeight: model.maxWeight ?? '',
  averageSpeed: model.averageSpeed ?? '',
});
