import React from 'react';
import { Link } from 'react-router-dom';

const mockStats = [
  { label: 'Entregas hoje', value: '18' },
  { label: 'Drones em voo', value: '7' },
  { label: 'Hangares ativos', value: '4' }
];

const mockRecent = [
  { title: 'Rota Centro -> Norte', status: 'Em andamento', time: 'há 12 min' },
  { title: 'Reabastecimento Hangar B', status: 'Pendente', time: 'há 35 min' },
  { title: 'Entrega urgente Bairro Sul', status: 'Concluída', time: 'há 1 h' }
];

const Dashboard = () => {
  return (
    <div style={{ minHeight: '100%', background: 'linear-gradient(180deg, #eef4ff 0%, #f8fafc 100%)', color: '#10233d' }}>
      <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0 }}>Dashboard</h1>
            <p style={{ margin: '8px 0 0', color: '#58708d' }}>Visão geral operacional com dados simulados.</p>
          </div>
          <Link to="/hangars" style={{ padding: '10px 16px', borderRadius: '10px', background: '#0f5bd7', color: 'white', textDecoration: 'none' }}>
            Meus hangares
          </Link>
        </div>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {mockStats.map((item) => (
            <article key={item.label} style={{ background: 'white', padding: '22px', borderRadius: '18px', boxShadow: '0 10px 30px rgba(16,35,61,0.08)' }}>
              <div style={{ color: '#58708d', marginBottom: '10px' }}>{item.label}</div>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>{item.value}</div>
            </article>
          ))}
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>
          <article style={{ background: 'white', padding: '24px', borderRadius: '18px', boxShadow: '0 10px 30px rgba(16,35,61,0.08)' }}>
            <h2 style={{ marginTop: 0 }}>Atividades recentes</h2>
            <div style={{ display: 'grid', gap: '14px' }}>
              {mockRecent.map((item) => (
                <div key={item.title} style={{ padding: '14px 16px', borderRadius: '12px', background: '#f7f9fc', display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.title}</div>
                    <div style={{ color: '#58708d', fontSize: '0.92rem' }}>{item.time}</div>
                  </div>
                  <div style={{ fontWeight: 600, color: '#0f5bd7' }}>{item.status}</div>
                </div>
              ))}
            </div>
          </article>

          <aside style={{ background: 'white', padding: '24px', borderRadius: '18px', boxShadow: '0 10px 30px rgba(16,35,61,0.08)' }}>
            <h2 style={{ marginTop: 0 }}>Atalhos</h2>
            <p style={{ color: '#58708d' }}>A gestão real dos hangares fica separada para manter a navegação mais clara.</p>
            <Link to="/hangars" style={{ display: 'inline-block', marginTop: '10px', padding: '10px 16px', borderRadius: '10px', background: '#10233d', color: 'white', textDecoration: 'none' }}>
              Abrir página de hangares
            </Link>
          </aside>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
