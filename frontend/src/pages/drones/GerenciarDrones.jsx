import React, { useContext, useEffect, useState } from 'react';
import { getDashboardData } from '../../services/dashboardService';
import {
  startDroneFreight,
  unassignDroneDeliveries,
  updateDroneStatus,
} from '../../services/droneService';
import RemainingTime from '../../components/feedback/RemainingTime';
import { HangarContext } from '../../context/HangarContext';
const droneStatuses = [{
  value: 'DISPONIVEL',
  label: 'Disponível'
}, {
  value: 'EM_DESPACHO',
  label: 'Em despacho'
}, {
  value: 'EM_ROTA',
  label: 'Em rota'
}, {
  value: 'EM_MANUTENCAO',
  label: 'Em manutenção'
}, {
  value: 'RECARREGANDO',
  label: 'Recarregando'
}];
const GerenciarDrones = () => {
  const [hangars, setHangars] = useState([]);
  const [drones, setDrones] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const {
    selectedHangarId: selectedHangar
  } = useContext(HangarContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedByDrone, setSelectedByDrone] = useState({});
  const loadData = async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError('');
    }
    try {
      const data = await getDashboardData();
      setHangars(data.hangars);
      setDrones(data.drones);
      setDeliveries(data.deliveries);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Não foi possível carregar a gestão de drones.');
    } finally {
      if (!silent) setLoading(false);
    }
  };
  useEffect(() => {
    loadData();
    const interval = window.setInterval(() => loadData(true), 5000);
    return () => window.clearInterval(interval);
  }, []);
  const updateStatus = async (droneId, status) => {
    setError('');
    try {
      const updatedDrone = await updateDroneStatus(droneId, status);
      setDrones(current => current.map(drone => drone.id === droneId ? updatedDrone : drone));
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Não foi possível atualizar o status do drone.');
    }
  };
  const toggleDelivery = (droneId, deliveryId) => {
    setSelectedByDrone(current => {
      const selected = current[droneId] || [];
      return {
        ...current,
        [droneId]: selected.includes(deliveryId) ? selected.filter(id => id !== deliveryId) : [...selected, deliveryId]
      };
    });
  };
  const unassignSelected = async droneId => {
    const deliveryIds = selectedByDrone[droneId] || [];
    if (!deliveryIds.length) return;
    if (!window.confirm(`Remover ${deliveryIds.length} entrega(s) do drone e devolvê-las para aguardando confirmação?`)) return;
    setError('');
    try {
      await unassignDroneDeliveries(droneId, deliveryIds);
      setSelectedByDrone(current => ({
        ...current,
        [droneId]: []
      }));
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Não foi possível remover a entrega do drone.');
    }
  };
  const startFreight = async droneId => {
    if (!window.confirm('Confirmar o início deste frete?')) return;
    setError('');
    try {
      const updatedDrone = await startDroneFreight(droneId);
      setDrones(current => current.map(drone => drone.id === droneId ? updatedDrone : drone));
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Não foi possível iniciar o frete.');
    }
  };
  const visibleDrones = drones.filter(drone => drone.hangarId === selectedHangar);
  const currentHangar = hangars.find(hangar => hangar.id === selectedHangar);
  return <div className="[max-width:1100px]">
      <header className="[padding:26px] [border-radius:20px] [background:white] [box-shadow:0_10px_30px_rgba(16,35,61,0.08)]">
        <h1 className="[margin:0_0_8px]">Gestão de drones</h1>
        <p className="[margin:0] [color:#58708d]">Acompanhe as entregas alocadas e controle a situação operacional de cada drone.</p>
        {error && <p className="[color:#c53030] [margin-bottom:0]">{error}</p>}
      </header>

      {loading && <p>Carregando...</p>}
      {selectedHangar && !loading && <div className="[display:grid] [gap:16px] [margin-top:20px]">
        {visibleDrones.map(drone => {
        const assigned = deliveries.filter(delivery => delivery.droneId === drone.id && (delivery.status === 'EM_DESPACHO' || delivery.status === 'EM_ROTA'));
        const routeDeliveries = (drone.routeDeliveryIds || []).map(deliveryId => assigned.find(delivery => delivery.id === deliveryId)).filter(Boolean);
        return <article key={drone.id} className="[padding:22px] [border-radius:18px] [background:white] [box-shadow:0_8px_24px_rgba(16,35,61,0.06)]">
            <div className="[display:flex] [justify-content:space-between] [align-items:flex-start] [gap:16px] [flex-wrap:wrap]">
              <div><h2 className="[margin:0]">{drone.name}</h2><p className="[margin:6px_0_0] [color:#58708d]">Carga: {drone.currentLoad || 0} / {drone.maxWeight} kg | Bateria: {Number(drone.batteryLevel ?? 100).toFixed(1)}%</p></div>
              <label className="[color:#58708d]">Status
                <select disabled={drone.status === 'EM_DESPACHO' || drone.status === 'EM_ROTA'} value={drone.status || 'DISPONIVEL'} onChange={event => updateStatus(drone.id, event.target.value)} title={drone.status === 'EM_DESPACHO' || drone.status === 'EM_ROTA' ? 'O status não pode ser alterado durante o frete' : ''} style={{
                background: drone.status === 'EM_DESPACHO' || drone.status === 'EM_ROTA' ? '#edf2f7' : 'white',
                cursor: drone.status === 'EM_DESPACHO' || drone.status === 'EM_ROTA' ? 'not-allowed' : 'pointer'
              }} className="[display:block] [margin-top:5px] [padding:9px] [border-radius:8px] [border:1px_solid_#d6deea]">
                  {droneStatuses.map(status => <option key={status.value} value={status.value}>{status.label}</option>)}
                </select>
                {(drone.status === 'EM_DESPACHO' || drone.status === 'EM_ROTA') && <small className="[display:block] [margin-top:5px] [max-width:190px]">Bloqueado durante o frete</small>}
              </label>
            </div>
            <h3 className="[margin-bottom:10px] [font-size:1rem]">Entregas alocadas ({assigned.length})</h3>
            <div className="[display:grid] [gap:9px]">
              {assigned.map(delivery => <div key={delivery.id} className="[display:flex] [align-items:center] [gap:12px] [padding:12px] [border-radius:10px] [background:#f7f9fc]">
                <input type="checkbox" checked={(selectedByDrone[drone.id] || []).includes(delivery.id)} onChange={() => toggleDelivery(drone.id, delivery.id)} aria-label={`Selecionar entrega de ${delivery.recipientName}`} className="[width:18px] [height:18px] [cursor:pointer]" />
                <div><strong>{delivery.recipientName}</strong><div className="[color:#58708d] [font-size:0.9rem]">{delivery.weight} kg | Prioridade {delivery.priority?.toLowerCase()}</div>{drone.routeStatus === 'EM_ANDAMENTO' && <div className="[margin-top:4px] [color:#237a48] [font-size:0.9rem] [font-weight:700]">Tempo restante: <RemainingTime estimatedCompletionAt={delivery.estimatedDeliveryAt} /></div>}</div>
              </div>)}
              {!assigned.length && <span className="[color:#58708d]">Nenhuma entrega alocada neste drone.</span>}
            </div>
            {(selectedByDrone[drone.id] || []).length > 0 && <button onClick={() => unassignSelected(drone.id)} className="[margin-top:12px] [padding:9px_13px] [border:0] [border-radius:8px] [background:#c53030] [color:white] [font-weight:700] [cursor:pointer]">Remover selecionadas ({selectedByDrone[drone.id].length})</button>}
            {routeDeliveries.length > 0 && <div className="[margin-top:18px] [padding:16px] [border-radius:12px] [background:#10233d] [color:white]">
              <div className="[display:flex] [justify-content:space-between] [gap:12px] [align-items:center] [flex-wrap:wrap]">
                <div>
                  <h3 className="[margin:0] [font-size:1rem]">Rota planejada</h3>
                  <p className="[margin:5px_0_0] [opacity:0.75] [font-size:0.9rem]">Distância total pelas ruas: {drone.routeDistance || 0}</p>
                </div>
                {drone.routeStatus === 'AGUARDANDO_INICIO' && <button onClick={() => startFreight(drone.id)} className="[padding:9px_13px] [border:0] [border-radius:8px] [background:#f6c453] [color:#10233d] [font-weight:800] [cursor:pointer]">Iniciar frete</button>}
                {drone.routeStatus === 'EM_ANDAMENTO' && <strong className="[color:#8ee3b0]">Frete em andamento</strong>}
              </div>
              <div className="[margin-top:14px] [display:flex] [gap:7px] [align-items:center] [flex-wrap:wrap] [font-size:0.9rem]">
                <span>Hangar ({currentHangar?.positionX}, {currentHangar?.positionY})</span>
                {routeDeliveries.map(delivery => <React.Fragment key={delivery.id}><span className="[opacity:0.5]">→</span><span>{delivery.recipientName} ({delivery.destinationX}, {delivery.destinationY})</span></React.Fragment>)}
                <span className="[opacity:0.5]">→</span>
                <span>Hangar</span>
              </div>
            </div>}
          </article>;
      })}
        {!visibleDrones.length && <div className="[padding:22px] [border-radius:16px] [background:white] [color:#58708d]">Nenhum drone cadastrado neste hangar.</div>}
      </div>}
    </div>;
};
export default GerenciarDrones;
