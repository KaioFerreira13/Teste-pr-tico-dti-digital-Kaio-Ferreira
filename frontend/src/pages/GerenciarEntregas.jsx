import React, { useEffect, useState } from 'react';
import api from '../services/api';

const deliveryLabels = {
  AGUARDANDO_CONFIRMACAO: 'Aguardando confirmação',
  CONFIRMADA: 'Confirmada',
  EM_DESPACHO: 'Em despacho',
  ENTREGUE: 'Entregue',
  INVIAVEL: 'Inviável'
};

const statusColors = {
  CONFIRMADA: '#b7791f',
  EM_DESPACHO: '#1769aa',
  ENTREGUE: '#2f855a',
  INVIAVEL: '#c53030',
  AGUARDANDO_CONFIRMACAO: '#58708d'
};

const GerenciarEntregas = () => {
  const [hangars, setHangars] = useState([]);
  const [selectedHangar, setSelectedHangar] = useState('');
  const [deliveries, setDeliveries] = useState([]);
  const [drones, setDrones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [prepared, setPrepared] = useState(false);
  const [inviableDelivery, setInviableDelivery] = useState(null);
  const [partitionCount, setPartitionCount] = useState(2);
  const [partitionWeights, setPartitionWeights] = useState(['', '']);

  const loadManagement = async (hangarId) => {
    if (!hangarId) {
      setDeliveries([]);
      setDrones([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/entregas/gerenciamento/${hangarId}`);
      setDeliveries((response.data.deliveries || [])
        .filter((delivery) => delivery.status !== 'EM_DESPACHO')
        .map((delivery) => delivery.status === 'NA_FILA' ? { ...delivery, status: 'CONFIRMADA' } : delivery));
      setDrones(response.data.drones || []);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Nao foi possivel carregar o hangar.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/hangars/me')
      .then((response) => setHangars(Array.isArray(response.data) ? response.data : []))
      .catch(() => setError('Nao foi possivel carregar os hangares.'));
  }, []);

  const handleHangarChange = (event) => {
    const hangarId = event.target.value;
    setSelectedHangar(hangarId);
    setPrepared(false);
    loadManagement(hangarId);
  };

  const allocatePendingDeliveries = (sourceDeliveries, sourceDrones) => {
    const pending = sourceDeliveries
      .filter((delivery) => delivery.status === 'AGUARDANDO_CONFIRMACAO')
      .sort((a, b) => ({ BAIXA: 1, MEDIA: 2, ALTA: 3 }[b.priority] || 0) - ({ BAIXA: 1, MEDIA: 2, ALTA: 3 }[a.priority] || 0));
    const nextDeliveries = sourceDeliveries.map((delivery) => ({ ...delivery }));

    pending.forEach((delivery) => {
      const canEverFit = sourceDrones.some((drone) => delivery.weight <= drone.maxWeight);
      const target = nextDeliveries.find((item) => item.id === delivery.id);
      target.status = canEverFit ? 'CONFIRMADA' : 'INVIAVEL';
      target.droneId = null;
    });

    return {
      deliveries: nextDeliveries,
      drones: sourceDrones
    };
  };

  const prepareDispatch = async () => {
    if (!selectedHangar) return;
    setError('');
    const allocation = allocatePendingDeliveries(deliveries, drones);
    setDeliveries(allocation.deliveries);
    setDrones(allocation.drones);
    setPrepared(true);
  };

  const confirmDispatch = async () => {
    if (deliveries.some((delivery) => delivery.status === 'INVIAVEL')) {
      setError('Trate todas as entregas inviáveis antes de confirmar a movimentação.');
      return;
    }
    if (!window.confirm('Confirma a movimentacao das entregas para os drones?')) return;
    setLoading(true);
    setError('');
    try {
      const deliveryIds = deliveries.filter((delivery) => delivery.status === 'CONFIRMADA').map((delivery) => delivery.id);
      const response = await api.post(`/entregas/gerenciamento/${selectedHangar}/confirmar`, { deliveryIds });
      const confirmedDeliveries = (response.data.deliveries || [])
        .filter((delivery) => delivery.status !== 'EM_DESPACHO')
        .map((delivery) => delivery.status === 'NA_FILA' ? { ...delivery, status: 'CONFIRMADA' } : delivery);
      setDeliveries(confirmedDeliveries);
      setDrones(response.data.drones || []);
      setPrepared(false);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Nao foi possivel confirmar a movimentacao.');
    } finally {
      setLoading(false);
    }
  };

  const clearQueue = async () => {
    if (!window.confirm('Limpar a fila e devolver todos os pedidos para aguardando confirmação?')) return;
    setLoading(true);
    setError('');
    try {
      const response = await api.post(`/entregas/gerenciamento/${selectedHangar}/limpar-fila`);
      setDeliveries((response.data.deliveries || []).filter((delivery) => delivery.status !== 'EM_DESPACHO'));
      setDrones(response.data.drones || []);
      setPrepared(false);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Não foi possível limpar a fila.');
    } finally {
      setLoading(false);
    }
  };

  const openSplitModal = (delivery) => {
    setInviableDelivery(delivery);
    setPartitionCount(2);
    setPartitionWeights(['', '']);
  };

  const changePartitionCount = (event) => {
    const count = Math.max(2, Number(event.target.value) || 2);
    setPartitionCount(count);
    setPartitionWeights((current) => Array.from({ length: count }, (_, index) => current[index] || ''));
  };

  const splitInviable = async () => {
    const weights = partitionWeights.map(Number);
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    if (weights.some((weight) => !Number.isFinite(weight) || weight <= 0) || Math.abs(total - inviableDelivery.weight) > 0.000001) {
      setError(`A soma das particoes deve ser exatamente ${inviableDelivery.weight} kg.`);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await api.post(`/entregas/${inviableDelivery.id}/repartir`, { weights });
      const nextDeliveries = [...deliveries.filter((delivery) => delivery.id !== inviableDelivery.id), ...response.data];
      const allocation = allocatePendingDeliveries(nextDeliveries, drones);
      setDeliveries(allocation.deliveries);
      setDrones(allocation.drones);
      setPrepared(true);
      setInviableDelivery(null);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Nao foi possivel repartir a entrega.');
    } finally {
      setLoading(false);
    }
  };

  const deleteInviable = async () => {
    if (!window.confirm('Deseja excluir esta entrega inviavel?')) return;
    setLoading(true);
    try {
      await api.delete(`/entregas/${inviableDelivery.id}`);
      const nextDeliveries = deliveries.filter((delivery) => delivery.id !== inviableDelivery.id);
      setDeliveries(nextDeliveries);
      setPrepared(false);
      setInviableDelivery(null);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Nao foi possivel excluir a entrega.');
    } finally {
      setLoading(false);
    }
  };

  const grouped = {
    AGUARDANDO_CONFIRMACAO: deliveries.filter((delivery) => delivery.status === 'AGUARDANDO_CONFIRMACAO'),
    CONFIRMADA: deliveries
      .filter((delivery) => delivery.status === 'CONFIRMADA')
      .sort((a, b) => ({ BAIXA: 1, MEDIA: 2, ALTA: 3 }[b.priority] || 0) - ({ BAIXA: 1, MEDIA: 2, ALTA: 3 }[a.priority] || 0)),
    EM_DESPACHO: deliveries.filter((delivery) => delivery.status === 'EM_DESPACHO'),
    INVIAVEL: deliveries.filter((delivery) => delivery.status === 'INVIAVEL')
  };

  const renderDelivery = (delivery) => (
    <article key={delivery.id} style={{ padding: '14px', borderRadius: '12px', background: '#f7f9fc', borderLeft: `4px solid ${statusColors[delivery.status] || '#58708d'}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
        <strong>{delivery.recipientName}</strong>
        <span style={{ color: statusColors[delivery.status] || '#58708d', fontWeight: 700, fontSize: '0.85rem' }}>{deliveryLabels[delivery.status] || delivery.status}</span>
      </div>
      <div style={{ marginTop: '8px', color: '#58708d', fontSize: '0.9rem' }}>
        {delivery.weight} kg | Prioridade: {delivery.priority?.toLowerCase()}
      </div>
      {delivery.droneId && <div style={{ marginTop: '5px', color: '#58708d', fontSize: '0.9rem' }}>Drone: {drones.find((drone) => drone.id === delivery.droneId)?.name || delivery.droneId}</div>}
      {delivery.status === 'INVIAVEL' && <button onClick={() => openSplitModal(delivery)} style={{ marginTop: '10px', padding: '8px 11px', border: 0, borderRadius: '8px', background: '#fee2e2', color: '#c53030', fontWeight: 700, cursor: 'pointer' }}>Tratar entrega</button>}
    </article>
  );

  const renderColumn = (title, status, description) => (
    <section style={{ padding: '18px', borderRadius: '16px', background: 'white', boxShadow: '0 8px 24px rgba(16,35,61,0.06)' }}>
      <h2 style={{ margin: 0, fontSize: '1.15rem' }}>{title} <span style={{ color: '#58708d' }}>({grouped[status].length})</span></h2>
      <p style={{ minHeight: '42px', color: '#58708d', fontSize: '0.9rem', lineHeight: 1.4 }}>{description}</p>
      <div style={{ display: 'grid', gap: '10px' }}>{grouped[status].length ? grouped[status].map(renderDelivery) : <span style={{ color: '#58708d' }}>Nenhuma entrega nesta etapa.</span>}</div>
    </section>
  );

  return (
    <div style={{ maxWidth: '1180px' }}>
      <div style={{ marginBottom: '20px', padding: '26px', borderRadius: '20px', background: 'white', boxShadow: '0 10px 30px rgba(16,35,61,0.08)' }}>
        <h1 style={{ margin: '0 0 8px' }}>Gerenciar entregas</h1>
        <p style={{ margin: 0, color: '#58708d' }}>Selecione um hangar para visualizar a operação e preparar o despacho.</p>
        <select value={selectedHangar} onChange={handleHangarChange} style={{ marginTop: '20px', width: '100%', maxWidth: '480px', padding: '12px', borderRadius: '10px', border: '1px solid #d6deea', background: 'white' }}>
          <option value="">Selecione um hangar</option>
          {hangars.map((hangar) => <option key={hangar.id} value={hangar.id}>{hangar.name}</option>)}
        </select>
        {selectedHangar && !prepared && <button onClick={prepareDispatch} disabled={loading} style={{ marginTop: '14px', display: 'block', padding: '11px 16px', border: 0, borderRadius: '10px', background: '#0f5bd7', color: 'white', fontWeight: 700, cursor: 'pointer' }}>Preparar despacho</button>}
        {selectedHangar && prepared && <button onClick={confirmDispatch} disabled={loading || grouped.INVIAVEL.length > 0} title={grouped.INVIAVEL.length > 0 ? 'Trate as entregas inviáveis antes de confirmar' : ''} style={{ marginTop: '14px', display: 'block', padding: '11px 16px', border: 0, borderRadius: '10px', background: grouped.INVIAVEL.length > 0 ? '#94a3b8' : '#2f855a', color: 'white', fontWeight: 700, cursor: grouped.INVIAVEL.length > 0 ? 'not-allowed' : 'pointer' }}>{loading ? 'Confirmando...' : 'Confirmar movimentação'}</button>}
        {selectedHangar && grouped.CONFIRMADA.length > 0 && <button onClick={clearQueue} disabled={loading} style={{ marginTop: '10px', display: 'block', padding: '10px 15px', border: 0, borderRadius: '10px', background: '#fee2e2', color: '#c53030', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>{loading ? 'Limpando...' : 'Limpar fila'}</button>}
        {prepared && grouped.INVIAVEL.length > 0 && <p style={{ marginBottom: 0, color: '#c53030' }}>Trate todas as entregas inviáveis para liberar a confirmação.</p>}
        {error && <p style={{ color: '#c53030', marginBottom: 0 }}>{error}</p>}
      </div>

      {selectedHangar && !loading && <>
        <div style={{ marginBottom: '20px', padding: '20px', borderRadius: '16px', background: '#10233d', color: 'white' }}>
          <h2 style={{ margin: '0 0 14px' }}>Drones do hangar ({drones.length})</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '10px' }}>
            {drones.map((drone) => <div key={drone.id} style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)' }}><strong>{drone.name}</strong><div style={{ marginTop: '5px', fontSize: '0.88rem', opacity: 0.85 }}>{drone.status === 'EM_DESPACHO' ? 'Em despacho' : drone.status?.toLowerCase()} | {drone.currentLoad || 0} / {drone.maxWeight} kg</div></div>)}
            {!drones.length && <span>Nenhum drone cadastrado neste hangar.</span>}
          </div>
        </div>
        {!prepared && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          {renderColumn('Aguardando confirmação', 'AGUARDANDO_CONFIRMACAO', 'Entregas ainda sem tratativa. Prepare o despacho para enviá-las à fila.')}
          {renderColumn('Fila de confirmadas', 'CONFIRMADA', 'Pedidos confirmados aguardando um drone disponível, ordenados por prioridade.')}
        </div>}
        {prepared && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          {renderColumn('Fila de confirmadas', 'CONFIRMADA', 'Pedidos prontos para confirmação, ordenados por prioridade.')}
          {renderColumn('Inviável', 'INVIAVEL', 'Nenhum drone deste hangar possui capacidade para o peso da entrega.')}
        </div>}
      </>}

      {inviableDelivery && <div style={{ position: 'fixed', inset: 0, zIndex: 10, display: 'grid', placeItems: 'center', padding: '20px', background: 'rgba(16,35,61,0.58)' }}>
        <div style={{ width: 'min(100%, 520px)', padding: '26px', borderRadius: '18px', background: 'white', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
          <h2 style={{ marginTop: 0 }}>Entrega inviável</h2>
          <p style={{ color: '#58708d', lineHeight: 1.5 }}>A entrega de <strong>{inviableDelivery.weight} kg</strong> não pode ser atendida por nenhum drone. Escolha uma tratativa.</p>
          <h3 style={{ fontSize: '1rem' }}>Repartir entrega</h3>
          <label style={{ display: 'block', color: '#58708d' }}>Quantidade de volumes</label>
          <select value={partitionCount} onChange={changePartitionCount} style={{ width: '100%', margin: '6px 0 12px', padding: '10px', borderRadius: '8px', border: '1px solid #d6deea' }}>
            {Array.from({ length: 8 }, (_, index) => <option key={index + 2} value={index + 2}>{index + 2}</option>)}
          </select>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {partitionWeights.map((weight, index) => <input key={index} type="number" min="0.01" step="0.01" placeholder={`Volume ${index + 1} (kg)`} value={weight} onChange={(event) => setPartitionWeights((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #d6deea' }} />)}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
            <button onClick={deleteInviable} disabled={loading} style={{ padding: '10px 14px', border: 0, borderRadius: '8px', background: '#fee2e2', color: '#c53030', cursor: 'pointer' }}>Excluir entrega</button>
            <button onClick={() => setInviableDelivery(null)} disabled={loading} style={{ padding: '10px 14px', border: 0, borderRadius: '8px', background: '#edf2f7', color: '#243b53', cursor: 'pointer' }}>Decidir depois</button>
            <button onClick={splitInviable} disabled={loading} style={{ padding: '10px 14px', border: 0, borderRadius: '8px', background: '#0f5bd7', color: 'white', fontWeight: 700, cursor: 'pointer' }}>Confirmar divisão</button>
          </div>
        </div>
      </div>}
    </div>
  );
};

export default GerenciarEntregas;
