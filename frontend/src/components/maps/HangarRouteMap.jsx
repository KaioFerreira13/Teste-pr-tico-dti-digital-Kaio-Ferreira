import React, { useEffect, useMemo, useRef, useState } from 'react';
import droneImage from '../../assets/drone.png';
import { listAlertAreas } from '../../services/alertService';
const routeColors = ['#e4572e', '#1d84b5', '#2f9c6a', '#e0a100', '#8f5cc2', '#d45087', '#008f95', '#7a8b25'];
const alertTypes = {
  INVIAVEL: { color: '#64748b', icon: 'bi-ban' },
  CONSTRUCAO: { color: '#eab308', icon: 'bi-buildings-fill' },
  INSEGURA: { color: '#dc2626', icon: 'bi-exclamation-triangle-fill' }
};
const safeSegment = (start, target, areas) => {
  if (!areas.length) return [start, target];
  const blocked = (x, y) => areas.some(area =>
    x >= Math.floor(area.minX) - 1 && x <= Math.ceil(area.maxX) + 1
    && y >= Math.floor(area.minY) - 1 && y <= Math.ceil(area.maxY) + 1);
  const xs = [start.x, target.x, ...areas.flatMap(area => [area.minX - 2, area.maxX + 2])];
  const ys = [start.y, target.y, ...areas.flatMap(area => [area.minY - 2, area.maxY + 2])];
  const margin = Math.max(8, Math.abs(start.x - target.x) + Math.abs(start.y - target.y));
  const limits = {
    minX: Math.floor(Math.min(...xs) - margin), maxX: Math.ceil(Math.max(...xs) + margin),
    minY: Math.floor(Math.min(...ys) - margin), maxY: Math.ceil(Math.max(...ys) + margin)
  };
  const key = (x, y) => `${x},${y}`;
  const queue = [{ x: start.x, y: start.y, cost: 0 }];
  const costs = new Map([[key(start.x, start.y), 0]]);
  const previous = new Map();
  while (queue.length) {
    queue.sort((a, b) =>
      a.cost + Math.abs(a.x - target.x) + Math.abs(a.y - target.y)
      - b.cost - Math.abs(b.x - target.x) - Math.abs(b.y - target.y));
    const current = queue.shift();
    if (current.x === target.x && current.y === target.y) {
      const path = [{ x: target.x, y: target.y }];
      let cursor = key(target.x, target.y);
      while (previous.has(cursor)) {
        const point = previous.get(cursor);
        path.push(point);
        cursor = key(point.x, point.y);
      }
      return path.reverse();
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = current.x + dx, y = current.y + dy;
      if (x < limits.minX || x > limits.maxX || y < limits.minY || y > limits.maxY) continue;
      if (blocked(x, y) && !(x === target.x && y === target.y)) continue;
      const nextCost = current.cost + 1;
      const nextKey = key(x, y);
      if (nextCost >= (costs.get(nextKey) ?? Infinity)) continue;
      costs.set(nextKey, nextCost);
      previous.set(nextKey, { x: current.x, y: current.y });
      queue.push({ x, y, cost: nextCost });
    }
  }
  return [start, target];
};
const safeRoute = (hangar, stops, areas) => {
  const origin = { x: hangar.positionX, y: hangar.positionY };
  const outbound = [origin];
  let current = origin;
  stops.forEach(stop => {
    const target = { x: stop.destinationX, y: stop.destinationY };
    outbound.push(...safeSegment(current, target, areas).slice(1));
    current = target;
  });
  const returning = safeSegment(current, origin, areas);
  return { outbound, returning, complete: [...outbound, ...returning.slice(1)] };
};
const getPointAtProgress = (points, progress) => {
  const segments = points.slice(1).map((point, index) => {
    const previous = points[index];
    return {
      from: previous,
      to: point,
      length: Math.hypot(point.x - previous.x, point.y - previous.y)
    };
  });
  const totalLength = segments.reduce((total, segment) => total + segment.length, 0);
  let remaining = Math.min(1, Math.max(0, progress)) * totalLength;
  for (const segment of segments) {
    if (remaining <= segment.length) {
      const segmentProgress = segment.length ? remaining / segment.length : 0;
      return {
        x: segment.from.x + (segment.to.x - segment.from.x) * segmentProgress,
        y: segment.from.y + (segment.to.y - segment.from.y) * segmentProgress
      };
    }
    remaining -= segment.length;
  }
  return points.at(-1);
};
const HangarRouteMap = ({
  hangar,
  drones,
  deliveries
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState(null);
  const [hiddenRoutes, setHiddenRoutes] = useState([]);
  const [hoveredMarker, setHoveredMarker] = useState(null);
  const [showReturnRoutes, setShowReturnRoutes] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStopId, setSelectedStopId] = useState(null);
  const [mobileMapOpen, setMobileMapOpen] = useState(false);
  const [alertAreas, setAlertAreas] = useState([]);
  const [animationTime, setAnimationTime] = useState(() => Date.now());
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
  useEffect(() => {
    if (!mobileMapOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = event => {
      if (event.key === 'Escape') setMobileMapOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMapOpen]);
  useEffect(() => {
    const interval = window.setInterval(() => setAnimationTime(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, []);
  useEffect(() => {
    listAlertAreas().then(setAlertAreas).catch(() => setAlertAreas([]));
  }, []);
  const routes = useMemo(() => drones.map((drone, index) => {
    const stops = (drone.routeDeliveryIds || []).map(id => deliveries.find(delivery => delivery.id === id)).filter(Boolean);
    const geometry = safeRoute(hangar, stops, alertAreas);
    return {
      drone,
      stops,
      ...geometry,
      color: routeColors[index % routeColors.length]
    };
  }).filter(route => route.stops.length > 0), [drones, deliveries, hangar, alertAreas]);
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
    alertAreas.forEach(area => {
      points.push({ x: area.minX, y: area.minY });
      points.push({ x: area.maxX, y: area.maxY });
    });
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
  }, [hangar, routes, alertAreas]);
  const viewWidth = bounds.width / zoom;
  const viewHeight = bounds.height / zoom;
  const defaultPan = {
    x: hangar.positionX - (bounds.x + bounds.width / 2),
    y: hangar.positionY - (bounds.y + bounds.height / 2)
  };
  const effectivePan = pan || defaultPan;
  const viewX = bounds.x + (bounds.width - viewWidth) / 2 + effectivePan.x;
  const viewY = bounds.y + (bounds.height - viewHeight) / 2 + effectivePan.y;
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
  const completeRoutePoints = stops => {
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
    const last = points[points.length - 1];
    points.push({
      x: hangar.positionX,
      y: last.y
    });
    points.push({
      x: hangar.positionX,
      y: hangar.positionY
    });
    return points;
  };
  const activeDrones = visibleRoutes.map(route => {
    const startedAt = new Date(route.drone.routeStartedAt).getTime();
    const completionAt = new Date(route.drone.routeEstimatedCompletionAt).getTime();
    const duration = completionAt - startedAt;
    const progress = duration > 0 ? (animationTime - startedAt) / duration : 0;
    return {
      ...route,
      position: getPointAtProgress(route.complete, progress)
    };
  }).filter(route => route.drone.status === 'EM_ROTA' && route.drone.routeStartedAt && route.drone.routeEstimatedCompletionAt);
  const changeZoom = factor => setZoom(current => Math.min(6, Math.max(1, current * factor)));
  const toggleRoute = droneId => {
    if (selectedStopInfo?.route.drone.id === droneId) {
      setSelectedStopId(null);
      setHoveredMarker(null);
    }
    setHiddenRoutes(current => current.includes(droneId) ? current.filter(id => id !== droneId) : [...current, droneId]);
  };
  const openDeliveryOnMobileMap = (route, stop) => {
    setHiddenRoutes(current => current.filter(id => id !== route.drone.id));
    setSelectedStopId(stop.id);
    setHoveredMarker(stop.id);
    setMobileMapOpen(true);
  };
  const openAllRoutesOnMobileMap = () => {
    setHiddenRoutes([]);
    setSelectedStopId(null);
    setHoveredMarker(null);
    setMobileMapOpen(true);
  };
  return <>
    <section className="mobile-route-cards [margin-top:18px] [padding:16px] [border-radius:18px] [background:white] [box-shadow:0_8px_24px_rgba(16,35,61,0.06)]">
      <div className="[display:flex] [align-items:center] [justify-content:space-between] [gap:12px]">
        <div>
          <h2 className="[margin:0]">Rotas de entrega</h2>
          <p className="[margin:5px_0_0] [color:#58708d] [font-size:0.85rem]">Toque em uma entrega para destacá-la no mapa.</p>
        </div>
        <button type="button" onClick={openAllRoutesOnMobileMap} className="[flex:0_0_auto] [padding:10px_13px] [border:0] [border-radius:9px] [background:#0f5bd7] [color:white] [font-weight:700] [cursor:pointer]">Exibir mapa</button>
      </div>
      <div className="[display:grid] [gap:9px] [margin-top:14px]">
        {destinationCards.map(({ route, stop, index }) => <button type="button" key={`mobile-${route.drone.id}-${stop.id}`} onClick={() => openDeliveryOnMobileMap(route, stop)} className="[padding:12px] [border:1px_solid_#d6deea] [border-radius:10px] [background:#f8fafc] [text-align:left] [cursor:pointer]">
          <div className="[display:flex] [align-items:center] [gap:7px]">
            <span style={{ background: route.color }} className="[width:10px] [height:10px] [flex:0_0_auto] [border-radius:50%]" />
            <strong>{index + 1}. {stop.recipientName}</strong>
            <i className="bi bi-map [margin-left:auto] [color:#0f5bd7]" />
          </div>
          <div className="[margin-top:6px] [color:#58708d] [font-size:0.85rem]">Drone: {route.drone.name}</div>
          <div className="[color:#58708d] [font-size:0.85rem]">Destino: ({stop.destinationX}, {stop.destinationY})</div>
        </button>)}
        {!destinationCards.length && <span className="[padding:12px] [color:#58708d]">Nenhuma rota planejada neste hangar.</span>}
      </div>
    </section>
    {mobileMapOpen && <button type="button" aria-label="Fechar mapa" onClick={() => setMobileMapOpen(false)} className="mobile-map-backdrop" />}
    <section role={mobileMapOpen ? 'dialog' : undefined} aria-modal={mobileMapOpen ? 'true' : undefined} aria-label={mobileMapOpen ? 'Mapa de rotas' : undefined} className={`route-map-panel ${mobileMapOpen ? 'route-map-panel--open' : ''} [margin-top:18px] [padding:20px] [border-radius:18px] [background:white] [box-shadow:0_8px_24px_rgba(16,35,61,0.06)]`}>
      <div className="[display:flex] [justify-content:space-between] [gap:12px] [align-items:center] [flex-wrap:wrap]">
        <div>
          <h2 className="[margin:0]">Mapa operacional</h2>
          <p className="[margin:5px_0_0] [color:#58708d] [font-size:0.9rem]">Arraste para navegar, use o zoom e clique na legenda para ocultar rotas.</p>
        </div>
        <div className="[display:flex] [gap:7px]">
          <button type="button" onClick={() => setMobileMapOpen(false)} className="mobile-map-close [padding:8px_12px] [border:0] [border-radius:8px] [background:#fee2e2] [color:#c53030] [font-weight:700] [cursor:pointer]"><i className="bi bi-x-lg" /> Fechar</button>
          <button onClick={() => changeZoom(1.35)} className="desktop-map-zoom [padding:8px_12px] [border:0] [border-radius:8px] [background:#10233d] [color:white] [cursor:pointer]">+</button>
          <button onClick={() => changeZoom(1 / 1.35)} className="desktop-map-zoom [padding:8px_12px] [border:0] [border-radius:8px] [background:#10233d] [color:white] [cursor:pointer]">−</button>
          <button onClick={() => {
          setZoom(1);
          setPan(null);
        }} className="[padding:8px_12px] [border:0] [border-radius:8px] [background:#edf2f7] [color:#10233d] [cursor:pointer]">Redefinir</button>
          <button onClick={() => setShowReturnRoutes(current => !current)} style={{
          background: showReturnRoutes ? '#dcfce7' : '#edf2f7',
          color: showReturnRoutes ? '#237a48' : '#58708d'
        }} className="[padding:8px_12px] [border:1px_solid_#d6deea] [border-radius:8px] [font-weight:700] [cursor:pointer]">{showReturnRoutes ? 'Ocultar retorno' : 'Exibir retorno'}</button>
        </div>
      </div>

      <div className="[display:grid] [grid-template-columns:repeat(2,_minmax(0,_1fr))] [gap:14px] [margin-top:14px]">
        <div ref={mapContainerRef} className="[width:100%] [height:auto] [aspect-ratio:1/1] [align-self:start] [overflow:hidden] [border-radius:14px] [border:1px_solid_#d6deea] [background:#eef3f1]">
          <svg viewBox={`${viewX} ${viewY} ${viewWidth} ${viewHeight}`} style={{
          cursor: drag.current ? 'grabbing' : 'grab'
        }} onPointerDown={event => {
          drag.current = {
            x: event.clientX,
            y: event.clientY,
            pan: effectivePan
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
        }} className="[display:block] [width:100%] [height:100%] [aspect-ratio:1/1] [touch-action:none]">
          <defs>
            <pattern id="street-grid" width={Math.max(bounds.width / 18, 2)} height={Math.max(bounds.height / 18, 2)} patternUnits="userSpaceOnUse">
              <path d={`M ${Math.max(bounds.width / 18, 2)} 0 L 0 0 0 ${Math.max(bounds.height / 18, 2)}`} fill="none" stroke="#cbd8d3" strokeWidth={markerSize * 0.12} />
            </pattern>
          </defs>
          <rect x={bounds.x - bounds.width} y={bounds.y - bounds.height} width={bounds.width * 3} height={bounds.height * 3} fill="url(#street-grid)" />
          {alertAreas.map(area => {
            const visual = alertTypes[area.type];
            return <g key={`alert-${area.id}`}>
              <rect x={area.minX} y={area.minY} width={area.maxX - area.minX} height={area.maxY - area.minY} fill={visual.color} fillOpacity="0.34" stroke={visual.color} strokeWidth={markerSize * 0.24} />
              <foreignObject pointerEvents="none" x={(area.minX + area.maxX) / 2 - markerSize * 1.8} y={(area.minY + area.maxY) / 2 - markerSize * 1.8} width={markerSize * 3.6} height={markerSize * 3.6}>
                <div xmlns="http://www.w3.org/1999/xhtml" style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: 'white', fontSize: `${markerSize * 2}px`, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.45))' }}><i className={`bi ${visual.icon}`} /></div>
              </foreignObject>
              <title>{area.description}</title>
            </g>;
          })}
          {visibleRoutes.map(route => <g key={`route-${route.drone.id}`}>
            <polyline points={route.outbound.map(point => `${point.x},${point.y}`).join(' ')} fill="none" stroke={route.color} strokeWidth={markerSize * 0.65} strokeLinejoin="round" strokeLinecap="round" opacity="0.95" />
            {showReturnRoutes && <polyline points={route.returning.map(point => `${point.x},${point.y}`).join(' ')} fill="none" stroke={route.color} strokeWidth={markerSize * 0.55} strokeDasharray={`${markerSize * 1.8} ${markerSize * 1.15}`} strokeLinejoin="round" strokeLinecap="round" opacity="0.9" />}
          </g>)}
          {visibleRoutes.map(route => <g key={`markers-${route.drone.id}`}>
            {route.stops.map((stop, index) => <g key={stop.id} onMouseEnter={() => setHoveredMarker(stop.id)} onMouseLeave={() => setHoveredMarker(null)} className="[cursor:pointer]">
              {selectedStopId === stop.id && <circle cx={stop.destinationX} cy={stop.destinationY} r={markerSize * 2.2} fill="#f6c453" opacity="0.55" />}
              <circle cx={stop.destinationX} cy={stop.destinationY} r={selectedStopId === stop.id ? markerSize * 1.45 : markerSize} fill={hoveredMarker === stop.id || selectedStopId === stop.id ? '#22a06b' : route.color} stroke="white" strokeWidth={markerSize * 0.3} />
              <title>{route.drone.name}: {stop.recipientName} ({stop.destinationX}, {stop.destinationY})</title>
            </g>)}
          </g>)}
          {activeDrones.map(route => {
            const imageSize = markerSize * 5.5;
            const naturalLabelWidth = Math.max(markerSize * 8, (route.drone.name.length + 1.5) * markerSize * 0.92);
            const labelWidth = Math.min(naturalLabelWidth, viewWidth * 0.72);
            const labelHeight = markerSize * 3;
            const labelX = Math.min(
              viewX + viewWidth - labelWidth / 2 - markerSize,
              Math.max(viewX + labelWidth / 2 + markerSize, route.position.x)
            );
            const preferredLabelY = route.position.y - imageSize * 1.05;
            const labelY = Math.min(
              viewY + viewHeight - labelHeight - markerSize,
              Math.max(viewY + markerSize, preferredLabelY)
            );
            return <g key={`active-drone-${route.drone.id}`} className="map-drone-marker" style={{ color: route.color }}>
              <rect x={labelX - labelWidth / 2} y={labelY} width={labelWidth} height={labelHeight} rx={markerSize * 0.8} fill="#10233d" stroke="white" strokeWidth={markerSize * 0.22} />
              <text x={labelX} y={labelY + labelHeight * 0.67} textAnchor="middle" fontSize={markerSize * 1.4} fontWeight="800" fill="white" lengthAdjust="spacingAndGlyphs" {...(naturalLabelWidth > labelWidth ? { textLength: labelWidth - markerSize * 2 } : {})}>{route.drone.name}</text>
              <circle cx={route.position.x} cy={route.position.y} r={imageSize * 0.58} fill="white" stroke={route.color} strokeWidth={markerSize * 0.3} opacity="0.96" />
              <image href={droneImage} x={route.position.x - imageSize / 2} y={route.position.y - imageSize / 2} width={imageSize} height={imageSize} preserveAspectRatio="xMidYMid meet" />
            </g>;
          })}
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
        <aside className="[min-height:0] [display:flex] [flex-direction:column] [overflow:hidden] [border-radius:14px] [border:1px_solid_#d6deea] [background:#f8fafc]">
          <div className="[padding:14px] [border-bottom:1px_solid_#d6deea]">
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar destinatário" className="[width:100%] [box-sizing:border-box] [padding:10px_12px] [border-radius:9px] [border:1px_solid_#cbd5e1] [background:white]" />
            {selectedStopInfo && <button onClick={() => {
            setSelectedStopId(null);
            setHoveredMarker(null);
          }} className="[width:100%] [margin-top:8px] [padding:8px] [border:0] [border-radius:8px] [background:#10233d] [color:white] [cursor:pointer]">Exibir todas as rotas</button>}
          </div>
          <div className="map-destination-grid [display:grid] [grid-template-columns:repeat(2,_minmax(0,_1fr))] [align-content:start] [gap:9px] [padding:12px] [overflow-y:auto]">
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
    </section>
  </>;
};
export default HangarRouteMap;
