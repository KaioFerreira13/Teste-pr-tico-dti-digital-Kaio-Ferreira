import React from 'react';
import { NavLink } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/hangars', label: 'Hangares' },
  { to: '/drones', label: 'Drones' },
  { to: '/modelos', label: 'Modelos' },
  { to: '/entregas', label: 'Entregas' }
];

const AppLayout = ({ children }) => {
  const { logout } = useContext(AuthContext);

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '260px 1fr', background: '#f4f7fb' }}>
      <aside style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '28px 18px', background: '#10233d', color: 'white' }}>
        <div>
          <div style={{ marginBottom: '28px', padding: '14px 16px', borderRadius: '14px', background: 'rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.82rem', letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.7 }}>Fretes Drones</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>Painel operacional</div>
          </div>

          <nav style={{ display: 'grid', gap: '8px' }}>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                style={({ isActive }) => ({
                  padding: '12px 14px',
                  borderRadius: '12px',
                  color: 'white',
                  textDecoration: 'none',
                  background: isActive ? 'rgba(15, 91, 215, 0.95)' : 'transparent',
                  border: isActive ? 'none' : '1px solid rgba(255,255,255,0.08)'
                })}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <button
          onClick={logout}
          style={{ marginTop: '20px', padding: '12px 14px', border: 'none', borderRadius: '12px', background: '#d94646', color: 'white', cursor: 'pointer' }}
        >
          Logout
        </button>
      </aside>

      <main style={{ overflow: 'auto', padding: '32px' }}>{children}</main>
    </div>
  );
};

export default AppLayout;
