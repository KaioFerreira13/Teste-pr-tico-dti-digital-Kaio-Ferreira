import React, { useContext, useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { HangarContext } from '../context/HangarContext';
import api from '../services/api';

const menuItems = [
  { to: '/dashboard/geral', label: 'Geral', group: 'Dashboard' },
  { to: '/dashboard/pedidos', label: 'Pedidos', group: 'Dashboard' },
  { to: '/dashboard/drones', label: 'Drones', group: 'Dashboard' },
  { to: '/hangars/criar', label: 'Cadastrar hangares', group: 'Hangares' },
  { to: '/hangars/gerenciar', label: 'Gerenciar hangares', group: 'Hangares' },
  { to: '/drones/criar', label: 'Cadastrar drones', group: 'Drones' },
  { to: '/drones/gerenciar', label: 'Gerenciar drones', group: 'Drones' },
  { to: '/modelos', label: 'Modelos', group: 'Principal' },
  { to: '/entregas/cadastrar', label: 'Cadastrar entregas', group: 'Entregas' },
  { to: '/entregas/gerenciar', label: 'Gerenciar entregas', group: 'Entregas' }
];

const submenuLinkStyle = ({ isActive }) => ({
  padding: '10px 14px',
  borderRadius: '12px',
  color: 'white',
  textDecoration: 'none',
  background: isActive ? 'rgba(15, 91, 215, 0.95)' : 'rgba(255,255,255,0.04)',
  border: isActive ? 'none' : '1px solid rgba(255,255,255,0.08)'
});

const DropdownButton = ({ label, shortLabel, open, collapsed, onClick }) => (
  <button type="button" onClick={onClick} title={collapsed ? label : ''} style={{ padding: '12px 14px', borderRadius: '12px', color: 'white', textAlign: collapsed ? 'center' : 'left', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', display: 'flex', justifyContent: collapsed ? 'center' : 'space-between', alignItems: 'center' }}>
    <span>{collapsed ? shortLabel : label}</span>
    {!collapsed && <span style={{ opacity: 0.8 }}>{open ? 'v' : '>'}</span>}
  </button>
);

const AppLayout = ({ children }) => {
  const { logout } = useContext(AuthContext);
  const { selectedHangarId, setSelectedHangarId } = useContext(HangarContext);
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(true);
  const [hangarsOpen, setHangarsOpen] = useState(true);
  const [dronesOpen, setDronesOpen] = useState(true);
  const [deliveriesOpen, setDeliveriesOpen] = useState(true);
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [hangars, setHangars] = useState([]);

  useEffect(() => {
    api.get('/hangars/me')
      .then((response) => {
        const loadedHangars = Array.isArray(response.data) ? response.data : [];
        setHangars(loadedHangars);
        if (selectedHangarId && !loadedHangars.some((hangar) => hangar.id === selectedHangarId)) {
          setSelectedHangarId('');
        }
      })
      .catch(() => setHangars([]));
  }, []);

  const results = search.trim()
    ? menuItems.filter((item) => `${item.label} ${item.group}`.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 6)
    : [];

  const goTo = (path) => {
    navigate(path);
    setSearch('');
    setSearchOpen(false);
  };

  const mainLink = (to, label, shortLabel) => (
    <NavLink to={to} title={collapsed ? label : ''} style={({ isActive }) => ({ padding: '12px 14px', borderRadius: '12px', color: 'white', textAlign: collapsed ? 'center' : 'left', textDecoration: 'none', background: isActive ? 'rgba(15, 91, 215, 0.95)' : 'transparent', border: isActive ? 'none' : '1px solid rgba(255,255,255,0.08)' })}>
      {collapsed ? shortLabel : label}
    </NavLink>
  );

  const submenu = (items) => !collapsed && (
    <div style={{ display: 'grid', gap: '8px', paddingLeft: '14px' }}>
      {items.map((item) => <NavLink key={item.to} to={item.to} end={item.to === '/drones' || item.to === '/hangars'} style={submenuLinkStyle}>{item.label}</NavLink>)}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: `${collapsed ? 82 : 260}px minmax(0, 1fr)`, background: '#f4f7fb', transition: 'grid-template-columns 180ms ease' }}>
      <aside style={{ minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: collapsed ? '28px 12px' : '28px 18px', background: '#10233d', color: 'white', transition: 'padding 180ms ease' }}>
        <div>
          <div style={{ marginBottom: '28px', padding: '14px 10px', borderRadius: '14px', textAlign: collapsed ? 'center' : 'left', background: 'rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.82rem', letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.7 }}>{collapsed ? 'FD' : 'Fretes Drones'}</div>
            {!collapsed && <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>Painel operacional</div>}
          </div>

          <nav style={{ display: 'grid', gap: '8px' }}>
            <div style={{ display: 'grid', gap: '8px' }}>
              <DropdownButton label="Dashboard" shortLabel="DB" open={dashboardOpen} collapsed={collapsed} onClick={() => collapsed ? setCollapsed(false) : setDashboardOpen((current) => !current)} />
              {dashboardOpen && submenu(menuItems.filter((item) => item.group === 'Dashboard'))}
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <DropdownButton label="Hangares" shortLabel="H" open={hangarsOpen} collapsed={collapsed} onClick={() => collapsed ? setCollapsed(false) : setHangarsOpen((current) => !current)} />
              {hangarsOpen && submenu(menuItems.filter((item) => item.group === 'Hangares'))}
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <DropdownButton label="Drones" shortLabel="D" open={dronesOpen} collapsed={collapsed} onClick={() => collapsed ? setCollapsed(false) : setDronesOpen((current) => !current)} />
              {dronesOpen && submenu(menuItems.filter((item) => item.group === 'Drones'))}
            </div>
            {mainLink('/modelos', 'Modelos', 'M')}
            <div style={{ display: 'grid', gap: '8px' }}>
              <DropdownButton label="Entregas" shortLabel="E" open={deliveriesOpen} collapsed={collapsed} onClick={() => collapsed ? setCollapsed(false) : setDeliveriesOpen((current) => !current)} />
              {deliveriesOpen && submenu(menuItems.filter((item) => item.group === 'Entregas'))}
            </div>
          </nav>
        </div>

        <button onClick={logout} title="Logout" style={{ marginTop: '20px', padding: '12px 10px', border: 'none', borderRadius: '12px', background: '#d94646', color: 'white', cursor: 'pointer' }}>
          {collapsed ? 'Sair' : 'Logout'}
        </button>
      </aside>

      <div style={{ minWidth: 0 }}>
        <header style={{ position: 'sticky', top: 0, zIndex: 20, height: '72px', display: 'flex', alignItems: 'center', gap: '16px', padding: '0 28px', borderBottom: '1px solid #dce5ef', background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)' }}>
          <button onClick={() => setCollapsed((current) => !current)} title={collapsed ? 'Expandir menu' : 'Recolher menu'} style={{ width: '40px', height: '40px', border: 0, borderRadius: '10px', background: '#10233d', color: 'white', fontSize: '1.1rem', cursor: 'pointer' }}>{collapsed ? '>' : '<'}</button>
          <div style={{ position: 'relative', width: 'min(100%, 560px)' }}>
            <input
              value={search}
              onChange={(event) => { setSearch(event.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => window.setTimeout(() => setSearchOpen(false), 120)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && results[0]) goTo(results[0].to);
                if (event.key === 'Escape') setSearchOpen(false);
              }}
              placeholder="Pesquisar no menu..."
              aria-label="Pesquisar no menu"
              style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px', borderRadius: '11px', border: '1px solid #cfd9e5', background: '#f7f9fc', color: '#10233d' }}
            />
            {searchOpen && search.trim() && <div style={{ position: 'absolute', top: '48px', left: 0, right: 0, overflow: 'hidden', borderRadius: '12px', border: '1px solid #d6deea', background: 'white', boxShadow: '0 16px 36px rgba(16,35,61,0.16)' }}>
              {results.map((item) => <button key={item.to} onMouseDown={() => goTo(item.to)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '12px 14px', border: 0, borderBottom: '1px solid #edf2f7', background: 'white', color: '#10233d', textAlign: 'left', cursor: 'pointer' }}><strong>{item.label}</strong><span style={{ color: '#7b8da3' }}>{item.group}</span></button>)}
              {!results.length && <div style={{ padding: '14px', color: '#7b8da3' }}>Nenhuma opção encontrada.</div>}
            </div>}
          </div>
          <select value={selectedHangarId} onChange={(event) => setSelectedHangarId(event.target.value)} aria-label="Hangar selecionado" style={{ width: 'min(100%, 280px)', marginLeft: 'auto', padding: '11px 13px', borderRadius: '11px', border: '1px solid #cfd9e5', background: 'white', color: '#10233d', fontWeight: 600 }}>
            <option value="">Selecione um hangar</option>
            {hangars.map((hangar) => <option key={hangar.id} value={hangar.id}>{hangar.name}</option>)}
          </select>
        </header>
        <main style={{ overflow: 'auto', padding: '32px' }}>{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;
