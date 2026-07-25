import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { getErrorMessage } from '../utils/errorMessage';

const initialForm = {
  name: '',
  autonomy: '',
  maxWeight: '',
  averageSpeed: '',
  hangarId: '',
  modelId: ''
};

const Drones = () => {
  const [drones, setDrones] = useState([]);
  const [hangars, setHangars] = useState([]);
  const [models, setModels] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [dronesRes, optionsRes] = await Promise.all([
        api.get('/drones/me'),
        api.get('/modelos/me')
      ]);

      setDrones(Array.isArray(dronesRes.data) ? dronesRes.data : []);
      setModels(Array.isArray(optionsRes.data) ? optionsRes.data : []);
      const hangarsRes = await api.get('/hangars/me');
      setHangars(Array.isArray(hangarsRes.data) ? hangarsRes.data : []);
    } catch (err) {
      setError(getErrorMessage(err, 'Nao foi possivel carregar os drones.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === 'modelId') {
      if (!value) {
        setForm((current) => ({ ...current, modelId: '', autonomy: '', maxWeight: '', averageSpeed: '' }));
        return;
      }

      const selectedModel = models.find((model) => model.id === value);
      if (!selectedModel) {
        setForm((current) => ({ ...current, modelId: value }));
        return;
      }

      setForm((current) => ({
        ...current,
        modelId: value,
        autonomy: String(selectedModel.autonomy ?? ''),
        maxWeight: String(selectedModel.maxWeight ?? ''),
        averageSpeed: String(selectedModel.averageSpeed ?? '')
      }));
      return;
    }

    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      autonomy: Number(form.autonomy),
      maxWeight: Number(form.maxWeight),
      averageSpeed: Number(form.averageSpeed),
      hangarId: form.hangarId,
      modelId: form.modelId || null
    };

    try {
      if (editingId) {
        await api.put(`/drones/${editingId}`, payload);
      } else {
        await api.post('/drones', payload);
      }
      resetForm();
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err, 'Nao foi possivel salvar o drone.'));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (drone) => {
    setEditingId(drone.id);
    setForm({
      name: drone.name || '',
      autonomy: drone.autonomy ?? '',
      maxWeight: drone.maxWeight ?? '',
      averageSpeed: drone.averageSpeed ?? '',
      hangarId: drone.hangarId || '',
      modelId: drone.modelId || ''
    });
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/drones/${id}`);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err, 'Nao foi possivel excluir o drone.'));
    }
  };

  const dronesByHangar = hangars.reduce((accumulator, hangar) => {
    accumulator[hangar.id] = drones.filter((drone) => drone.hangarId === hangar.id);
    return accumulator;
  }, {});

  return (
    <div style={{ minHeight: '100%', background: '#f4f7fb', color: '#10233d' }}>
      <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0 }}>Drones</h1>
            <p style={{ margin: '8px 0 0', color: '#58708d' }}>Cadastre manualmente ou importe dados de um modelo salvo.</p>
          </div>
          <Link to="/dashboard" style={{ padding: '10px 16px', borderRadius: '10px', background: '#0f5bd7', color: 'white', textDecoration: 'none' }}>
            Voltar ao dashboard
          </Link>
        </div>

        {error && <div style={{ marginBottom: '16px', padding: '12px 14px', borderRadius: '10px', background: '#ffe3e3', color: '#9d1c1c' }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: '20px' }}>
          <form onSubmit={handleSubmit} style={{ background: 'white', padding: '24px', borderRadius: '18px', boxShadow: '0 10px 30px rgba(16,35,61,0.08)' }}>
            <h2 style={{ marginTop: 0 }}>{editingId ? 'Editar drone' : 'Novo drone'}</h2>

            <label style={{ display: 'block', marginBottom: '12px' }}>
              <span style={{ display: 'block', marginBottom: '6px' }}>Nome</span>
              <input name="name" value={form.name} onChange={handleChange} required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #d6deea' }} />
            </label>

            <label style={{ display: 'block', marginBottom: '12px' }}>
              <span style={{ display: 'block', marginBottom: '6px' }}>Importar modelo salvo</span>
              <select name="modelId" value={form.modelId} onChange={handleChange} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #d6deea', background: 'white' }}>
                <option value="">Preencher manualmente</option>
                {models.map((model) => (
                  <option key={model.id} value={model.id}>{model.name}</option>
                ))}
              </select>
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label>
                <span style={{ display: 'block', marginBottom: '6px' }}>Autonomia</span>
                <input name="autonomy" type="number" step="0.01" value={form.autonomy} onChange={handleChange} required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #d6deea' }} />
              </label>
              <label>
                <span style={{ display: 'block', marginBottom: '6px' }}>Peso Max</span>
                <input name="maxWeight" type="number" step="0.01" value={form.maxWeight} onChange={handleChange} required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #d6deea' }} />
              </label>
            </div>

            <label style={{ display: 'block', marginTop: '12px' }}>
              <span style={{ display: 'block', marginBottom: '6px' }}>Velocidade Media</span>
              <input name="averageSpeed" type="number" step="0.01" value={form.averageSpeed} onChange={handleChange} required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #d6deea' }} />
            </label>

            <label style={{ display: 'block', marginTop: '12px' }}>
              <span style={{ display: 'block', marginBottom: '6px' }}>Hangar armazenado</span>
              <select name="hangarId" value={form.hangarId} onChange={handleChange} required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #d6deea', background: 'white' }}>
                <option value="">Selecione um hangar</option>
                {hangars.map((hangar) => (
                  <option key={hangar.id} value={hangar.id}>{hangar.name}</option>
                ))}
              </select>
            </label>

            <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
              <button type="submit" disabled={saving} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '10px', background: '#0f5bd7', color: 'white', cursor: 'pointer' }}>
                {saving ? 'Salvando...' : editingId ? 'Atualizar' : 'Cadastrar'}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} style={{ padding: '12px 16px', border: '1px solid #d6deea', borderRadius: '10px', background: 'white', cursor: 'pointer' }}>
                  Cancelar
                </button>
              )}
            </div>
          </form>

          <section style={{ background: 'white', padding: '24px', borderRadius: '18px', boxShadow: '0 10px 30px rgba(16,35,61,0.08)' }}>
            <h2 style={{ marginTop: 0 }}>Seus drones</h2>
            {loading ? (
              <p>Carregando...</p>
            ) : drones.length === 0 ? (
              <p>Voce ainda nao cadastrou nenhum drone.</p>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {hangars.map((hangar) => {
                  const groupedDrones = dronesByHangar[hangar.id] || [];

                  return (
                    <section key={hangar.id} style={{ padding: '18px', borderRadius: '14px', background: '#f7f9fc' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div>
                          <h3 style={{ margin: 0 }}>{hangar.name}</h3>
                          <p style={{ margin: '4px 0 0', color: '#58708d' }}>Posicao: ({hangar.positionX}, {hangar.positionY})</p>
                        </div>
                        <span style={{ padding: '6px 10px', borderRadius: '999px', background: '#dbeafe', color: '#0f5bd7', fontWeight: 700 }}>
                          {groupedDrones.length} drone(s)
                        </span>
                      </div>

                      {groupedDrones.length === 0 ? (
                        <p style={{ margin: 0, color: '#58708d' }}>Nenhum drone armazenado neste hangar.</p>
                      ) : (
                        <div style={{ display: 'grid', gap: '10px' }}>
                          {groupedDrones.map((drone) => (
                            <article key={drone.id} style={{ padding: '16px', borderRadius: '12px', background: 'white', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                              <div>
                                <div style={{ fontWeight: 700 }}>{drone.name}</div>
                                <div style={{ color: '#58708d' }}>Autonomia: {drone.autonomy}</div>
                                <div style={{ color: '#58708d' }}>Peso Max: {drone.maxWeight}</div>
                                <div style={{ color: '#58708d' }}>Velocidade Media: {drone.averageSpeed}</div>
                              </div>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'start' }}>
                                <button onClick={() => handleEdit(drone)} style={{ padding: '8px 12px', border: 'none', borderRadius: '8px', background: '#dbeafe', cursor: 'pointer' }}>
                                  Editar
                                </button>
                                <button onClick={() => handleDelete(drone.id)} style={{ padding: '8px 12px', border: 'none', borderRadius: '8px', background: '#fee2e2', cursor: 'pointer' }}>
                                  Excluir
                                </button>
                              </div>
                            </article>
                          ))}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Drones;
