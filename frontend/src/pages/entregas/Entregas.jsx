import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  deleteDelivery,
  getDeliveryRegistrationData,
  getEditableDeliveries,
  groupDeliveriesByStatus,
  saveDelivery,
  toDeliveryForm,
} from '../../services/deliveryService';
import { getErrorMessage } from '../../utils/errorMessage';
const priorityOptions = [{
  value: 'BAIXA',
  label: 'Baixa'
}, {
  value: 'MEDIA',
  label: 'Media'
}, {
  value: 'ALTA',
  label: 'Alta'
}];
const statusLabels = {
  AGUARDANDO_CONFIRMACAO: 'Aguardando confirmacao',
  CONFIRMADA: 'Confirmada',
  EM_DESPACHO: 'Em despacho',
  ENTREGUE: 'Entregue',
  INVIAVEL: 'Inviavel'
};
const initialForm = {
  weight: '',
  destinationX: '',
  destinationY: '',
  priority: 'MEDIA',
  recipientName: '',
  hangarId: ''
};
const formatPriority = priority => {
  if (!priority) return '-';
  const found = priorityOptions.find(option => option.value === priority);
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
  const [activeTab, setActiveTab] = useState('editar');
  const loadDeliveries = async () => {
    setLoading(true);
    try {
      const data = await getDeliveryRegistrationData();
      setDeliveries(data.deliveries);
      setHangars(data.hangars);
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
  const handleChange = event => {
    const {
      name,
      value
    } = event.target;
    setForm(current => ({
      ...current,
      [name]: value
    }));
  };
  const handleSubmit = async event => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await saveDelivery(editingId, form);
      resetForm();
      await loadDeliveries();
    } catch (err) {
      setError(getErrorMessage(err, 'Nao foi possivel salvar a entrega.'));
    } finally {
      setSaving(false);
    }
  };
  const handleEdit = delivery => {
    setEditingId(delivery.id);
    setForm(toDeliveryForm(delivery));
    setActiveTab('editar');
  };
  const handleDelete = async id => {
    try {
      await deleteDelivery(id);
      await loadDeliveries();
    } catch (err) {
      setError(getErrorMessage(err, 'Nao foi possivel excluir a entrega.'));
    }
  };
  const sortedDeliveries = useMemo(() => getEditableDeliveries(deliveries), [deliveries]);
  const deliveriesByStatus = useMemo(
    () =>
      groupDeliveriesByStatus(
        deliveries,
        Object.entries(statusLabels).map(([value, label]) => ({ value, label })),
      ).map(group => ({ ...group, status: group.value })),
    [deliveries],
  );
  return <div className="[min-height:100%] [background:#f4f7fb] [color:#10233d]">
      <div className="[max-width:1120px] [margin:0_auto]">
        <div className="[display:flex] [justify-content:space-between] [align-items:center] [margin-bottom:24px] [gap:16px]">
          <div>
            <h1 className="[margin:0]">Entregas</h1>
            <p className="[margin:8px_0_0] [color:#58708d]">Cadastre o pacote, a posicao de destino, a prioridade e o destinatario.</p>
          </div>
          <Link to="/dashboard" className="[padding:10px_16px] [border-radius:10px] [background:#0f5bd7] [color:white] [text-decoration:none]">
            Voltar ao dashboard
          </Link>
        </div>

        {error && <div className="[margin-bottom:16px] [padding:12px_14px] [border-radius:10px] [background:#ffe3e3] [color:#9d1c1c]">{error}</div>}

        <div className="[display:grid] [grid-template-columns:1fr_1.1fr] [gap:20px]">
          <form onSubmit={handleSubmit} className="[background:white] [padding:24px] [border-radius:18px] [box-shadow:0_10px_30px_rgba(16,35,61,0.08)]">
            <h2 className="[margin-top:0]">{editingId ? 'Editar entrega' : 'Nova entrega'}</h2>

            <label className="[display:block] [margin-bottom:12px]">
              <span className="[display:block] [margin-bottom:6px]">Peso do pacote</span>
              <input name="weight" type="number" step="0.01" min="0.01" value={form.weight} onChange={handleChange} required className="[width:100%] [padding:12px] [border-radius:10px] [border:1px_solid_#d6deea]" />
            </label>

            <div className="[display:grid] [grid-template-columns:1fr_1fr] [gap:12px]">
              <label>
                <span className="[display:block] [margin-bottom:6px]">Posicao X</span>
                <input name="destinationX" type="number" value={form.destinationX} onChange={handleChange} required className="[width:100%] [padding:12px] [border-radius:10px] [border:1px_solid_#d6deea]" />
              </label>
              <label>
                <span className="[display:block] [margin-bottom:6px]">Posicao Y</span>
                <input name="destinationY" type="number" value={form.destinationY} onChange={handleChange} required className="[width:100%] [padding:12px] [border-radius:10px] [border:1px_solid_#d6deea]" />
              </label>
            </div>

            <label className="[display:block] [margin-top:12px]">
              <span className="[display:block] [margin-bottom:6px]">Prioridade</span>
              <select name="priority" value={form.priority} onChange={handleChange} required className="[width:100%] [padding:12px] [border-radius:10px] [border:1px_solid_#d6deea] [background:white]">
                {priorityOptions.map(option => <option key={option.value} value={option.value}>
                    {option.label}
                  </option>)}
              </select>
            </label>

            <label className="[display:block] [margin-top:12px]">
              <span className="[display:block] [margin-bottom:6px]">Nome do destinatario</span>
              <input name="recipientName" value={form.recipientName} onChange={handleChange} required minLength={2} className="[width:100%] [padding:12px] [border-radius:10px] [border:1px_solid_#d6deea]" />
            </label>

            <label className="[display:block] [margin-top:12px]">
              <span className="[display:block] [margin-bottom:6px]">Hangar de origem</span>
              <select name="hangarId" value={form.hangarId} onChange={handleChange} required className="[width:100%] [padding:12px] [border-radius:10px] [border:1px_solid_#d6deea] [background:white]">
                <option value="">Selecione um hangar</option>
                {hangars.map(hangar => <option key={hangar.id} value={hangar.id}>
                    {hangar.name} ({hangar.positionX}, {hangar.positionY})
                  </option>)}
              </select>
            </label>

            <div className="[display:flex] [gap:10px] [margin-top:18px]">
              <button type="submit" disabled={saving} className="[flex:1] [padding:12px] [border:none] [border-radius:10px] [background:#0f5bd7] [color:white] [cursor:pointer]">
                {saving ? 'Salvando...' : editingId ? 'Atualizar' : 'Cadastrar'}
              </button>
              {editingId && <button type="button" onClick={resetForm} className="[padding:12px_16px] [border:1px_solid_#d6deea] [border-radius:10px] [background:white] [cursor:pointer]">
                  Cancelar
                </button>}
            </div>
          </form>

          <section className="[background:white] [padding:24px] [border-radius:18px] [box-shadow:0_10px_30px_rgba(16,35,61,0.08)]">
            <div className="[display:flex] [justify-content:space-between] [gap:12px] [align-items:center] [flex-wrap:wrap]">
              <h2 className="[margin:0]">Suas entregas</h2>
              <div className="[display:flex] [gap:8px] [flex-wrap:wrap]">
                <button type="button" onClick={() => setActiveTab('editar')} style={{
                border: activeTab === 'editar' ? '1px solid #0f5bd7' : '1px solid #d6deea',
                background: activeTab === 'editar' ? '#dbeafe' : 'white'
              }} className="[padding:9px_13px] [border-radius:999px] [color:#10233d] [cursor:pointer]">
                  Editar entregas
                </button>
                <button type="button" onClick={() => setActiveTab('status')} style={{
                border: activeTab === 'status' ? '1px solid #0f5bd7' : '1px solid #d6deea',
                background: activeTab === 'status' ? '#dbeafe' : 'white'
              }} className="[padding:9px_13px] [border-radius:999px] [color:#10233d] [cursor:pointer]">
                  Por estado
                </button>
              </div>
            </div>

            {activeTab === 'editar' && <>
                {loading ? <p>Carregando...</p> : sortedDeliveries.length === 0 ? <p>Nao ha entregas disponiveis para edicao.</p> : <div className="internal-scroll-list [display:grid] [gap:12px] [margin-top:16px]">
                    {sortedDeliveries.map(delivery => <article key={delivery.id} className="[padding:16px] [border-radius:12px] [background:#f7f9fc] [display:flex] [justify-content:space-between] [gap:12px]">
                        <div>
                          <div className="[font-size:0.78rem] [color:#58708d]">Codigo: {delivery.codigo ?? '-'}</div>
                          <div className="[font-weight:700]">{delivery.recipientName}</div>
                          <div className="[color:#58708d]">Peso: {delivery.weight}</div>
                          <div className="[color:#58708d]">Destino: ({delivery.destinationX}, {delivery.destinationY})</div>
                          <div className="[color:#58708d]">Prioridade: {formatPriority(delivery.priority)}</div>
                          <div className="[color:#58708d]">
                            Hangar de origem: {hangars.find(hangar => hangar.id === delivery.hangarId)?.name || 'Hangar nao encontrado'}
                          </div>
                        </div>
                        <div className="[display:flex] [gap:8px] [align-items:start]">
                          <button onClick={() => handleEdit(delivery)} className="[padding:8px_12px] [border:none] [border-radius:8px] [background:#dbeafe] [cursor:pointer]">
                            Editar
                          </button>
                          <button onClick={() => handleDelete(delivery.id)} className="[padding:8px_12px] [border:none] [border-radius:8px] [background:#fee2e2] [cursor:pointer]">
                            Excluir
                          </button>
                        </div>
                      </article>)}
                  </div>}
              </>}

            {activeTab === 'status' && <div className="[display:grid] [grid-template-columns:repeat(auto-fit,_minmax(220px,_1fr))] [gap:14px] [margin-top:16px]">
                {deliveriesByStatus.map(group => <article key={group.status} className="[padding:16px] [border-radius:14px] [background:#f8fafc] [border:1px_solid_#e2e8f0]">
                    <div className="[display:flex] [justify-content:space-between] [gap:12px] [align-items:center]">
                      <strong>{group.label}</strong>
                      <span className="[color:#58708d]">{group.items.length}</span>
                    </div>
                    <div className="internal-scroll-list [display:grid] [gap:10px] [margin-top:12px]">
                      {group.items.length ? group.items.map(delivery => <div key={delivery.id} className="[padding:12px] [border-radius:10px] [background:white]">
                          <div className="[font-size:0.78rem] [color:#58708d]">Codigo: {delivery.codigo ?? '-'}</div>
                          <div className="[font-weight:700]">{delivery.recipientName}</div>
                          <div className="[color:#58708d] [font-size:0.88rem]">Peso: {delivery.weight} kg</div>
                          <div className="[color:#58708d] [font-size:0.88rem]">Prioridade: {formatPriority(delivery.priority)}</div>
                        </div>) : <span className="[color:#58708d]">Nenhuma entrega neste estado.</span>}
                    </div>
                  </article>)}
              </div>}
          </section>
        </div>
      </div>
    </div>;
};
export default Entregas;
