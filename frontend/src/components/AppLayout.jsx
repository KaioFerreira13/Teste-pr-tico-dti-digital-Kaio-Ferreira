import React, { useContext, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/modelos', label: 'Modelos' }
];

const submenuLinkStyle = ({ isActive }) => ({
  padding: '10px 14px',
  borderRadius: '12px',
  color: 'white',
  textDecoration: 'none',
  background: isActive ? 'rgba(15, 91, 215, 0.95)' : 'rgba(255,255,255,0.04)',
  border: isActive ? 'none' : '1px solid rgba(255,255,255,0.08)'
});

const DropdownButton = ({ label, open, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      padding: '12px 14px',
      borderRadius: '12px',
      color: 'white',
      textAlign: 'left',
      background: 'transparent',
      border: '1px solid rgba(255,255,255,0.08)',
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}
  >
    <span>{label}</span>
    <span style={{ opacity: 0.8 }}>{open ? 'v' : '>'}</span>
  </button>
);

const AppLayout = ({ children }) => {
  const { logout } = useContext(AuthContext);
  const [hangarsOpen, setHangarsOpen] = useState(true);
  const [dronesOpen, setDronesOpen] = useState(true);
  const [deliveriesOpen, setDeliveriesOpen] = useState(true);

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

            <div style={{ display: 'grid', gap: '8px' }}>
              <DropdownButton label="Hangares" open={hangarsOpen} onClick={() => setHangarsOpen((current) => !current)} />
              {hangarsOpen && (
                <div style={{ display: 'grid', gap: '8px', paddingLeft: '14px' }}>
                  <NavLink to="/hangars" end style={submenuLinkStyle}>Cadastrar hangares</NavLink>
                  <NavLink to="/hangars/gerenciar" style={submenuLinkStyle}>Gerenciar hangares</NavLink>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gap: '8px' }}>
              <DropdownButton label="Drones" open={dronesOpen} onClick={() => setDronesOpen((current) => !current)} />
              {dronesOpen && (
                <div style={{ display: 'grid', gap: '8px', paddingLeft: '14px' }}>
                  <NavLink to="/drones" end style={submenuLinkStyle}>Cadastrar drones</NavLink>
                  <NavLink to="/drones/gerenciar" style={submenuLinkStyle}>Gerenciar drones</NavLink>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gap: '8px' }}>
              <DropdownButton label="Entregas" open={deliveriesOpen} onClick={() => setDeliveriesOpen((current) => !current)} />
              {deliveriesOpen && (
                <div style={{ display: 'grid', gap: '8px', paddingLeft: '14px' }}>
                  <NavLink to="/entregas/cadastrar" style={submenuLinkStyle}>Cadastrar entregas</NavLink>
                  <NavLink to="/entregas/gerenciar" style={submenuLinkStyle}>Gerenciar entregas</NavLink>
                </div>
              )}
            </div>
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
