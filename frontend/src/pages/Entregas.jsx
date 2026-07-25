import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { getErrorMessage } from '../utils/errorMessage';

const priorityOptions = [
  { value: 'BAIXA', label: 'Baixa' },
  { value: 'MEDIA', label: 'Média' },
  { value: 'ALTA', label: 'Alta' }
];

const initialForm = {
  weight: '',
  destinationX: '',
  destinationY: '',
  priority: 'MEDIA',
  recipientName: '',
  hangarId: ''
};

const formatPriority = (priority) => {
  if (!priority) return '-';
  const found = priorityOptions.find((option) => option.value === priority);
  return found ? found.label : priority;
};

const Entregas = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [hangars, setHangars] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadDeliveries = async () => {
    setLoading(true);
    try {
      const [deliveriesRes, hangarsRes] = await Promise.all([
        api.get('/entregas/me'),
        api.get('/hangars/me')
      ]);
      setDeliveries(Array.isArray(deliveriesRes.data) ? deliveriesRes.data : []);
      setHangars(Array.isArray(hangarsRes.data) ? hangarsRes.data : []);
    } catch (err) {
      setError(getErrorMessage(err, 'Nao foi possivel carregar as entregas.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeliveries();
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
      weight: Number(form.weight),
      destinationX: Number(form.destinationX),
      destinationY: Number(form.destinationY),
      priority: form.priority,
      recipientName: form.recipientName.trim(),
      hangarId: form.hangarId
    };

    try {
      if (editingId) {
        await api.put(`/entregas/${editingId}`, payload);
      } else {
        await api.post('/entregas', payload);
      }
      resetForm();
      await loadDeliveries();
    } catch (err) {
      setError(getErrorMessage(err, 'Nao foi possivel salvar a entrega.'));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (delivery) => {
    setEditingId(delivery.id);
    setForm({
      weight: delivery.weight ?? '',
      destinationX: delivery.destinationX ?? '',
      destinationY: delivery.destinationY ?? '',
      priority: delivery.priority || 'MEDIA',
      recipientName: delivery.recipientName || '',
      hangarId: delivery.hangarId || ''
    });
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/entregas/${id}`);
      await loadDeliveries();
    } catch (err) {
      setError(getErrorMessage(err, 'Nao foi possivel excluir a entrega.'));
    }
  };

  const sortedDeliveries = useMemo(() => {
    return deliveries
      .filter((delivery) => delivery.status !== 'EM_DESPACHO' && delivery.status !== 'ENTREGUE')
      .sort((a, b) => {
      const priorityWeight = { ALTA: 0, MEDIA: 1, BAIXA: 2 };
      return (priorityWeight[a.priority] ?? 3) - (priorityWeight[b.priority] ?? 3);
      });
  }, [deliveries]);

  return (
    <div style={{ minHeight: '100%', background: '#f4f7fb', color: '#10233d' }}>
      <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0 }}>Entregas</h1>
            <p style={{ margin: '8px 0 0', color: '#58708d' }}>Cadastre o pacote, a posicao de destino, a prioridade e o destinatario.</p>
          </div>
          <Link to="/dashboard" style={{ padding: '10px 16px', borderRadius: '10px', background: '#0f5bd7', color: 'white', textDecoration: 'none' }}>
            Voltar ao dashboard
          </Link>
        </div>

        {error && <div style={{ marginBottom: '16px', padding: '12px 14px', borderRadius: '10px', background: '#ffe3e3', color: '#9d1c1c' }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: '20px' }}>
          <form onSubmit={handleSubmit} style={{ background: 'white', padding: '24px', borderRadius: '18px', boxShadow: '0 10px 30px rgba(16,35,61,0.08)' }}>
            <h2 style={{ marginTop: 0 }}>{editingId ? 'Editar entrega' : 'Nova entrega'}</h2>

            <label style={{ display: 'block', marginBottom: '12px' }}>
              <span style={{ display: 'block', marginBottom: '6px' }}>Peso do pacote</span>
              <input
                name="weight"
                type="number"
                step="0.01"
                min="0.01"
                value={form.weight}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #d6deea' }}
              />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label>
                <span style={{ display: 'block', marginBottom: '6px' }}>Posicao X</span>
                <input
                  name="destinationX"
                  type="number"
                  value={form.destinationX}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #d6deea' }}
                />
              </label>
              <label>
                <span style={{ display: 'block', marginBottom: '6px' }}>Posicao Y</span>
                <input
                  name="destinationY"
                  type="number"
                  value={form.destinationY}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #d6deea' }}
                />
              </label>
            </div>

            <label style={{ display: 'block', marginTop: '12px' }}>
              <span style={{ display: 'block', marginBottom: '6px' }}>Prioridade</span>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #d6deea', background: 'white' }}
              >
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: 'block', marginTop: '12px' }}>
              <span style={{ display: 'block', marginBottom: '6px' }}>Nome do destinatario</span>
              <input
                name="recipientName"
                value={form.recipientName}
                onChange={handleChange}
                required
                minLength={2}
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #d6deea' }}
              />
            </label>

            <label style={{ display: 'block', marginTop: '12px' }}>
              <span style={{ display: 'block', marginBottom: '6px' }}>Hangar de origem</span>
              <select
                name="hangarId"
                value={form.hangarId}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #d6deea', background: 'white' }}
              >
                <option value="">Selecione um hangar</option>
                {hangars.map((hangar) => (
                  <option key={hangar.id} value={hangar.id}>
                    {hangar.name} ({hangar.positionX}, {hangar.positionY})
                  </option>
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
            <h2 style={{ marginTop: 0 }}>Suas entregas</h2>
            {loading ? (
              <p>Carregando...</p>
            ) : sortedDeliveries.length === 0 ? (
              <p>Não há entregas disponíveis para edição.</p>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {sortedDeliveries.map((delivery) => (
                  <article key={delivery.id} style={{ padding: '16px', borderRadius: '12px', background: '#f7f9fc', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{delivery.recipientName}</div>
                      <div style={{ color: '#58708d' }}>Peso: {delivery.weight}</div>
                      <div style={{ color: '#58708d' }}>Destino: ({delivery.destinationX}, {delivery.destinationY})</div>
                      <div style={{ color: '#58708d' }}>Prioridade: {formatPriority(delivery.priority)}</div>
                      <div style={{ color: '#58708d' }}>
                        Hangar de origem: {hangars.find((hangar) => hangar.id === delivery.hangarId)?.name || 'Hangar não encontrado'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'start' }}>
                      <button onClick={() => handleEdit(delivery)} style={{ padding: '8px 12px', border: 'none', borderRadius: '8px', background: '#dbeafe', cursor: 'pointer' }}>
                        Editar
                      </button>
                      <button onClick={() => handleDelete(delivery.id)} style={{ padding: '8px 12px', border: 'none', borderRadius: '8px', background: '#fee2e2', cursor: 'pointer' }}>
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

export default Entregas;
