import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { HangarContext } from '../context/HangarContext';
import api from '../services/api';
import { getErrorMessage } from '../utils/errorMessage';

const statusColumns = [
  { value: 'DISPONIVEL', label: 'Disponivel' },
  { value: 'EM_DESPACHO', label: 'Em despacho' },
  { value: 'EM_ROTA', label: 'Em rota' },
  { value: 'EM_MANUTENCAO', label: 'Em manutencao' },
  { value: 'RECARREGANDO', label: 'Recarregando' }
];

const DashboardDrones = () => {
  const [drones, setDrones] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [hangars, setHangars] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { selectedHangarId } = useContext(HangarContext);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [dronesRes, deliveriesRes, hangarsRes, modelsRes] = await Promise.all([
          api.get('/drones/me'),
          api.get('/entregas/me'),
          api.get('/hangars/me'),
          api.get('/modelos/me')
        ]);
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

  const selectedHangar = useMemo(
    () => hangars.find((hangar) => hangar.id === selectedHangarId) || hangars[0] || null,
    [hangars, selectedHangarId]
  );

  const groupedDrones = useMemo(() => (
    statusColumns.map((column) => ({
      ...column,
      items: drones.filter((drone) => (drone.status || 'DISPONIVEL') === column.value)
    }))
  ), [drones]);

  const metrics = useMemo(() => {
    const total = drones.length;
    const available = drones.filter((drone) => !drone.status || drone.status === 'DISPONIVEL').length;
    const inDispatch = drones.filter((drone) => drone.status === 'EM_DESPACHO').length;
    const inRoute = drones.filter((drone) => drone.status === 'EM_ROTA').length;
    const totalLoad = drones.reduce((sum, drone) => sum + Number(drone.currentLoad || 0), 0);
    return [
      { label: 'Drones cadastrados', value: total },
      { label: 'Disponiveis', value: available },
      { label: 'Em despacho', value: inDispatch },
      { label: 'Em rota', value: inRoute },
      { label: 'Carga total alocada', value: `${totalLoad.toFixed(1)} kg` }
    ];
  }, [drones]);

  const visibleDeliveries = useMemo(
    () => deliveries.filter((delivery) => !selectedHangar || delivery.hangarId === selectedHangar.id),
    [deliveries, selectedHangar]
  );
  const visibleDrones = useMemo(
    () => drones.filter((drone) => !selectedHangar || drone.hangarId === selectedHangar.id),
    [drones, selectedHangar]
  );
  const modelById = useMemo(() => {
    return models.reduce((accumulator, model) => {
      accumulator[model.id] = model;
      return accumulator;
    }, {});
  }, [models]);

  return (
    <div style={{ minHeight: '100%', background: 'linear-gradient(180deg, #eef4ff 0%, #f8fafc 100%)', color: '#10233d' }}>
      <div style={{ margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0 }}>Dashboard de drones</h1>
            <p style={{ margin: '8px 0 0', color: '#58708d' }}>Visao consolidada dos drones e do estado operacional de cada um.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link to="/dashboard" style={{ padding: '10px 16px', borderRadius: '10px', background: '#10233d', color: 'white', textDecoration: 'none' }}>
              Voltar ao geral
            </Link>
            <Link to="/drones/gerenciar" style={{ padding: '10px 16px', borderRadius: '10px', background: '#0f5bd7', color: 'white', textDecoration: 'none' }}>
              Gerenciar drones
            </Link>
          </div>
        </div>

        {error && <div style={{ marginBottom: '16px', padding: '12px 14px', borderRadius: '10px', background: '#ffe3e3', color: '#9d1c1c' }}>{error}</div>}

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {metrics.map((item) => (
            <article key={item.label} style={{ background: 'white', padding: '22px', borderRadius: '18px', boxShadow: '0 10px 30px rgba(16,35,61,0.08)' }}>
              <div style={{ color: '#58708d', marginBottom: '10px' }}>{item.label}</div>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>{loading ? '...' : item.value}</div>
            </article>
          ))}
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '6px' }}>
          {groupedDrones.map((column) => (
            <article key={column.value} style={{ background: 'white', padding: '18px', borderRadius: '18px', boxShadow: '0 10px 30px rgba(16,35,61,0.08)', minHeight: '260px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '1.05rem' }}>{column.label}</h2>
                <span style={{ color: '#58708d' }}>{column.items.length}</span>
              </div>
              <div style={{ display: 'grid', gap: '10px', marginTop: '14px' }}>
                {column.items.length ? column.items.map((drone) => {
                  const assigned = visibleDeliveries.filter((delivery) => delivery.droneId === drone.id);
                  return (
                    <div key={drone.id} style={{ padding: '12px', borderRadius: '12px', background: '#f7f9fc', borderLeft: '4px solid #0f5bd7' }}>
                      <div style={{ marginTop: '8px', fontWeight: 700 }}>{drone.name}</div>
                      <div style={{ color: '#58708d', fontSize: '0.88rem' }}>
                        Modelo: {modelById[drone.modelId]?.name || 'Sem modelo'}
                      </div>
                      <div style={{ color: '#58708d', fontSize: '0.88rem' }}>
                        Carga: {drone.currentLoad || 0} / {drone.maxWeight} kg
                      </div>
                      <div style={{ color: '#58708d', fontSize: '0.88rem' }}>
                        Bateria: {Number(drone.batteryLevel ?? 100).toFixed(1)}%
                      </div>
                      <div style={{ color: '#58708d', fontSize: '0.88rem' }}>
                        Entregas vinculadas: {assigned.length}
                      </div>
                    </div>
                  );
                }) : (
                  <span style={{ color: '#58708d' }}>Nenhum drone neste estado.</span>
                )}
              </div>
            </article>
          ))}
        </section>

        {selectedHangar && (
          <section style={{ background: 'white', padding: '18px', borderRadius: '18px', boxShadow: '0 10px 30px rgba(16,35,61,0.08)' }}>
            <h2 style={{ marginTop: 0 }}>Hangar selecionado</h2>
            <p style={{ margin: 0, color: '#58708d' }}>
              {selectedHangar.name} ({selectedHangar.positionX}, {selectedHangar.positionY})
            </p>
            <p style={{ margin: '8px 0 0', color: '#58708d' }}>
              {visibleDrones.length} drone(s) visivel(is) neste hangar.
            </p>
          </section>
        )}
      </div>
    </div>
  );
};

export default DashboardDrones;
