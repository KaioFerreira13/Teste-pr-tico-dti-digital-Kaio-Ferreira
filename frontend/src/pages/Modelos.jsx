import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { getErrorMessage } from '../utils/errorMessage';

const initialForm = {
  name: '',
  autonomy: '',
  maxWeight: '',
  averageSpeed: ''
};

const Modelos = () => {
  const [models, setModels] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadModels = async () => {
    setLoading(true);
    try {
      const response = await api.get('/modelos/me');
      setModels(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(getErrorMessage(err, 'Nao foi possivel carregar os modelos.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
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
      averageSpeed: Number(form.averageSpeed)
    };

    try {
      if (editingId) {
        await api.put(`/modelos/${editingId}`, payload);
      } else {
        await api.post('/modelos', payload);
      }
      resetForm();
      await loadModels();
    } catch (err) {
      setError(getErrorMessage(err, 'Nao foi possivel salvar o modelo.'));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (model) => {
    setEditingId(model.id);
    setForm({
      name: model.name || '',
      autonomy: model.autonomy ?? '',
      maxWeight: model.maxWeight ?? '',
      averageSpeed: model.averageSpeed ?? ''
    });
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/modelos/${id}`);
      await loadModels();
    } catch (err) {
      setError(getErrorMessage(err, 'Nao foi possivel excluir o modelo.'));
    }
  };

  return (
    <div style={{ minHeight: '100%', background: '#f4f7fb', color: '#10233d' }}>
      <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0 }}>Modelos</h1>
            <p style={{ margin: '8px 0 0', color: '#58708d' }}>Cadastre os modelos de drone do seu operador.</p>
          </div>
          <Link to="/dashboard" style={{ padding: '10px 16px', borderRadius: '10px', background: '#0f5bd7', color: 'white', textDecoration: 'none' }}>
            Voltar ao dashboard
          </Link>
        </div>

        {error && <div style={{ marginBottom: '16px', padding: '12px 14px', borderRadius: '10px', background: '#ffe3e3', color: '#9d1c1c' }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: '20px' }}>
          <form onSubmit={handleSubmit} style={{ background: 'white', padding: '24px', borderRadius: '18px', boxShadow: '0 10px 30px rgba(16,35,61,0.08)' }}>
            <h2 style={{ marginTop: 0 }}>{editingId ? 'Editar modelo' : 'Novo modelo'}</h2>
            <label style={{ display: 'block', marginBottom: '12px' }}>
              <span style={{ display: 'block', marginBottom: '6px' }}>Nome</span>
              <input name="name" value={form.name} onChange={handleChange} required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #d6deea' }} />
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
            <h2 style={{ marginTop: 0 }}>Seus modelos</h2>
            {loading ? (
              <p>Carregando...</p>
            ) : models.length === 0 ? (
              <p>Você ainda não cadastrou nenhum modelo.</p>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {models.map((model) => (
                  <article key={model.id} style={{ padding: '16px', borderRadius: '12px', background: '#f7f9fc', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{model.name}</div>
                      <div style={{ color: '#58708d' }}>Autonomia: {model.autonomy}</div>
                      <div style={{ color: '#58708d' }}>Peso Max: {model.maxWeight}</div>
                      <div style={{ color: '#58708d' }}>Velocidade Media: {model.averageSpeed}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'start' }}>
                      <button onClick={() => handleEdit(model)} style={{ padding: '8px 12px', border: 'none', borderRadius: '8px', background: '#dbeafe', cursor: 'pointer' }}>
                        Editar
                      </button>
                      <button onClick={() => handleDelete(model.id)} style={{ padding: '8px 12px', border: 'none', borderRadius: '8px', background: '#fee2e2', cursor: 'pointer' }}>
                        Excluir
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Modelos;
