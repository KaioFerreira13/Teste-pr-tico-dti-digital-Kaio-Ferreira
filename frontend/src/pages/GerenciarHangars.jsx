import React, { useContext, useEffect, useState } from 'react';
import api from '../services/api';
import HangarRouteMap from '../components/HangarRouteMap';
import RemainingTime from '../components/RemainingTime';
import { HangarContext } from '../context/HangarContext';

const GerenciarHangars = () => {
  const [hangars, setHangars] = useState([]);
  const [drones, setDrones] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const { selectedHangarId: selectedHangar } = useContext(HangarContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const resetDrone = async (droneId) => {
    const drone = drones.find((item) => item.id === droneId);
    if (!window.confirm(`Resetar o drone ${drone?.name || ''}? Todas as entregas alocadas voltarão para aguardando confirmação.`)) return;
    setError('');
    try {
      const response = await api.post(`/drones/${droneId}/reset`);
      setDrones((current) => current.map((item) => item.id === droneId ? response.data : item));
      setDeliveries((current) => current.map((delivery) => delivery.droneId === droneId
        ? { ...delivery, droneId: null, status: 'AGUARDANDO_CONFIRMACAO' }
        : delivery));
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Não foi possível resetar o drone.');
    }
  };

  const loadData = (silent = false) => {
    if (!silent) setLoading(true);
    Promise.all([api.get('/hangars/me'), api.get('/drones/me'), api.get('/entregas/me')])
      .then(([hangarsResponse, dronesResponse, deliveriesResponse]) => {
        setHangars(hangarsResponse.data || []);
        setDrones(dronesResponse.data || []);
        setDeliveries(deliveriesResponse.data || []);
      })
      .catch((err) => setError(err.response?.data?.message || err.response?.data || 'Não foi possível carregar os hangares.'))
      .finally(() => { if (!silent) setLoading(false); });
  };

  useEffect(() => {
    loadData();
    const interval = window.setInterval(() => loadData(true), 5000);
    return () => window.clearInterval(interval);
  }, []);

  const hangar = hangars.find((item) => item.id === selectedHangar);
  const hangarDrones = drones.filter((drone) => drone.hangarId === selectedHangar);
  const hangarDeliveries = deliveries.filter((delivery) => delivery.hangarId === selectedHangar);
  const confirmed = hangarDeliveries.filter((delivery) => delivery.status === 'CONFIRMADA' || delivery.status === 'NA_FILA').length;
  const dispatching = hangarDeliveries.filter((delivery) => delivery.status === 'EM_DESPACHO').length;

  return (
    <div>
      <header style={{ padding: '26px', borderRadius: '20px', background: 'white', boxShadow: '0 10px 30px rgba(16,35,61,0.08)' }}>
        <h1 style={{ margin: '0 0 8px' }}>Gestão de hangares</h1>
        <p style={{ margin: 0, color: '#58708d' }}>Selecione um hangar para acompanhar sua operação.</p>
        {error && <p style={{ color: '#c53030', marginBottom: 0 }}>{error}</p>}
      </header>

      {loading && <p>Carregando...</p>}
      {hangar && !loading && <>
        <section style={{ marginTop: '20px', padding: '22px', borderRadius: '18px', background: 'linear-gradient(135deg, #10233d 0%, #173a67 100%)', color: 'white' }}>
          <h2 style={{ margin: 0 }}>{hangar.name}</h2>
          <p style={{ margin: '8px 0 0', opacity: 0.8 }}>Posição operacional: ({hangar.positionX}, {hangar.positionY})</p>
        </section>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px', marginTop: '16px' }}>
          {[
            ['Drones', hangarDrones.length],
            ['Disponíveis', hangarDrones.filter((drone) => !drone.status || drone.status === 'DISPONIVEL').length],
            ['Entregas confirmadas', confirmed],
            ['Em despacho', dispatching]
          ].map(([label, value]) => <article key={label} style={{ padding: '20px', borderRadius: '16px', background: 'white', boxShadow: '0 8px 24px rgba(16,35,61,0.06)' }}>
            <div style={{ color: '#58708d', fontSize: '0.9rem' }}>{label}</div>
            <strong style={{ display: 'block', marginTop: '8px', fontSize: '2rem', color: '#10233d' }}>{value}</strong>
          </article>)}
        </div>
        <HangarRouteMap hangar={hangar} drones={hangarDrones} deliveries={hangarDeliveries} />
        <section style={{ marginTop: '16px' }}>
          <h2 style={{ color: '#10233d' }}>Drones e rotas</h2>
          <div style={{ display: 'grid', gap: '14px' }}>
            {hangarDrones.map((drone) => {
              const assigned = hangarDeliveries.filter((delivery) => delivery.droneId === drone.id && delivery.status === 'EM_DESPACHO');
              const routeDeliveries = (drone.routeDeliveryIds || [])
                .map((deliveryId) => assigned.find((delivery) => delivery.id === deliveryId))
                .filter(Boolean);
              return <article key={drone.id} style={{ padding: '20px', borderRadius: '16px', background: 'white', boxShadow: '0 8px 24px rgba(16,35,61,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px', flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>{drone.name}</h3>
                    <p style={{ margin: '6px 0 0', color: '#58708d' }}>Status: {(drone.status || 'DISPONIVEL').toLowerCase().replaceAll('_', ' ')} | Carga: {drone.currentLoad || 0} / {drone.maxWeight} kg</p>
                  </div>
                  <div style={{ display: 'flex', gap: '9px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {drone.routeStatus === 'AGUARDANDO_INICIO' && <button onClick={() => startFreight(drone.id)} style={{ padding: '10px 14px', border: 0, borderRadius: '9px', background: '#f6c453', color: '#10233d', fontWeight: 800, cursor: 'pointer' }}>Confirmar início do frete</button>}
                    {drone.routeStatus === 'EM_ANDAMENTO' && <strong style={{ padding: '8px 12px', borderRadius: '8px', background: '#dcfce7', color: '#237a48' }}>Tempo restante: <RemainingTime estimatedCompletionAt={drone.routeEstimatedCompletionAt} /></strong>}
                    <button onClick={() => resetDrone(drone.id)} style={{ padding: '10px 14px', border: 0, borderRadius: '9px', background: '#fee2e2', color: '#c53030', fontWeight: 800, cursor: 'pointer' }}>Resetar drone</button>
                  </div>
                </div>

                {routeDeliveries.length > 0 ? <div style={{ marginTop: '16px', padding: '15px', borderRadius: '12px', background: '#f7f9fc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <strong>Rota planejada</strong>
                    <span style={{ color: '#58708d' }}>Distância total: {drone.routeDistance || 0}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '7px', alignItems: 'center', flexWrap: 'wrap', marginTop: '12px', color: '#40566f', fontSize: '0.9rem' }}>
                    <span>Hangar ({hangar.positionX}, {hangar.positionY})</span>
                    {routeDeliveries.map((delivery) => <React.Fragment key={delivery.id}><span style={{ color: '#94a3b8' }}>→</span><span>{delivery.recipientName} ({delivery.destinationX}, {delivery.destinationY})</span></React.Fragment>)}
                    <span style={{ color: '#94a3b8' }}>→</span>
                    <span>Hangar</span>
                  </div>
                </div> : <p style={{ marginBottom: 0, color: '#58708d' }}>Nenhuma rota planejada para este drone.</p>}
              </article>;
            })}
            {!hangarDrones.length && <div style={{ padding: '20px', borderRadius: '16px', background: 'white', color: '#58708d' }}>Nenhum drone cadastrado neste hangar.</div>}
          </div>
        </section>
      </>}
    </div>
  );
};

export default GerenciarHangars;
