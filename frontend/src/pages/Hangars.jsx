import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { getErrorMessage } from '../utils/errorMessage';

const initialForm = { name: '', positionX: '', positionY: '' };

const Hangars = () => {
  const [hangars, setHangars] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadHangars = async () => {
    setLoading(true);
    try {
      const response = await api.get('/hangars/me');
      setHangars(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(getErrorMessage(err, 'Nao foi possivel carregar seus hangares.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHangars();
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
      positionX: Number(form.positionX),
      positionY: Number(form.positionY)
    };

    try {
      if (editingId) {
        await api.put(`/hangars/${editingId}`, payload);
      } else {
        await api.post('/hangars', payload);
      }
      resetForm();
      await loadHangars();
    } catch (err) {
      setError(getErrorMessage(err, 'Nao foi possivel salvar o hangar.'));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (hangar) => {
    setEditingId(hangar.id);
    setForm({
      name: hangar.name || '',
      positionX: hangar.positionX ?? '',
      positionY: hangar.positionY ?? ''
    });
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/hangars/${id}`);
      await loadHangars();
    } catch (err) {
      setError(getErrorMessage(err, 'Nao foi possivel excluir o hangar.'));
    }
  };

  return (
    <div style={{ minHeight: '100%', background: '#f4f7fb', color: '#10233d' }}>
      <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0 }}>Hangares</h1>
            <p style={{ margin: '8px 0 0', color: '#58708d' }}>Cadastre quantos hangares quiser e mantenha cada posição única.</p>
          </div>
          <Link to="/dashboard" style={{ padding: '10px 16px', borderRadius: '10px', background: '#0f5bd7', color: 'white', textDecoration: 'none' }}>
            Voltar ao dashboard
          </Link>
        </div>

        {error && <div style={{ marginBottom: '16px', padding: '12px 14px', borderRadius: '10px', background: '#ffe3e3', color: '#9d1c1c' }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: '20px' }}>
          <form onSubmit={handleSubmit} style={{ background: 'white', padding: '24px', borderRadius: '18px', boxShadow: '0 10px 30px rgba(16,35,61,0.08)' }}>
            <h2 style={{ marginTop: 0 }}>{editingId ? 'Editar hangar' : 'Novo hangar'}</h2>
            <label style={{ display: 'block', marginBottom: '12px' }}>
              <span style={{ display: 'block', marginBottom: '6px' }}>Nome</span>
              <input name="name" value={form.name} onChange={handleChange} required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #d6deea' }} />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label>
                <span style={{ display: 'block', marginBottom: '6px' }}>Posição X</span>
                <input name="positionX" type="number" value={form.positionX} onChange={handleChange} required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #d6deea' }} />
              </label>
              <label>
                <span style={{ display: 'block', marginBottom: '6px' }}>Posição Y</span>
                <input name="positionY" type="number" value={form.positionY} onChange={handleChange} required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #d6deea' }} />
              </label>
            </div>
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
            <h2 style={{ marginTop: 0 }}>Seus hangares</h2>
            {loading ? (
              <p>Carregando...</p>
            ) : hangars.length === 0 ? (
              <p>Você ainda não cadastrou nenhum hangar.</p>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {hangars.map((hangar) => (
                  <article key={hangar.id} style={{ padding: '16px', borderRadius: '12px', background: '#f7f9fc', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{hangar.name}</div>
                      <div style={{ color: '#58708d' }}>Posição: ({hangar.positionX}, {hangar.positionY})</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'start' }}>
                      <button onClick={() => handleEdit(hangar)} style={{ padding: '8px 12px', border: 'none', borderRadius: '8px', background: '#dbeafe', cursor: 'pointer' }}>
                        Editar
                      </button>
                      <button onClick={() => handleDelete(hangar.id)} style={{ padding: '8px 12px', border: 'none', borderRadius: '8px', background: '#fee2e2', cursor: 'pointer' }}>
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

export default Hangars;
