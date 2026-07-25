import React, { useEffect, useState } from 'react';
import api from '../services/api';

const droneStatuses = [
  { value: 'DISPONIVEL', label: 'Disponível' },
  { value: 'EM_DESPACHO', label: 'Em despacho' },
  { value: 'EM_MANUTENCAO', label: 'Em manutenção' },
  { value: 'RECARREGANDO', label: 'Recarregando' }
];

const GerenciarDrones = () => {
  const [hangars, setHangars] = useState([]);
  const [drones, setDrones] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [selectedHangar, setSelectedHangar] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedByDrone, setSelectedByDrone] = useState({});

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [hangarsResponse, dronesResponse, deliveriesResponse] = await Promise.all([
        api.get('/hangars/me'), api.get('/drones/me'), api.get('/entregas/me')
      ]);
      setHangars(hangarsResponse.data || []);
      setDrones(dronesResponse.data || []);
      setDeliveries(deliveriesResponse.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Não foi possível carregar a gestão de drones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const updateStatus = async (droneId, status) => {
    setError('');
    try {
      const response = await api.patch(`/drones/${droneId}/status`, { status });
      setDrones((current) => current.map((drone) => drone.id === droneId ? response.data : drone));
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Não foi possível atualizar o status do drone.');
    }
  };

  const toggleDelivery = (droneId, deliveryId) => {
    setSelectedByDrone((current) => {
      const selected = current[droneId] || [];
      return {
        ...current,
        [droneId]: selected.includes(deliveryId)
          ? selected.filter((id) => id !== deliveryId)
          : [...selected, deliveryId]
      };
    });
  };

  const unassignSelected = async (droneId) => {
    const deliveryIds = selectedByDrone[droneId] || [];
    if (!deliveryIds.length) return;
    if (!window.confirm(`Remover ${deliveryIds.length} entrega(s) do drone e devolvê-las para aguardando confirmação?`)) return;
    setError('');
    try {
      await api.post(`/drones/${droneId}/entregas/remover`, { deliveryIds });
      setSelectedByDrone((current) => ({ ...current, [droneId]: [] }));
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Não foi possível remover a entrega do drone.');
    }
  };

  const startFreight = async (droneId) => {
    if (!window.confirm('Confirmar o início deste frete?')) return;
    setError('');
    try {
      const response = await api.post(`/drones/${droneId}/iniciar-frete`);
      setDrones((current) => current.map((drone) => drone.id === droneId ? response.data : drone));
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Não foi possível iniciar o frete.');
    }
  };

  const visibleDrones = drones.filter((drone) => drone.hangarId === selectedHangar);
  const currentHangar = hangars.find((hangar) => hangar.id === selectedHangar);

  return (
    <div style={{ maxWidth: '1100px' }}>
      <header style={{ padding: '26px', borderRadius: '20px', background: 'white', boxShadow: '0 10px 30px rgba(16,35,61,0.08)' }}>
        <h1 style={{ margin: '0 0 8px' }}>Gestão de drones</h1>
        <p style={{ margin: 0, color: '#58708d' }}>Acompanhe as entregas alocadas e controle a situação operacional de cada drone.</p>
        <select value={selectedHangar} onChange={(event) => setSelectedHangar(event.target.value)} style={{ marginTop: '20px', width: '100%', maxWidth: '480px', padding: '12px', borderRadius: '10px', border: '1px solid #d6deea', background: 'white' }}>
          <option value="">Selecione um hangar</option>
          {hangars.map((hangar) => <option key={hangar.id} value={hangar.id}>{hangar.name}</option>)}
        </select>
        {error && <p style={{ color: '#c53030', marginBottom: 0 }}>{error}</p>}
      </header>

      {loading && <p>Carregando...</p>}
      {selectedHangar && !loading && <div style={{ display: 'grid', gap: '16px', marginTop: '20px' }}>
        {visibleDrones.map((drone) => {
          const assigned = deliveries.filter((delivery) => delivery.droneId === drone.id && delivery.status === 'EM_DESPACHO');
          const routeDeliveries = (drone.routeDeliveryIds || []).map((deliveryId) => assigned.find((delivery) => delivery.id === deliveryId)).filter(Boolean);
          return <article key={drone.id} style={{ padding: '22px', borderRadius: '18px', background: 'white', boxShadow: '0 8px 24px rgba(16,35,61,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
              <div><h2 style={{ margin: 0 }}>{drone.name}</h2><p style={{ margin: '6px 0 0', color: '#58708d' }}>Carga: {drone.currentLoad || 0} / {drone.maxWeight} kg</p></div>
              <label style={{ color: '#58708d' }}>Status
                <select disabled={drone.status === 'EM_DESPACHO'} value={drone.status || 'DISPONIVEL'} onChange={(event) => updateStatus(drone.id, event.target.value)} title={drone.status === 'EM_DESPACHO' ? 'O status não pode ser alterado durante o despacho' : ''} style={{ display: 'block', marginTop: '5px', padding: '9px', borderRadius: '8px', border: '1px solid #d6deea', background: drone.status === 'EM_DESPACHO' ? '#edf2f7' : 'white', cursor: drone.status === 'EM_DESPACHO' ? 'not-allowed' : 'pointer' }}>
                  {droneStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                </select>
                {drone.status === 'EM_DESPACHO' && <small style={{ display: 'block', marginTop: '5px', maxWidth: '190px' }}>Bloqueado durante o despacho</small>}
              </label>
            </div>
            <h3 style={{ marginBottom: '10px', fontSize: '1rem' }}>Entregas alocadas ({assigned.length})</h3>
            <div style={{ display: 'grid', gap: '9px' }}>
              {assigned.map((delivery) => <div key={delivery.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '10px', background: '#f7f9fc' }}>
                <input type="checkbox" checked={(selectedByDrone[drone.id] || []).includes(delivery.id)} onChange={() => toggleDelivery(drone.id, delivery.id)} aria-label={`Selecionar entrega de ${delivery.recipientName}`} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                <div><strong>{delivery.recipientName}</strong><div style={{ color: '#58708d', fontSize: '0.9rem' }}>{delivery.weight} kg | Prioridade {delivery.priority?.toLowerCase()}</div></div>
              </div>)}
              {!assigned.length && <span style={{ color: '#58708d' }}>Nenhuma entrega alocada neste drone.</span>}
            </div>
            {(selectedByDrone[drone.id] || []).length > 0 && <button onClick={() => unassignSelected(drone.id)} style={{ marginTop: '12px', padding: '9px 13px', border: 0, borderRadius: '8px', background: '#c53030', color: 'white', fontWeight: 700, cursor: 'pointer' }}>Remover selecionadas ({selectedByDrone[drone.id].length})</button>}
            {routeDeliveries.length > 0 && <div style={{ marginTop: '18px', padding: '16px', borderRadius: '12px', background: '#10233d', color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem' }}>Rota planejada</h3>
                  <p style={{ margin: '5px 0 0', opacity: 0.75, fontSize: '0.9rem' }}>Distância total pelas ruas: {drone.routeDistance || 0}</p>
                </div>
                {drone.routeStatus === 'AGUARDANDO_INICIO' && <button onClick={() => startFreight(drone.id)} style={{ padding: '9px 13px', border: 0, borderRadius: '8px', background: '#f6c453', color: '#10233d', fontWeight: 800, cursor: 'pointer' }}>Iniciar frete</button>}
                {drone.routeStatus === 'EM_ANDAMENTO' && <strong style={{ color: '#8ee3b0' }}>Frete em andamento</strong>}
              </div>
              <div style={{ marginTop: '14px', display: 'flex', gap: '7px', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.9rem' }}>
                <span>Hangar ({currentHangar?.positionX}, {currentHangar?.positionY})</span>
                {routeDeliveries.map((delivery) => <React.Fragment key={delivery.id}><span style={{ opacity: 0.5 }}>→</span><span>{delivery.recipientName} ({delivery.destinationX}, {delivery.destinationY})</span></React.Fragment>)}
                <span style={{ opacity: 0.5 }}>→</span>
                <span>Hangar</span>
              </div>
            </div>}
          </article>;
        })}
        {!visibleDrones.length && <div style={{ padding: '22px', borderRadius: '16px', background: 'white', color: '#58708d' }}>Nenhum drone cadastrado neste hangar.</div>}
      </div>}
    </div>
  );
};

export default GerenciarDrones;
