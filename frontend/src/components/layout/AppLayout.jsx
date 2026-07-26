import React, { useContext, useEffect, useState } from 'react';
import { Button, Input } from '@heroui/react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { HangarContext } from '../../context/HangarContext';
import { listHangars } from '../../services/hangarService';

const menuGroups = [
  {
    label: 'Dashboard',
    icon: 'bi-grid-1x2',
    items: [
      { to: '/dashboard/geral', label: 'Geral', icon: 'bi-speedometer2' },
      { to: '/dashboard/pedidos', label: 'Pedidos', icon: 'bi-kanban' },
      { to: '/dashboard/drones', label: 'Drones', icon: 'bi-bar-chart' }
    ]
  },
  {
    label: 'Cidade',
    icon: 'bi-map',
    items: [
      { to: '/cidade/vizualizar', label: 'Visualizar cidade', icon: 'bi-geo-alt' },
      { to: '/cidade/alertas', label: 'Alertas', icon: 'bi-exclamation-triangle' }
    ]
  },
  {
    label: 'Hangares',
    icon: 'bi-buildings',
    items: [
      { to: '/hangars/criar', label: 'Cadastrar hangares', icon: 'bi-plus-square' },
      { to: '/hangars/gerenciar', label: 'Gerenciar hangares', icon: 'bi-map' }
    ]
  },
  {
    label: 'Drones',
    icon: 'bi-airplane-engines',
    items: [
      { to: '/drones/criar', label: 'Cadastrar drones', icon: 'bi-plus-circle' },
      { to: '/drones/gerenciar', label: 'Gerenciar drones', icon: 'bi-sliders' }
    ]
  },
  {
    label: 'Entregas',
    icon: 'bi-box-seam',
    items: [
      { to: '/entregas/cadastrar', label: 'Cadastrar entregas', icon: 'bi-box-arrow-in-down' },
      { to: '/entregas/gerenciar', label: 'Gerenciar entregas', icon: 'bi-truck' }
    ]
  }
];

const searchableItems = [
  ...menuGroups.flatMap((group) => group.items.map((item) => ({ ...item, group: group.label }))),
  { to: '/modelos', label: 'Modelos', group: 'Principal', icon: 'bi-cpu' }
];

const AppLayout = ({ children }) => {
  const { logout } = useContext(AuthContext);
  const { selectedHangarId, setSelectedHangarId } = useContext(HangarContext);
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState(() => Object.fromEntries(menuGroups.map((group) => [group.label, true])));
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [hangars, setHangars] = useState([]);

  useEffect(() => {
    listHangars()
      .then((loadedHangars) => {
        setHangars(loadedHangars);
        if (selectedHangarId && !loadedHangars.some((hangar) => hangar.id === selectedHangarId)) {
          setSelectedHangarId('');
        }
      })
      .catch(() => setHangars([]));
  }, []);

  const results = search.trim()
    ? searchableItems.filter((item) => `${item.label} ${item.group}`.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 6)
    : [];

  const goTo = (path) => {
    navigate(path);
    setSearch('');
    setSearchOpen(false);
    setMobileMenuOpen(false);
  };

  const toggleGroup = (label) => {
    if (collapsed) {
      setCollapsed(false);
      setOpenGroups((current) => ({ ...current, [label]: true }));
      return;
    }
    setOpenGroups((current) => ({ ...current, [label]: !current[label] }));
  };

  return (
    <div className={`grid min-h-screen bg-mist transition-[grid-template-columns] duration-200 max-sm:block ${collapsed ? 'grid-cols-[82px_minmax(0,1fr)]' : 'grid-cols-[260px_minmax(0,1fr)] max-lg:grid-cols-[82px_minmax(0,1fr)]'}`}>
      {mobileMenuOpen && <button type="button" aria-label="Fechar menu" onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 z-40 hidden bg-slate-950/55 backdrop-blur-[2px] max-sm:block" />}
      <aside className={`sticky top-0 z-50 flex h-screen min-w-0 flex-col justify-between overflow-y-auto bg-ink text-white shadow-xl shadow-blue-950/10 transition-all max-sm:fixed max-sm:left-0 max-sm:top-0 max-sm:w-[min(86vw,300px)] max-sm:px-4 max-sm:py-5 max-sm:duration-300 ${mobileMenuOpen ? 'max-sm:translate-x-0' : 'max-sm:-translate-x-full'} ${collapsed ? 'px-3 py-6' : 'px-4 py-6 max-lg:px-3'}`}>
        <div>
            <div className={`mb-7 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/8 p-3 max-sm:justify-start ${collapsed ? 'justify-center' : 'max-lg:justify-center'}`}>
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-ocean text-lg shadow-lg shadow-blue-500/30"><i className="bi bi-airplane-engines" /></div>
            <div className="min-w-0 max-lg:hidden max-sm:block"><div className="truncate text-sm font-extrabold">Fretes Drones</div><div className="text-xs text-blue-200/70">Centro operacional</div></div>
            <button type="button" aria-label="Fechar menu" onClick={() => setMobileMenuOpen(false)} className="ml-auto hidden size-9 place-items-center rounded-lg text-white/80 hover:bg-white/10 max-sm:grid"><i className="bi bi-x-lg" /></button>
          </div>

          <nav className="grid gap-2">
            {menuGroups.slice(0, 3).map((group) => (
              <div className="grid gap-1.5" key={group.label}>
                <button type="button" onClick={() => toggleGroup(group.label)} title={collapsed ? group.label : ''} className={`flex h-11 items-center rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm font-semibold text-white/90 hover:bg-white/10 max-sm:justify-between ${collapsed ? 'justify-center' : 'justify-between max-lg:justify-center'}`}>
                  <span className="flex items-center gap-3"><i className={`bi ${group.icon} text-base text-blue-300`} /><span className={`${collapsed ? 'hidden' : 'max-lg:hidden'} max-sm:inline`}>{group.label}</span></span>
                  <i className={`bi bi-chevron-${openGroups[group.label] ? 'down' : 'right'} text-xs max-lg:hidden max-sm:inline`} />
                </button>
                {openGroups[group.label] && <div className="grid gap-1 pl-3 max-lg:hidden max-sm:grid">
                  {group.items.map((item) => <NavLink key={item.to} to={item.to} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition ${isActive ? 'bg-ocean font-bold text-white shadow-lg shadow-blue-950/20' : 'text-blue-100/75 hover:bg-white/8 hover:text-white'}`}><i className={`bi ${item.icon}`} />{item.label}</NavLink>)}
                </div>}
              </div>
            ))}

            <NavLink to="/modelos" onClick={() => setMobileMenuOpen(false)} title={collapsed ? 'Modelos' : ''} className={({ isActive }) => `flex h-11 items-center gap-3 rounded-xl border px-3 text-sm font-semibold transition max-sm:justify-start ${collapsed ? 'justify-center' : 'max-lg:justify-center'} ${isActive ? 'border-ocean bg-ocean text-white' : 'border-white/10 text-white/90 hover:bg-white/10'}`}>
              <i className="bi bi-cpu text-base text-blue-300" /><span className={`${collapsed ? 'hidden' : 'max-lg:hidden'} max-sm:inline`}>Modelos</span>
            </NavLink>

            {menuGroups.slice(3).map((group) => (
              <div className="grid gap-1.5" key={group.label}>
                <button type="button" onClick={() => toggleGroup(group.label)} title={collapsed ? group.label : ''} className={`flex h-11 items-center rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm font-semibold text-white/90 hover:bg-white/10 max-sm:justify-between ${collapsed ? 'justify-center' : 'justify-between max-lg:justify-center'}`}>
                  <span className="flex items-center gap-3"><i className={`bi ${group.icon} text-base text-blue-300`} /><span className={`${collapsed ? 'hidden' : 'max-lg:hidden'} max-sm:inline`}>{group.label}</span></span>
                  <i className={`bi bi-chevron-${openGroups[group.label] ? 'down' : 'right'} text-xs max-lg:hidden max-sm:inline`} />
                </button>
                {openGroups[group.label] && <div className="grid gap-1 pl-3 max-lg:hidden max-sm:grid">
                  {group.items.map((item) => <NavLink key={item.to} to={item.to} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition ${isActive ? 'bg-ocean font-bold text-white' : 'text-blue-100/75 hover:bg-white/8 hover:text-white'}`}><i className={`bi ${item.icon}`} />{item.label}</NavLink>)}
                </div>}
              </div>
            ))}
          </nav>
        </div>

          <Button onPress={logout} variant="danger" isIconOnly={collapsed && !mobileMenuOpen} className="bg-red-500 text-white max-lg:min-w-10 max-sm:w-full" aria-label="Sair">
          <i className="bi bi-box-arrow-left" /><span className="max-lg:hidden max-sm:inline">Sair</span>
        </Button>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex min-h-[76px] items-center gap-3 border-b border-slate-200/80 bg-white/90 px-5 backdrop-blur-xl max-sm:flex-wrap max-sm:px-4 max-sm:py-3 md:px-7">
          <Button isIconOnly variant="secondary" onPress={() => setMobileMenuOpen(true)} aria-label="Abrir menu" className="hidden shrink-0 bg-ink text-white max-sm:flex">
            <i className="bi bi-list text-xl" />
          </Button>
          <Button isIconOnly variant="secondary" onPress={() => setCollapsed((current) => !current)} aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'} className="shrink-0 bg-ink text-white max-lg:hidden">
            <i className={`bi bi-layout-sidebar${collapsed ? '-inset' : ''}`} />
          </Button>
          <div className="relative w-full max-w-xl max-sm:w-[calc(100%-56px)] max-sm:flex-1">
            <Input value={search} onChange={(event) => { setSearch(event.target.value); setSearchOpen(true); }} onFocus={() => setSearchOpen(true)} onBlur={() => window.setTimeout(() => setSearchOpen(false), 120)} onKeyDown={(event) => { if (event.key === 'Enter' && results[0]) goTo(results[0].to); if (event.key === 'Escape') setSearchOpen(false); }} placeholder="Pesquisar no menu..." aria-label="Pesquisar no menu" className="w-full bg-slate-50" />
            <i className="bi bi-search pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            {searchOpen && search.trim() && <div className="absolute left-0 right-0 top-12 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-2xl shadow-blue-950/15">
              {results.map((item) => <button key={item.to} onMouseDown={() => goTo(item.to)} className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left text-sm text-ink hover:bg-blue-50"><span className="flex items-center gap-2 font-bold"><i className={`bi ${item.icon} text-ocean`} />{item.label}</span><span className="text-xs text-slate-400">{item.group}</span></button>)}
              {!results.length && <div className="px-4 py-3 text-sm text-slate-400">Nenhuma opcao encontrada.</div>}
            </div>}
          </div>
          <div className="relative ml-auto min-w-[180px] max-w-[280px] flex-1 max-sm:order-3 max-sm:max-w-none max-sm:basis-full">
            <i className="bi bi-buildings pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-ocean" />
            <select value={selectedHangarId} onChange={(event) => setSelectedHangarId(event.target.value)} aria-label="Hangar selecionado" className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-sm font-bold text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-blue-100">
              <option value="">Selecione um hangar</option>
              {hangars.map((hangar) => <option key={hangar.id} value={hangar.id}>{hangar.name}</option>)}
            </select>
            <i className="bi bi-chevron-down pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
          </div>
        </header>
        <main className="overflow-x-hidden p-4 max-sm:px-3 max-sm:py-5 md:p-8">{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;
