import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { HangarContext } from '../context/HangarContext';
import api from '../services/api';
import { getErrorMessage } from '../utils/errorMessage';
const statusColumns = [{
  value: 'DISPONIVEL',
  label: 'Disponivel'
}, {
  value: 'EM_DESPACHO',
  label: 'Em despacho'
}, {
  value: 'EM_ROTA',
  label: 'Em rota'
}, {
  value: 'EM_MANUTENCAO',
  label: 'Em manutencao'
}, {
  value: 'RECARREGANDO',
  label: 'Recarregando'
}];
const DashboardDrones = () => {
  const [drones, setDrones] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [hangars, setHangars] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const {
    selectedHangarId
  } = useContext(HangarContext);
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [dronesRes, deliveriesRes, hangarsRes, modelsRes] = await Promise.all([api.get('/drones/me'), api.get('/entregas/me'), api.get('/hangars/me'), api.get('/modelos/me')]);
        setDrones(Array.isArray(dronesRes.data) ? dronesRes.data : []);
        setDeliveries(Array.isArray(deliveriesRes.data) ? deliveriesRes.data : []);
        setHangars(Array.isArray(hangarsRes.data) ? hangarsRes.data : []);
        setModels(Array.isArray(modelsRes.data) ? modelsRes.data : []);
      } catch (err) {
        setError(getErrorMessage(err, 'Nao foi possivel carregar a dashboard de drones.'));
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);
  const selectedHangar = useMemo(() => hangars.find(hangar => hangar.id === selectedHangarId) || hangars[0] || null, [hangars, selectedHangarId]);
  const groupedDrones = useMemo(() => statusColumns.map(column => ({
    ...column,
    items: drones.filter(drone => (drone.status || 'DISPONIVEL') === column.value)
  })), [drones]);
  const metrics = useMemo(() => {
    const total = drones.length;
    const available = drones.filter(drone => !drone.status || drone.status === 'DISPONIVEL').length;
    const inDispatch = drones.filter(drone => drone.status === 'EM_DESPACHO').length;
    const inRoute = drones.filter(drone => drone.status === 'EM_ROTA').length;
    const totalLoad = drones.reduce((sum, drone) => sum + Number(drone.currentLoad || 0), 0);
    return [{
      label: 'Drones cadastrados',
      value: total
    }, {
      label: 'Disponiveis',
      value: available
    }, {
      label: 'Em despacho',
      value: inDispatch
    }, {
      label: 'Em rota',
      value: inRoute
    }, {
      label: 'Carga total alocada',
      value: `${totalLoad.toFixed(1)} kg`
    }];
  }, [drones]);
  const visibleDeliveries = useMemo(() => deliveries.filter(delivery => !selectedHangar || delivery.hangarId === selectedHangar.id), [deliveries, selectedHangar]);
  const visibleDrones = useMemo(() => drones.filter(drone => !selectedHangar || drone.hangarId === selectedHangar.id), [drones, selectedHangar]);
  const modelById = useMemo(() => {
    return models.reduce((accumulator, model) => {
      accumulator[model.id] = model;
      return accumulator;
    }, {});
  }, [models]);
  return <div className="[min-height:100%] [background:linear-gradient(180deg,_#eef4ff_0%,_#f8fafc_100%)] [color:#10233d]">
      <div className="[margin:0_auto]">
        <div className="[display:flex] [justify-content:space-between] [align-items:center] [margin-bottom:24px] [gap:16px] [flex-wrap:wrap]">
          <div>
            <h1 className="[margin:0]">Dashboard de drones</h1>
            <p className="[margin:8px_0_0] [color:#58708d]">Visao consolidada dos drones e do estado operacional de cada um.</p>
          </div>
          <div className="[display:flex] [gap:10px] [flex-wrap:wrap]">
            <Link to="/dashboard" className="[padding:10px_16px] [border-radius:10px] [background:#10233d] [color:white] [text-decoration:none]">
              Voltar ao geral
            </Link>
            <Link to="/drones/gerenciar" className="[padding:10px_16px] [border-radius:10px] [background:#0f5bd7] [color:white] [text-decoration:none]">
              Gerenciar drones
            </Link>
          </div>
        </div>

        {error && <div className="[margin-bottom:16px] [padding:12px_14px] [border-radius:10px] [background:#ffe3e3] [color:#9d1c1c]">{error}</div>}

        <section className="[display:grid] [grid-template-columns:repeat(auto-fit,_minmax(220px,_1fr))] [gap:16px] [margin-bottom:24px]">
          {metrics.map(item => <article key={item.label} className="[background:white] [padding:22px] [border-radius:18px] [box-shadow:0_10px_30px_rgba(16,35,61,0.08)]">
              <div className="[color:#58708d] [margin-bottom:10px]">{item.label}</div>
              <div className="[font-size:2rem] [font-weight:700]">{loading ? '...' : item.value}</div>
            </article>)}
        </section>

        <section className="[display:grid] [grid-template-columns:repeat(5,_minmax(240px,_1fr))] [gap:16px] [margin-bottom:20px] [overflow-x:auto] [padding-bottom:6px]">
          {groupedDrones.map(column => <article key={column.value} className="[background:white] [padding:18px] [border-radius:18px] [box-shadow:0_10px_30px_rgba(16,35,61,0.08)] [min-height:260px]">
              <div className="[display:flex] [justify-content:space-between] [gap:12px] [align-items:center]">
                <h2 className="[margin:0] [font-size:1.05rem]">{column.label}</h2>
                <span className="[color:#58708d]">{column.items.length}</span>
              </div>
              <div className="[display:grid] [gap:10px] [margin-top:14px]">
                {column.items.length ? column.items.map(drone => {
              const assigned = visibleDeliveries.filter(delivery => delivery.droneId === drone.id);
              return <div key={drone.id} className="[padding:12px] [border-radius:12px] [background:#f7f9fc] [border-left:4px_solid_#0f5bd7]">
                      <div className="[margin-top:8px] [font-weight:700]">{drone.name}</div>
                      <div className="[color:#58708d] [font-size:0.88rem]">
                        Modelo: {modelById[drone.modelId]?.name || 'Sem modelo'}
                      </div>
                      <div className="[color:#58708d] [font-size:0.88rem]">
                        Carga: {drone.currentLoad || 0} / {drone.maxWeight} kg
                      </div>
                      <div className="[color:#58708d] [font-size:0.88rem]">
                        Bateria: {Number(drone.batteryLevel ?? 100).toFixed(1)}%
                      </div>
                      <div className="[color:#58708d] [font-size:0.88rem]">
                        Entregas vinculadas: {assigned.length}
                      </div>
                    </div>;
            }) : <span className="[color:#58708d]">Nenhum drone neste estado.</span>}
              </div>
            </article>)}
        </section>

        {selectedHangar && <section className="[background:white] [padding:18px] [border-radius:18px] [box-shadow:0_10px_30px_rgba(16,35,61,0.08)]">
            <h2 className="[margin-top:0]">Hangar selecionado</h2>
            <p className="[margin:0] [color:#58708d]">
              {selectedHangar.name} ({selectedHangar.positionX}, {selectedHangar.positionY})
            </p>
            <p className="[margin:8px_0_0] [color:#58708d]">
              {visibleDrones.length} drone(s) visivel(is) neste hangar.
            </p>
          </section>}
      </div>
    </div>;
};
export default DashboardDrones;
