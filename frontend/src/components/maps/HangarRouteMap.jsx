import React, { useEffect, useMemo, useRef, useState } from 'react';
const routeColors = ['#e4572e', '#1d84b5', '#2f9c6a', '#e0a100', '#8f5cc2', '#d45087', '#008f95', '#7a8b25'];
const HangarRouteMap = ({
  hangar,
  drones,
  deliveries
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({
    x: 0,
    y: 0
  });
  const [hiddenRoutes, setHiddenRoutes] = useState([]);
  const [hoveredMarker, setHoveredMarker] = useState(null);
  const [showReturnRoutes, setShowReturnRoutes] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStopId, setSelectedStopId] = useState(null);
  const drag = useRef(null);
  const mapContainerRef = useRef(null);
  useEffect(() => {
    const map = mapContainerRef.current;
    if (!map) return undefined;
    const handleWheel = event => {
      event.preventDefault();
      event.stopPropagation();
      const factor = event.deltaY < 0 ? 1.15 : 1 / 1.15;
      setZoom(current => Math.min(6, Math.max(1, current * factor)));
    };
    map.addEventListener('wheel', handleWheel, {
      passive: false,
      capture: true
    });
    return () => map.removeEventListener('wheel', handleWheel, {
      capture: true
    });
  }, []);
  const routes = useMemo(() => drones.map((drone, index) => {
    const stops = (drone.routeDeliveryIds || []).map(id => deliveries.find(delivery => delivery.id === id)).filter(Boolean);
    return {
      drone,
      stops,
      color: routeColors[index % routeColors.length]
    };
  }).filter(route => route.stops.length > 0), [drones, deliveries]);
  const hoveredStopInfo = useMemo(() => {
    for (const route of routes) {
      const index = route.stops.findIndex(stop => stop.id === hoveredMarker);
      if (index >= 0) return {
        route,
        stop: route.stops[index],
        index
      };
    }
    return null;
  }, [routes, hoveredMarker]);
  const selectedStopInfo = useMemo(() => {
    for (const route of routes) {
      const stop = route.stops.find(item => item.id === selectedStopId);
      if (stop) return {
        route,
        stop
      };
    }
    return null;
  }, [routes, selectedStopId]);
  const visibleRoutes = routes.filter(route => !hiddenRoutes.includes(route.drone.id) && (!selectedStopInfo || route.drone.id === selectedStopInfo.route.drone.id));
  const destinationCards = routes.flatMap(route => route.stops.map((stop, index) => ({
    route,
    stop,
    index
  }))).filter(({
    stop
  }) => stop.recipientName.toLowerCase().includes(search.trim().toLowerCase()));
  const bounds = useMemo(() => {
    const points = [{
      x: hangar.positionX,
      y: hangar.positionY
    }];
    routes.forEach(route => route.stops.forEach(stop => points.push({
      x: stop.destinationX,
      y: stop.destinationY
    })));
    const minX = Math.min(...points.map(point => point.x));
    const maxX = Math.max(...points.map(point => point.x));
    const minY = Math.min(...points.map(point => point.y));
    const maxY = Math.max(...points.map(point => point.y));
    const width = Math.max(maxX - minX, 20);
    const height = Math.max(maxY - minY, 20);
    const padding = Math.max(width, height) * 0.18;
    return {
      x: minX - padding,
      y: minY - padding,
      width: width + padding * 2,
      height: height + padding * 2
    };
  }, [hangar, routes]);
  const viewWidth = bounds.width / zoom;
  const viewHeight = bounds.height / zoom;
  const viewX = bounds.x + (bounds.width - viewWidth) / 2 + pan.x;
  const viewY = bounds.y + (bounds.height - viewHeight) / 2 + pan.y;
  const markerSize = Math.max(bounds.width, bounds.height) * 0.016 / zoom;
  const outboundRoutePoints = stops => {
    const points = [{
      x: hangar.positionX,
      y: hangar.positionY
    }];
    stops.forEach(stop => {
      const previous = points[points.length - 1];
      points.push({
        x: stop.destinationX,
        y: previous.y
      });
      points.push({
        x: stop.destinationX,
        y: stop.destinationY
      });
    });
    return points.map(point => `${point.x},${point.y}`).join(' ');
  };
  const returnRoutePoints = stops => {
    const lastStop = stops[stops.length - 1];
    if (!lastStop) return '';
    const points = [{
      x: lastStop.destinationX,
      y: lastStop.destinationY
    }];
    const previous = points[points.length - 1];
    points.push({
      x: hangar.positionX,
      y: previous.y
    });
    points.push({
      x: hangar.positionX,
      y: hangar.positionY
    });
    return points.map(point => `${point.x},${point.y}`).join(' ');
  };
  const changeZoom = factor => setZoom(current => Math.min(6, Math.max(1, current * factor)));
  const toggleRoute = droneId => {
    if (selectedStopInfo?.route.drone.id === droneId) {
      setSelectedStopId(null);
      setHoveredMarker(null);
    }
    setHiddenRoutes(current => current.includes(droneId) ? current.filter(id => id !== droneId) : [...current, droneId]);
  };
  return <section className="[margin-top:18px] [padding:20px] [border-radius:18px] [background:white] [box-shadow:0_8px_24px_rgba(16,35,61,0.06)]">
      <div className="[display:flex] [justify-content:space-between] [gap:12px] [align-items:center] [flex-wrap:wrap]">
        <div>
          <h2 className="[margin:0]">Mapa operacional</h2>
          <p className="[margin:5px_0_0] [color:#58708d] [font-size:0.9rem]">Arraste para navegar, use o zoom e clique na legenda para ocultar rotas.</p>
        </div>
        <div className="[display:flex] [gap:7px]">
          <button onClick={() => changeZoom(1.35)} className="[padding:8px_12px] [border:0] [border-radius:8px] [background:#10233d] [color:white] [cursor:pointer]">+</button>
          <button onClick={() => changeZoom(1 / 1.35)} className="[padding:8px_12px] [border:0] [border-radius:8px] [background:#10233d] [color:white] [cursor:pointer]">−</button>
          <button onClick={() => {
          setZoom(1);
          setPan({
            x: 0,
            y: 0
          });
        }} className="[padding:8px_12px] [border:0] [border-radius:8px] [background:#edf2f7] [color:#10233d] [cursor:pointer]">Redefinir</button>
          <button onClick={() => setShowReturnRoutes(current => !current)} style={{
          background: showReturnRoutes ? '#dcfce7' : '#edf2f7',
          color: showReturnRoutes ? '#237a48' : '#58708d'
        }} className="[padding:8px_12px] [border:1px_solid_#d6deea] [border-radius:8px] [font-weight:700] [cursor:pointer]">{showReturnRoutes ? 'Ocultar retorno' : 'Exibir retorno'}</button>
        </div>
      </div>

      <div className="[display:grid] [grid-template-columns:minmax(0,_1fr)_300px] [gap:14px] [margin-top:14px]">
        <div ref={mapContainerRef} className="[overflow:hidden] [border-radius:14px] [border:1px_solid_#d6deea] [background:#eef3f1]">
          <svg viewBox={`${viewX} ${viewY} ${viewWidth} ${viewHeight}`} style={{
          cursor: drag.current ? 'grabbing' : 'grab'
        }} onPointerDown={event => {
          drag.current = {
            x: event.clientX,
            y: event.clientY,
            pan
          };
          event.currentTarget.setPointerCapture(event.pointerId);
        }} onPointerMove={event => {
          if (!drag.current) return;
          const scaleX = viewWidth / event.currentTarget.clientWidth;
          const scaleY = viewHeight / event.currentTarget.clientHeight;
          setPan({
            x: drag.current.pan.x - (event.clientX - drag.current.x) * scaleX,
            y: drag.current.pan.y - (event.clientY - drag.current.y) * scaleY
          });
        }} onPointerUp={() => {
          drag.current = null;
        }} className="[display:block] [width:100%] [height:520px] [touch-action:none]">
          <defs>
            <pattern id="street-grid" width={Math.max(bounds.width / 18, 2)} height={Math.max(bounds.height / 18, 2)} patternUnits="userSpaceOnUse">
              <path d={`M ${Math.max(bounds.width / 18, 2)} 0 L 0 0 0 ${Math.max(bounds.height / 18, 2)}`} fill="none" stroke="#cbd8d3" strokeWidth={markerSize * 0.12} />
            </pattern>
          </defs>
          <rect x={bounds.x - bounds.width} y={bounds.y - bounds.height} width={bounds.width * 3} height={bounds.height * 3} fill="url(#street-grid)" />
          {visibleRoutes.map(route => <g key={`route-${route.drone.id}`}>
            <polyline points={outboundRoutePoints(route.stops)} fill="none" stroke={route.color} strokeWidth={markerSize * 0.65} strokeLinejoin="round" strokeLinecap="round" opacity="0.95" />
            {showReturnRoutes && <polyline points={returnRoutePoints(route.stops)} fill="none" stroke={route.color} strokeWidth={markerSize * 0.55} strokeDasharray={`${markerSize * 1.8} ${markerSize * 1.15}`} strokeLinejoin="round" strokeLinecap="round" opacity="0.9" />}
          </g>)}
          {visibleRoutes.map(route => <g key={`markers-${route.drone.id}`}>
            {route.stops.map((stop, index) => <g key={stop.id} onMouseEnter={() => setHoveredMarker(stop.id)} onMouseLeave={() => setHoveredMarker(null)} className="[cursor:pointer]">
              {selectedStopId === stop.id && <circle cx={stop.destinationX} cy={stop.destinationY} r={markerSize * 2.2} fill="#f6c453" opacity="0.55" />}
              <circle cx={stop.destinationX} cy={stop.destinationY} r={selectedStopId === stop.id ? markerSize * 1.45 : markerSize} fill={hoveredMarker === stop.id || selectedStopId === stop.id ? '#22a06b' : route.color} stroke="white" strokeWidth={markerSize * 0.3} />
              <title>{route.drone.name}: {stop.recipientName} ({stop.destinationX}, {stop.destinationY})</title>
            </g>)}
          </g>)}
          <g onMouseEnter={() => setHoveredMarker('hangar')} onMouseLeave={() => setHoveredMarker(null)} className="[cursor:pointer]">
            <rect x={hangar.positionX - markerSize * 1.2} y={hangar.positionY - markerSize * 1.2} width={markerSize * 2.4} height={markerSize * 2.4} rx={markerSize * 0.35} fill="#10233d" stroke="white" strokeWidth={markerSize * 0.35} />
            {hoveredMarker === 'hangar' && <>
              <rect x={hangar.positionX + markerSize * 1.2} y={hangar.positionY - markerSize * 3.4} width={Math.max((hangar.name.length + 4) * markerSize, markerSize * 10)} height={markerSize * 3} rx={markerSize * 0.5} fill="white" stroke="#10233d" strokeWidth={markerSize * 0.18} />
              <text x={hangar.positionX + markerSize * 1.8} y={hangar.positionY - markerSize * 1.45} fontSize={markerSize * 1.65} fontWeight="700" fill="#10233d">{hangar.name}</text>
            </>}
            <title>{hangar.name} ({hangar.positionX}, {hangar.positionY})</title>
          </g>
          {hoveredStopInfo && <>
            <rect pointerEvents="none" x={hoveredStopInfo.stop.destinationX + markerSize * 1.2} y={hoveredStopInfo.stop.destinationY - markerSize * 12.8} width={markerSize * 38} height={markerSize * 11.8} rx={markerSize * 0.7} fill="white" stroke={hoveredStopInfo.route.color} strokeWidth={markerSize * 0.2} />
            <text pointerEvents="none" x={hoveredStopInfo.stop.destinationX + markerSize * 2} y={hoveredStopInfo.stop.destinationY - markerSize * 10.4} fontSize={markerSize * 1.55} fill="#10233d">
              <tspan x={hoveredStopInfo.stop.destinationX + markerSize * 2} fontWeight="700">Drone: {hoveredStopInfo.route.drone.name}</tspan>
              <tspan x={hoveredStopInfo.stop.destinationX + markerSize * 2} dy={markerSize * 2.4} fontWeight="700">Destinatário: {hoveredStopInfo.stop.recipientName}</tspan>
              <tspan x={hoveredStopInfo.stop.destinationX + markerSize * 2} dy={markerSize * 2.4} fontWeight="700">Rota: </tspan>
              <tspan>Hangar → </tspan>
              {hoveredStopInfo.route.stops.map((routeStop, routeIndex) => <tspan key={routeStop.id} fill={routeStop.id === hoveredStopInfo.stop.id ? '#168a58' : '#40566f'} fontWeight={routeStop.id === hoveredStopInfo.stop.id ? '800' : '400'}>{routeIndex + 1}. {routeStop.recipientName}{routeIndex < hoveredStopInfo.route.stops.length - 1 ? ' → ' : ' → Hangar'}</tspan>)}
              <tspan x={hoveredStopInfo.stop.destinationX + markerSize * 2} dy={markerSize * 2.4} fontWeight="700">Distância: {hoveredStopInfo.route.drone.routeDistance || 0}</tspan>
            </text>
          </>}
          </svg>
        </div>
        <aside className="[height:520px] [display:flex] [flex-direction:column] [overflow:hidden] [border-radius:14px] [border:1px_solid_#d6deea] [background:#f8fafc]">
          <div className="[padding:14px] [border-bottom:1px_solid_#d6deea]">
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar destinatário" className="[width:100%] [box-sizing:border-box] [padding:10px_12px] [border-radius:9px] [border:1px_solid_#cbd5e1] [background:white]" />
            {selectedStopInfo && <button onClick={() => {
            setSelectedStopId(null);
            setHoveredMarker(null);
          }} className="[width:100%] [margin-top:8px] [padding:8px] [border:0] [border-radius:8px] [background:#10233d] [color:white] [cursor:pointer]">Exibir todas as rotas</button>}
          </div>
          <div className="[display:grid] [gap:9px] [padding:12px] [overflow-y:auto]">
            {destinationCards.map(({
            route,
            stop,
            index
          }) => <button key={`${route.drone.id}-${stop.id}`} onClick={() => {
            setHiddenRoutes(current => current.filter(id => id !== route.drone.id));
            setSelectedStopId(stop.id);
            setHoveredMarker(stop.id);
          }} style={{
            border: selectedStopId === stop.id ? `2px solid ${route.color}` : '1px solid #d6deea',
            background: selectedStopId === stop.id ? '#eef8f3' : 'white'
          }} className="[padding:12px] [border-radius:10px] [text-align:left] [cursor:pointer]">
              <div className="[display:flex] [align-items:center] [gap:7px]">
                <span style={{
                background: route.color
              }} className="[width:10px] [height:10px] [flex:0_0_auto] [border-radius:50%]" />
                <strong>{index + 1}. {stop.recipientName}</strong>
              </div>
              <div className="[margin-top:6px] [color:#58708d] [font-size:0.85rem]">Drone: {route.drone.name}</div>
              <div className="[color:#58708d] [font-size:0.85rem]">Destino: ({stop.destinationX}, {stop.destinationY})</div>
            </button>)}
            {!destinationCards.length && <span className="[padding:12px] [color:#58708d]">Nenhum destinatário encontrado.</span>}
          </div>
        </aside>
      </div>

      <div className="[display:flex] [gap:9px] [flex-wrap:wrap] [margin-top:12px]">
        {routes.map(route => <button key={route.drone.id} onClick={() => toggleRoute(route.drone.id)} style={{
        background: hiddenRoutes.includes(route.drone.id) ? '#edf2f7' : 'white',
        opacity: hiddenRoutes.includes(route.drone.id) ? 0.5 : 1
      }} className="[display:flex] [align-items:center] [gap:7px] [padding:8px_11px] [border-radius:999px] [border:1px_solid_#d6deea] [cursor:pointer]">
          <span style={{
          background: route.color
        }} className="[width:10px] [height:10px] [border-radius:50%]" />
          {route.drone.name}
        </button>)}
        {!routes.length && <span className="[color:#58708d]">Nenhum drone possui rota planejada neste hangar.</span>}
      </div>
    </section>;
};
export default HangarRouteMap;
