import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { getErrorMessage } from '../utils/errorMessage';

const statusColumns = [
  { value: 'AGUARDANDO_CONFIRMACAO', label: 'Aguardando confirmação' },
  { value: 'CONFIRMADA', label: 'Confirmada' },
  { value: 'EM_DESPACHO', label: 'Em despacho' },
  { value: 'ENTREGUE', label: 'Entregue' }
];

const PedidosPorEstado = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDeliveries = async () => {
      setLoading(true);
      try {
        const response = await api.get('/entregas/me');
        setDeliveries(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        setError(getErrorMessage(err, 'Nao foi possivel carregar os pedidos por estado.'));
      } finally {
        setLoading(false);
      }
    };

    loadDeliveries();
  }, []);

  const groupedDeliveries = useMemo(() => {
    return statusColumns.map((column) => ({
      ...column,
      items: deliveries.filter((delivery) => delivery.status === column.value)
    }));
  }, [deliveries]);

  return (
    <div style={{ minHeight: '100%', background: 'linear-gradient(180deg, #eef4ff 0%, #f8fafc 100%)', color: '#10233d' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0 }}>Pedidos por estado</h1>
            <p style={{ margin: '8px 0 0', color: '#58708d' }}>Cada coluna mostra os pedidos separados pelo status atual no sistema.</p>
          </div>
          <Link to="/dashboard" style={{ padding: '10px 16px', borderRadius: '10px', background: '#0f5bd7', color: 'white', textDecoration: 'none' }}>
            Voltar ao dashboard
          </Link>
        </div>

        {error && <div style={{ marginBottom: '16px', padding: '12px 14px', borderRadius: '10px', background: '#ffe3e3', color: '#9d1c1c' }}>{error}</div>}

        {loading ? (
          <div style={{ background: 'white', padding: '24px', borderRadius: '18px', boxShadow: '0 10px 30px rgba(16,35,61,0.08)' }}>Carregando...</div>
        ) : (
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(240px, 1fr))', gap: '16px', overflowX: 'auto', paddingBottom: '6px' }}>
            {groupedDeliveries.map((column) => (
              <article key={column.value} style={{ background: 'white', padding: '18px', borderRadius: '18px', boxShadow: '0 10px 30px rgba(16,35,61,0.08)', minHeight: '260px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
                  <h2 style={{ margin: 0, fontSize: '1.05rem' }}>{column.label}</h2>
                  <span style={{ color: '#58708d' }}>{column.items.length}</span>
                </div>
                <div style={{ display: 'grid', gap: '10px', marginTop: '14px' }}>
                  {column.items.length ? column.items.map((delivery) => (
                    <div key={delivery.id} style={{ padding: '12px', borderRadius: '12px', background: '#f7f9fc', borderLeft: '4px solid #0f5bd7' }}>
                      <div style={{ fontSize: '0.78rem', color: '#58708d', marginBottom: '4px' }}>Codigo do pedido</div>
                      <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem', wordBreak: 'break-all' }}>{delivery.codigo ?? '-'}</div>
                      <div style={{ marginTop: '8px', fontWeight: 700 }}>{delivery.recipientName}</div>
                      <div style={{ color: '#58708d', fontSize: '0.88rem' }}>Prioridade: {delivery.priority}</div>
                    </div>
                  )) : (
                    <span style={{ color: '#58708d' }}>Nenhum pedido neste estado.</span>
                  )}
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </div>
  );
};

export default PedidosPorEstado;
