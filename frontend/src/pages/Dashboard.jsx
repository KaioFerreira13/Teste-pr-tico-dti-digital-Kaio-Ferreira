import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { getErrorMessage } from '../utils/errorMessage';

const Dashboard = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const response = await api.get('/entregas/me');
        setDeliveries(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        setError(getErrorMessage(err, 'Nao foi possivel carregar a dashboard.'));
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const metrics = useMemo(() => {
    const total = deliveries.length;
    const highPriority = deliveries.filter((item) => item.priority === 'ALTA').length;
    const mediumPriority = deliveries.filter((item) => item.priority === 'MEDIA').length;
    const uniqueRecipients = new Set(deliveries.map((item) => item.recipientName).filter(Boolean)).size;

    return [
      { label: 'Entregas cadastradas', value: total },
      { label: 'Prioridade alta', value: highPriority },
      { label: 'Prioridade média', value: mediumPriority },
      { label: 'Destinatários únicos', value: uniqueRecipients }
    ];
  }, [deliveries]);

  const recentDeliveries = useMemo(() => [...deliveries].slice(0, 5), [deliveries]);

  return (
    <div style={{ minHeight: '100%', background: 'linear-gradient(180deg, #eef4ff 0%, #f8fafc 100%)', color: '#10233d' }}>
      <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0 }}>Dashboard</h1>
            <p style={{ margin: '8px 0 0', color: '#58708d' }}>Visão geral das suas entregas com dados reais do sistema.</p>
          </div>
          <Link to="/entregas" style={{ padding: '10px 16px', borderRadius: '10px', background: '#0f5bd7', color: 'white', textDecoration: 'none' }}>
            Nova entrega
          </Link>
        </div>

        {error && <div style={{ marginBottom: '16px', padding: '12px 14px', borderRadius: '10px', background: '#ffe3e3', color: '#9d1c1c' }}>{error}</div>}

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {metrics.map((item) => (
            <article key={item.label} style={{ background: 'white', padding: '22px', borderRadius: '18px', boxShadow: '0 10px 30px rgba(16,35,61,0.08)' }}>
              <div style={{ color: '#58708d', marginBottom: '10px' }}>{item.label}</div>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>{loading ? '...' : item.value}</div>
            </article>
          ))}
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>
          <article style={{ background: 'white', padding: '24px', borderRadius: '18px', boxShadow: '0 10px 30px rgba(16,35,61,0.08)' }}>
            <h2 style={{ marginTop: 0 }}>Entregas recentes</h2>
            {loading ? (
              <p>Carregando...</p>
            ) : recentDeliveries.length === 0 ? (
              <p>Você ainda não cadastrou entregas.</p>
            ) : (
              <div style={{ display: 'grid', gap: '14px' }}>
                {recentDeliveries.map((item) => (
                  <div key={item.id} style={{ padding: '14px 16px', borderRadius: '12px', background: '#f7f9fc', display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{item.recipientName}</div>
                      <div style={{ color: '#58708d', fontSize: '0.92rem' }}>
                        Peso {item.weight} • Destino ({item.destinationX}, {item.destinationY})
                      </div>
                    </div>
                    <div style={{ fontWeight: 600, color: '#0f5bd7' }}>{item.priority}</div>
                  </div>
                ))}
              </div>
            )}
          </article>

          <aside style={{ background: 'white', padding: '24px', borderRadius: '18px', boxShadow: '0 10px 30px rgba(16,35,61,0.08)' }}>
            <h2 style={{ marginTop: 0 }}>Atalhos</h2>
            <p style={{ color: '#58708d' }}>Use a página de entregas para cadastrar, editar e excluir registros.</p>
            <Link to="/entregas" style={{ display: 'inline-block', marginTop: '10px', padding: '10px 16px', borderRadius: '10px', background: '#10233d', color: 'white', textDecoration: 'none' }}>
              Abrir página de entregas
            </Link>
          </aside>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
