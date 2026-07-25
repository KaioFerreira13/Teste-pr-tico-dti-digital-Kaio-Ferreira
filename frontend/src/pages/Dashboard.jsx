import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { HangarContext } from '../context/HangarContext';
import api from '../services/api';
import { getErrorMessage } from '../utils/errorMessage';
import HangarRouteMap from '../components/HangarRouteMap';

const Dashboard = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [drones, setDrones] = useState([]);
  const [hangars, setHangars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { selectedHangarId } = useContext(HangarContext);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const [deliveriesRes, dronesRes, hangarsRes] = await Promise.all([
          api.get('/entregas/me'),
          api.get('/drones/me'),
          api.get('/hangars/me')
        ]);
        setDeliveries(Array.isArray(deliveriesRes.data) ? deliveriesRes.data : []);
        setDrones(Array.isArray(dronesRes.data) ? dronesRes.data : []);
        setHangars(Array.isArray(hangarsRes.data) ? hangarsRes.data : []);
      } catch (err) {
        setError(getErrorMessage(err, 'Nao foi possivel carregar a dashboard.'));
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const selectedHangar = useMemo(
    () => hangars.find((hangar) => hangar.id === selectedHangarId) || hangars[0] || null,
    [hangars, selectedHangarId]
  );

  const metrics = useMemo(() => {
    const total = deliveries.length;
    const delivered = deliveries.filter((item) => item.status === 'ENTREGUE').length;
    const highPriority = deliveries.filter((item) => item.priority === 'ALTA').length;
    const mediumPriority = deliveries.filter((item) => item.priority === 'MEDIA').length;
    const uniqueRecipients = new Set(deliveries.map((item) => item.recipientName).filter(Boolean)).size;
    const deliveredDurations = deliveries
      .filter((item) => item.status === 'ENTREGUE')
      .map((item) => {
        const drone = drones.find((entry) => entry.id === item.droneId);
        const routeDistance = Number(drone?.routeDistance || 0);
        const averageSpeed = Number(drone?.averageSpeed || 0);
        if (!routeDistance || !averageSpeed) return null;
        return (routeDistance / averageSpeed) * 60 * 60 * 1000;
      })
      .filter((value) => value !== null);
    const averageDeliveryMinutes = deliveredDurations.length
      ? Math.round(deliveredDurations.reduce((sum, value) => sum + value, 0) / deliveredDurations.length / 60000)
      : 0;

    return [
      { label: 'Entregas cadastradas', value: total },
      { label: 'Entregas realizadas', value: delivered },
      { label: 'Tempo medio por entrega', value: delivered ? `${averageDeliveryMinutes} min` : '0 min' },
      { label: 'Prioridade alta', value: highPriority },
    ];
  }, [deliveries, drones]);

  const droneRanking = useMemo(() => {
    return drones
      .map((drone) => {
        const deliveredCount = deliveries.filter((delivery) => delivery.droneId === drone.id && delivery.status === 'ENTREGUE').length;
        const routeDistance = Number(drone.routeDistance || 0);
        const averageSpeed = Number(drone.averageSpeed || 0);
        const efficiencyScore = deliveredCount / Math.max(routeDistance, 1);
        return {
          drone,
          deliveredCount,
          routeDistance,
          averageSpeed,
          efficiencyScore
        };
      })
      .filter((item) => item.deliveredCount > 0)
      .sort((a, b) => b.efficiencyScore - a.efficiencyScore)
      .slice(0, 5);
  }, [deliveries, drones]);

  const mapDeliveries = useMemo(
    () => deliveries.filter((delivery) => !selectedHangar || delivery.hangarId === selectedHangar.id),
    [deliveries, selectedHangar]
  );
  const mapDrones = useMemo(
    () => drones.filter((drone) => !selectedHangar || drone.hangarId === selectedHangar.id),
    [drones, selectedHangar]
  );

  return (
    <div style={{ minHeight: '100%', background: 'linear-gradient(180deg, #eef4ff 0%, #f8fafc 100%)', color: '#10233d' }}>
      <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0 }}>Dashboard</h1>
            <p style={{ margin: '8px 0 0', color: '#58708d' }}>Visao geral das suas entregas com dados reais do sistema.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link to="/entregas/cadastrar" style={{ padding: '10px 16px', borderRadius: '10px', background: '#0f5bd7', color: 'white', textDecoration: 'none' }}>
              Nova entrega
            </Link>
            <Link to="/dashboard/pedidos" style={{ padding: '10px 16px', borderRadius: '10px', background: '#10233d', color: 'white', textDecoration: 'none' }}>
              Pedidos
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

        <section style={{ background: 'white', padding: '24px', borderRadius: '18px', boxShadow: '0 10px 30px rgba(16,35,61,0.08)', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: 0 }}>Ranking de drones</h2>
              <p style={{ margin: '6px 0 0', color: '#58708d', fontSize: '0.85rem' }}>
                Ordenado por entregas concluidas divididas pela distancia da rota. Quanto maior o indice, mais eficiente o drone aparece.
              </p>
            </div>
          </div>
          <div style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
            {loading ? (
              <p>Carregando...</p>
            ) : droneRanking.length === 0 ? (
              <p>Nenhum drone finalizou entregas ainda.</p>
            ) : (
              droneRanking.map((item, index) => (
                <article key={item.drone.id} style={{ padding: '14px 16px', borderRadius: '12px', background: index === 0 ? '#eef6ff' : '#f7f9fc', display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>
                      {index + 1}. {item.drone.name}
                    </div>
                    <div style={{ color: '#58708d', fontSize: '0.9rem' }}>
                      {item.deliveredCount} entregas realizadas | Rota: {item.routeDistance || 0} km | Velocidade media: {item.averageSpeed || 0}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, color: '#0f5bd7' }}>{item.efficiencyScore.toFixed(3)}</div>
                </article>
              ))
            )}
          </div>
        </section>

        {selectedHangar && (
          <div style={{ marginBottom: '20px' }}>
            <HangarRouteMap hangar={selectedHangar} drones={mapDrones} deliveries={mapDeliveries} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
