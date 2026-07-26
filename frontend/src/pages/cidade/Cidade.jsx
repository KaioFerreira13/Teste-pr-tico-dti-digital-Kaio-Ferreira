import React, { useEffect, useMemo, useRef, useState } from 'react';
import { listHangars } from '../../services/hangarService';
import { getErrorMessage } from '../../utils/errorMessage';
import { listAlertAreas } from '../../services/alertService';

const alertTypes = {
  INVIAVEL: { color: '#64748b', icon: 'bi-ban' },
  CONSTRUCAO: { color: '#eab308', icon: 'bi-buildings-fill' },
  INSEGURA: { color: '#dc2626', icon: 'bi-exclamation-triangle-fill' }
};

const Cidade = () => {
  const [hangars, setHangars] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef(null);

  useEffect(() => {
    Promise.all([listHangars(), listAlertAreas()])
      .then(([loadedHangars, loadedAreas]) => {
        setHangars(loadedHangars);
        setAreas(loadedAreas);
      })
      .catch(err => setError(getErrorMessage(err, 'Não foi possível carregar a cidade.')))
      .finally(() => setLoading(false));
  }, []);

  const bounds = useMemo(() => {
    if (!hangars.length && !areas.length) return { x: -50, y: -50, width: 100, height: 100 };
    const xValues = [...hangars.map(hangar => hangar.positionX), ...areas.flatMap(area => [area.minX, area.maxX])];
    const yValues = [...hangars.map(hangar => hangar.positionY), ...areas.flatMap(area => [area.minY, area.maxY])];
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);
    const size = Math.max(maxX - minX, maxY - minY, 20);
    const padding = size * 0.24;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    return {
      x: centerX - size / 2 - padding,
      y: centerY - size / 2 - padding,
      width: size + padding * 2,
      height: size + padding * 2
    };
  }, [hangars, areas]);

  const viewWidth = bounds.width / zoom;
  const viewHeight = bounds.height / zoom;
  const viewX = bounds.x + (bounds.width - viewWidth) / 2 + pan.x;
  const viewY = bounds.y + (bounds.height - viewHeight) / 2 + pan.y;
  const markerSize = bounds.width * 0.018 / zoom;
  const resetMap = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return <div className="page-shell">
    <header className="[margin-bottom:20px] [padding:24px] [border-radius:20px] [background:white] [box-shadow:0_10px_30px_rgba(16,35,61,0.08)]">
      <h1 className="[margin:0]">Cidade</h1>
      <p className="[margin:8px_0_0] [color:#58708d]">Visualize a distribuição de todos os hangares cadastrados.</p>
      {error && <p className="[margin-bottom:0] [color:#c53030]">{error}</p>}
    </header>

    <section className="[padding:20px] [border-radius:18px] [background:white] [box-shadow:0_8px_24px_rgba(16,35,61,0.06)]">
      <div className="[display:flex] [align-items:center] [justify-content:space-between] [gap:12px] [flex-wrap:wrap]">
        <div>
          <h2 className="[margin:0]">Mapa de hangares</h2>
          <p className="[margin:5px_0_0] [color:#58708d] [font-size:0.9rem]">{loading ? 'Carregando...' : `${hangars.length} hangar(es) na cidade`}</p>
        </div>
        <div className="[display:flex] [gap:7px]">
          <button type="button" onClick={() => setZoom(current => Math.min(6, current * 1.35))} className="[padding:8px_12px] [border:0] [border-radius:8px] [background:#10233d] [color:white] [cursor:pointer]">+</button>
          <button type="button" onClick={() => setZoom(current => Math.max(1, current / 1.35))} className="[padding:8px_12px] [border:0] [border-radius:8px] [background:#10233d] [color:white] [cursor:pointer]">−</button>
          <button type="button" onClick={resetMap} className="[padding:8px_12px] [border:0] [border-radius:8px] [background:#edf2f7] [color:#10233d] [cursor:pointer]">Redefinir</button>
        </div>
      </div>

      <div className="[width:min(100%,_780px)] [margin:16px_auto_0] [aspect-ratio:1/1] [overflow:hidden] [border:1px_solid_#d6deea] [border-radius:14px] [background:#eef3f1]">
        <svg viewBox={`${viewX} ${viewY} ${viewWidth} ${viewHeight}`} className="city-map [display:block] [width:100%] [height:100%] [touch-action:none]" onPointerDown={event => {
          drag.current = { x: event.clientX, y: event.clientY, pan };
          event.currentTarget.setPointerCapture(event.pointerId);
        }} onPointerMove={event => {
          if (!drag.current) return;
          setPan({
            x: drag.current.pan.x - (event.clientX - drag.current.x) * viewWidth / event.currentTarget.clientWidth,
            y: drag.current.pan.y - (event.clientY - drag.current.y) * viewHeight / event.currentTarget.clientHeight
          });
        }} onPointerUp={() => { drag.current = null; }}>
          <defs>
            <pattern id="city-grid" width={Math.max(bounds.width / 18, 2)} height={Math.max(bounds.height / 18, 2)} patternUnits="userSpaceOnUse">
              <path d={`M ${Math.max(bounds.width / 18, 2)} 0 L 0 0 0 ${Math.max(bounds.height / 18, 2)}`} fill="none" stroke="#cbd8d3" strokeWidth={markerSize * 0.12} />
            </pattern>
          </defs>
          <rect x={bounds.x - bounds.width} y={bounds.y - bounds.height} width={bounds.width * 3} height={bounds.height * 3} fill="url(#city-grid)" />
          {areas.map(area => {
            const visual = alertTypes[area.type];
            return <g key={area.id}>
              <rect x={area.minX} y={area.minY} width={area.maxX - area.minX} height={area.maxY - area.minY} fill={visual.color} fillOpacity="0.4" stroke={visual.color} strokeWidth={markerSize * 0.25} />
              <foreignObject pointerEvents="none" x={(area.minX + area.maxX) / 2 - markerSize * 2} y={(area.minY + area.maxY) / 2 - markerSize * 2} width={markerSize * 4} height={markerSize * 4}>
                <div xmlns="http://www.w3.org/1999/xhtml" style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: 'white', fontSize: `${markerSize * 2.2}px`, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.45))' }}><i className={`bi ${visual.icon}`} /></div>
              </foreignObject>
              <title>{area.description}</title>
            </g>;
          })}
          {hangars.map(hangar => {
            const labelWidth = Math.max(markerSize * 11, (hangar.name.length + 2) * markerSize);
            return <g key={hangar.id}>
              <rect x={hangar.positionX - markerSize * 1.4} y={hangar.positionY - markerSize * 1.4} width={markerSize * 2.8} height={markerSize * 2.8} rx={markerSize * 0.4} fill="#10233d" stroke="white" strokeWidth={markerSize * 0.3} />
              <circle cx={hangar.positionX} cy={hangar.positionY} r={markerSize * 0.42} fill="#60a5fa" />
              <rect x={hangar.positionX - labelWidth / 2} y={hangar.positionY - markerSize * 5.4} width={labelWidth} height={markerSize * 2.5} rx={markerSize * 0.65} fill="white" stroke="#0f5bd7" strokeWidth={markerSize * 0.18} />
              <text x={hangar.positionX} y={hangar.positionY - markerSize * 3.75} textAnchor="middle" fontSize={markerSize * 1.35} fontWeight="800" fill="#10233d">{hangar.name}</text>
              <title>{hangar.name} ({hangar.positionX}, {hangar.positionY})</title>
            </g>;
          })}
        </svg>
      </div>
      {!loading && !hangars.length && <p className="[text-align:center] [color:#58708d]">Nenhum hangar cadastrado para exibir.</p>}
    </section>
  </div>;
};

export default Cidade;
