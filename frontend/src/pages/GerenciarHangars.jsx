import React, { useContext, useEffect, useState } from 'react';
import api from '../services/api';
import HangarRouteMap from '../components/HangarRouteMap';
import RemainingTime from '../components/RemainingTime';
import { HangarContext } from '../context/HangarContext';
const GerenciarHangars = () => {
  const [hangars, setHangars] = useState([]);
  const [drones, setDrones] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const {
    selectedHangarId: selectedHangar
  } = useContext(HangarContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const startFreight = async droneId => {
    if (!window.confirm('Confirmar o início deste frete?')) return;
    setError('');
    try {
      const response = await api.post(`/drones/${droneId}/iniciar-frete`);
      setDrones(current => current.map(drone => drone.id === droneId ? response.data : drone));
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Não foi possível iniciar o frete.');
    }
  };
  const resetDrone = async droneId => {
    const drone = drones.find(item => item.id === droneId);
    if (!window.confirm(`Resetar o drone ${drone?.name || ''}? Todas as entregas alocadas voltarão para aguardando confirmação.`)) return;
    setError('');
    try {
      const response = await api.post(`/drones/${droneId}/reset`);
      setDrones(current => current.map(item => item.id === droneId ? response.data : item));
      setDeliveries(current => current.map(delivery => delivery.droneId === droneId ? {
        ...delivery,
        droneId: null,
        status: 'AGUARDANDO_CONFIRMACAO'
      } : delivery));
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Não foi possível resetar o drone.');
    }
  };
  const loadData = (silent = false) => {
    if (!silent) setLoading(true);
    Promise.all([api.get('/hangars/me'), api.get('/drones/me'), api.get('/entregas/me')]).then(([hangarsResponse, dronesResponse, deliveriesResponse]) => {
      setHangars(hangarsResponse.data || []);
      setDrones(dronesResponse.data || []);
      setDeliveries(deliveriesResponse.data || []);
    }).catch(err => setError(err.response?.data?.message || err.response?.data || 'Não foi possível carregar os hangares.')).finally(() => {
      if (!silent) setLoading(false);
    });
  };
  useEffect(() => {
    loadData();
    const interval = window.setInterval(() => loadData(true), 5000);
    return () => window.clearInterval(interval);
  }, []);
  const hangar = hangars.find(item => item.id === selectedHangar);
  const hangarDrones = drones.filter(drone => drone.hangarId === selectedHangar);
  const hangarDeliveries = deliveries.filter(delivery => delivery.hangarId === selectedHangar);
  const confirmed = hangarDeliveries.filter(delivery => delivery.status === 'CONFIRMADA' || delivery.status === 'NA_FILA').length;
  const dispatching = hangarDeliveries.filter(delivery => delivery.status === 'EM_DESPACHO').length;
  return <div>
      <header className="[padding:26px] [border-radius:20px] [background:white] [box-shadow:0_10px_30px_rgba(16,35,61,0.08)]">
        <h1 className="[margin:0_0_8px]">Gestão de hangares</h1>
        <p className="[margin:0] [color:#58708d]">Selecione um hangar para acompanhar sua operação.</p>
        {error && <p className="[color:#c53030] [margin-bottom:0]">{error}</p>}
      </header>

      {loading && <p>Carregando...</p>}
      {hangar && !loading && <>
        <section className="[margin-top:20px] [padding:22px] [border-radius:18px] [background:linear-gradient(135deg,_#10233d_0%,_#173a67_100%)] [color:white]">
          <h2 className="[margin:0]">{hangar.name}</h2>
          <p className="[margin:8px_0_0] [opacity:0.8]">Posição operacional: ({hangar.positionX}, {hangar.positionY})</p>
        </section>
        <div className="[display:grid] [grid-template-columns:repeat(auto-fit,_minmax(190px,_1fr))] [gap:14px] [margin-top:16px]">
          {[['Drones', hangarDrones.length], ['Disponíveis', hangarDrones.filter(drone => !drone.status || drone.status === 'DISPONIVEL').length], ['Entregas confirmadas', confirmed], ['Em despacho', dispatching]].map(([label, value]) => <article key={label} className="[padding:20px] [border-radius:16px] [background:white] [box-shadow:0_8px_24px_rgba(16,35,61,0.06)]">
            <div className="[color:#58708d] [font-size:0.9rem]">{label}</div>
            <strong className="[display:block] [margin-top:8px] [font-size:2rem] [color:#10233d]">{value}</strong>
          </article>)}
        </div>
        <HangarRouteMap hangar={hangar} drones={hangarDrones} deliveries={hangarDeliveries} />
        <section className="[margin-top:16px]">
          <h2 className="[color:#10233d]">Drones e rotas</h2>
          <div className="[display:grid] [gap:14px]">
            {hangarDrones.map(drone => {
            const assigned = hangarDeliveries.filter(delivery => delivery.droneId === drone.id && delivery.status === 'EM_DESPACHO');
            const routeDeliveries = (drone.routeDeliveryIds || []).map(deliveryId => assigned.find(delivery => delivery.id === deliveryId)).filter(Boolean);
            return <article key={drone.id} className="[padding:20px] [border-radius:16px] [background:white] [box-shadow:0_8px_24px_rgba(16,35,61,0.06)]">
                <div className="[display:flex] [justify-content:space-between] [align-items:flex-start] [gap:14px] [flex-wrap:wrap]">
                  <div>
                    <h3 className="[margin:0]">{drone.name}</h3>
                    <p className="[margin:6px_0_0] [color:#58708d]">Status: {(drone.status || 'DISPONIVEL').toLowerCase().replaceAll('_', ' ')} | Carga: {drone.currentLoad || 0} / {drone.maxWeight} kg | Bateria: {Number(drone.batteryLevel ?? 100).toFixed(1)}%</p>
                  </div>
                  <div className="[display:flex] [gap:9px] [align-items:center] [flex-wrap:wrap]">
                    {drone.routeStatus === 'AGUARDANDO_INICIO' && <button onClick={() => startFreight(drone.id)} className="[padding:10px_14px] [border:0] [border-radius:9px] [background:#f6c453] [color:#10233d] [font-weight:800] [cursor:pointer]">Confirmar início do frete</button>}
                    {drone.routeStatus === 'EM_ANDAMENTO' && <strong className="[padding:8px_12px] [border-radius:8px] [background:#dcfce7] [color:#237a48]">Tempo restante: <RemainingTime estimatedCompletionAt={drone.routeEstimatedCompletionAt} /></strong>}
                    <button onClick={() => resetDrone(drone.id)} className="[padding:10px_14px] [border:0] [border-radius:9px] [background:#fee2e2] [color:#c53030] [font-weight:800] [cursor:pointer]">Resetar drone</button>
                  </div>
                </div>

                {routeDeliveries.length > 0 ? <div className="[margin-top:16px] [padding:15px] [border-radius:12px] [background:#f7f9fc]">
                  <div className="[display:flex] [justify-content:space-between] [gap:12px] [flex-wrap:wrap]">
                    <strong>Rota planejada</strong>
                    <span className="[color:#58708d]">Distância total: {drone.routeDistance || 0}</span>
                  </div>
                  <div className="[display:flex] [gap:7px] [align-items:center] [flex-wrap:wrap] [margin-top:12px] [color:#40566f] [font-size:0.9rem]">
                    <span>Hangar ({hangar.positionX}, {hangar.positionY})</span>
                    {routeDeliveries.map(delivery => <React.Fragment key={delivery.id}><span className="[color:#94a3b8]">→</span><span>{delivery.recipientName} ({delivery.destinationX}, {delivery.destinationY})</span></React.Fragment>)}
                    <span className="[color:#94a3b8]">→</span>
                    <span>Hangar</span>
                  </div>
                </div> : <p className="[margin-bottom:0] [color:#58708d]">Nenhuma rota planejada para este drone.</p>}
              </article>;
          })}
            {!hangarDrones.length && <div className="[padding:20px] [border-radius:16px] [background:white] [color:#58708d]">Nenhum drone cadastrado neste hangar.</div>}
          </div>
        </section>
      </>}
    </div>;
};
export default GerenciarHangars;
