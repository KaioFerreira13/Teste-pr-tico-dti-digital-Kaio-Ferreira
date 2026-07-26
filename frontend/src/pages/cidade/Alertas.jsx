import React, { useEffect, useMemo, useRef, useState } from 'react';
import { listHangars } from '../../services/hangarService';
import { deleteAlertArea, listAlertAreas, saveAlertArea } from '../../services/alertService';
import { getErrorMessage } from '../../utils/errorMessage';

const types = {
  INVIAVEL: { label: 'Área inviável', color: '#64748b', icon: 'bi-ban' },
  CONSTRUCAO: { label: 'Construção', color: '#eab308', icon: 'bi-buildings-fill' },
  INSEGURA: { label: 'Área insegura', color: '#dc2626', icon: 'bi-exclamation-triangle-fill' }
};

const Alertas = () => {
  const [hangars, setHangars] = useState([]);
  const [areas, setAreas] = useState([]);
  const [draft, setDraft] = useState(null);
  const [selected, setSelected] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [type, setType] = useState('INVIAVEL');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [cursorPoint, setCursorPoint] = useState(null);
  const drawing = useRef(null);
  const resizing = useRef(null);
  const panning = useRef(null);
  const svgRef = useRef(null);

  useEffect(() => {
    Promise.all([listHangars(), listAlertAreas()])
      .then(([loadedHangars, loadedAreas]) => {
        setHangars(loadedHangars);
        setAreas(loadedAreas);
      })
      .catch(err => setError(getErrorMessage(err, 'Não foi possível carregar o editor de alertas.')));
  }, []);

  const bounds = useMemo(() => {
    const xs = [...hangars.map(item => item.positionX), ...areas.flatMap(item => [item.minX, item.maxX])];
    const ys = [...hangars.map(item => item.positionY), ...areas.flatMap(item => [item.minY, item.maxY])];
    if (!xs.length) return { x: -50, y: -50, width: 100, height: 100 };
    const minX = Math.min(...xs); const maxX = Math.max(...xs);
    const minY = Math.min(...ys); const maxY = Math.max(...ys);
    const size = Math.max(maxX - minX, maxY - minY, 30);
    const padding = size * 0.25;
    return {
      x: (minX + maxX) / 2 - size / 2 - padding,
      y: (minY + maxY) / 2 - size / 2 - padding,
      width: size + padding * 2,
      height: size + padding * 2
    };
  }, [hangars, areas]);

  const viewWidth = bounds.width / zoom;
  const viewHeight = bounds.height / zoom;
  const viewX = bounds.x + (bounds.width - viewWidth) / 2 + pan.x;
  const viewY = bounds.y + (bounds.height - viewHeight) / 2 + pan.y;
  const pointFromEvent = event => {
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: viewX + (event.clientX - rect.left) / rect.width * viewWidth,
      y: viewY + (event.clientY - rect.top) / rect.height * viewHeight
    };
  };
  const normalized = area => ({
    minX: Math.min(area.start.x, area.end.x),
    minY: Math.min(area.start.y, area.end.y),
    maxX: Math.max(area.start.x, area.end.x),
    maxY: Math.max(area.start.y, area.end.y)
  });
  const setDraftCoordinates = coordinates => setDraft({
    start: { x: Number(coordinates.minX), y: Number(coordinates.minY) },
    end: { x: Number(coordinates.maxX), y: Number(coordinates.maxY) }
  });
  const changeDraftCoordinate = (field, value) => {
    if (!draft || value === '' || !Number.isFinite(Number(value))) return;
    setDraftCoordinates({ ...normalized(draft), [field]: Math.round(Number(value)) });
  };
  const cancel = () => {
    setDraft(null);
    setSelected(null);
    setEditingId(null);
    setType('INVIAVEL');
    setDescription('');
  };
  const edit = () => {
    setEditingId(selected.id);
    setType(selected.type);
    setDescription(selected.description || '');
    setDraft({
      start: { x: selected.minX, y: selected.minY },
      end: { x: selected.maxX, y: selected.maxY }
    });
    setSelected(null);
  };
  const save = async () => {
    if (!draft) return;
    const coordinates = Object.fromEntries(
      Object.entries(normalized(draft)).map(([key, value]) => [key, Math.round(value)])
    );
    if (coordinates.maxX - coordinates.minX < 0.5 || coordinates.maxY - coordinates.minY < 0.5) {
      setError('Selecione uma área maior no mapa.');
      return;
    }
    if (!description.trim()) {
      setError('Informe uma descrição para a área.');
      return;
    }
    const containsHangar = hangars.some(hangar =>
      hangar.positionX >= coordinates.minX && hangar.positionX <= coordinates.maxX
      && hangar.positionY >= coordinates.minY && hangar.positionY <= coordinates.maxY);
    if (containsHangar) {
      setError('A área selecionada não pode conter um hangar.');
      return;
    }
    const overlapsArea = areas
      .filter(area => area.id !== editingId)
      .some(area =>
        coordinates.minX < area.maxX && coordinates.maxX > area.minX
        && coordinates.minY < area.maxY && coordinates.maxY > area.minY);
    if (overlapsArea) {
      setError('A área selecionada não pode sobrepor outra área cadastrada.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const saved = await saveAlertArea(editingId, { ...coordinates, type, description: description.trim() });
      setAreas(current => editingId
        ? current.map(area => area.id === editingId ? saved : area)
        : [...current, saved]);
      cancel();
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível salvar a área.'));
    } finally {
      setSaving(false);
    }
  };
  const remove = async () => {
    if (!selected || !window.confirm('Excluir esta área de alerta?')) return;
    setSaving(true);
    try {
      await deleteAlertArea(selected.id);
      setAreas(current => current.filter(area => area.id !== selected.id));
      cancel();
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível excluir a área.'));
    } finally {
      setSaving(false);
    }
  };
  const draftArea = draft ? normalized(draft) : null;
  const markerSize = bounds.width * 0.018 / zoom;

  return <div className="page-shell">
    <header className="[margin-bottom:20px] [padding:24px] [border-radius:20px] [background:white] [box-shadow:0_10px_30px_rgba(16,35,61,0.08)]">
      <h1 className="[margin:0]">Alertas da cidade</h1>
      <p className="[margin:8px_0_0] [color:#58708d]">Arraste no mapa para selecionar uma área e classifique o alerta.</p>
      {error && <p className="[margin-bottom:0] [color:#c53030]">{error}</p>}
    </header>

    <section className="[padding:20px] [border-radius:18px] [background:white] [box-shadow:0_8px_24px_rgba(16,35,61,0.06)]">
      <div className="[display:flex] [align-items:center] [justify-content:space-between] [gap:12px] [margin-bottom:14px] [flex-wrap:wrap]">
        <div><h2 className="[margin:0]">Mapa da cidade</h2><p className="[margin:5px_0_0] [color:#58708d] [font-size:0.9rem]">{hangars.length} hangar(es) exibido(s)</p></div>
        <div className="[display:flex] [gap:7px]">
          <button type="button" onClick={() => setZoom(current => Math.min(6, current * 1.35))} className="[padding:8px_12px] [border:0] [border-radius:8px] [background:#10233d] [color:white] [cursor:pointer]">+</button>
          <button type="button" onClick={() => setZoom(current => Math.max(1, current / 1.35))} className="[padding:8px_12px] [border:0] [border-radius:8px] [background:#10233d] [color:white] [cursor:pointer]">−</button>
          <button type="button" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="[padding:8px_12px] [border:0] [border-radius:8px] [background:#edf2f7] [color:#10233d] [cursor:pointer]">Redefinir</button>
        </div>
      </div>
      <div className="[display:grid] [grid-template-columns:minmax(0,_1fr)_280px] [gap:18px] max-md:[grid-template-columns:1fr]">
      <div className="[position:relative] [aspect-ratio:1/1] [overflow:hidden] [border:1px_solid_#d6deea] [border-radius:14px] [background:#eef3f1]">
        <svg ref={svgRef} viewBox={`${viewX} ${viewY} ${viewWidth} ${viewHeight}`} className="city-map [display:block] [width:100%] [height:100%] [touch-action:none] [cursor:crosshair]" onContextMenu={event => event.preventDefault()} onPointerDown={event => {
          if (event.button === 2) {
            event.preventDefault();
            panning.current = { clientX: event.clientX, clientY: event.clientY, pan };
            event.currentTarget.setPointerCapture(event.pointerId);
            return;
          }
          if (event.button !== 0) return;
          if (event.target !== event.currentTarget && event.target.dataset.background !== 'true') return;
          const point = pointFromEvent(event);
          drawing.current = point;
          setSelected(null);
          if (!editingId) setDescription('');
          setDraft({ start: point, end: point });
          event.currentTarget.setPointerCapture(event.pointerId);
        }} onPointerMove={event => {
          setCursorPoint(pointFromEvent(event));
          if (panning.current) {
            const rect = svgRef.current.getBoundingClientRect();
            setPan({
              x: panning.current.pan.x - (event.clientX - panning.current.clientX) * viewWidth / rect.width,
              y: panning.current.pan.y - (event.clientY - panning.current.clientY) * viewHeight / rect.height
            });
            return;
          }
          if (resizing.current) {
            const point = pointFromEvent(event);
            const next = { ...resizing.current.area };
            if (resizing.current.edge === 'left') next.minX = point.x;
            if (resizing.current.edge === 'right') next.maxX = point.x;
            if (resizing.current.edge === 'top') next.minY = point.y;
            if (resizing.current.edge === 'bottom') next.maxY = point.y;
            setDraftCoordinates(next);
            return;
          }
          if (!drawing.current) return;
          setDraft({ start: drawing.current, end: pointFromEvent(event) });
        }} onPointerUp={() => {
          drawing.current = null;
          resizing.current = null;
          panning.current = null;
        }} onPointerCancel={() => {
          drawing.current = null;
          resizing.current = null;
          panning.current = null;
        }} onPointerLeave={() => {
          if (!drawing.current && !resizing.current && !panning.current) setCursorPoint(null);
        }}>
          <defs>
            <pattern id="alert-grid" width={Math.max(bounds.width / 18, 2)} height={Math.max(bounds.height / 18, 2)} patternUnits="userSpaceOnUse">
              <path d={`M ${Math.max(bounds.width / 18, 2)} 0 L 0 0 0 ${Math.max(bounds.height / 18, 2)}`} fill="none" stroke="#cbd8d3" strokeWidth={markerSize * 0.12} />
            </pattern>
          </defs>
          <rect data-background="true" x={bounds.x} y={bounds.y} width={bounds.width} height={bounds.height} fill="url(#alert-grid)" />
          {areas.map(area => <g key={area.id}>
            <rect data-area="true" x={area.minX} y={area.minY} width={area.maxX - area.minX} height={area.maxY - area.minY} fill={types[area.type].color} fillOpacity={selected?.id === area.id ? 0.62 : 0.4} stroke={types[area.type].color} strokeWidth={selected?.id === area.id ? markerSize * 0.5 : markerSize * 0.25} className="[cursor:pointer]" onPointerDown={event => {
            if (event.button === 2) return;
            event.stopPropagation();
            setSelected(area);
            setDraft(null);
            setEditingId(null);
          }} />
            <foreignObject pointerEvents="none" x={(area.minX + area.maxX) / 2 - markerSize * 2} y={(area.minY + area.maxY) / 2 - markerSize * 2} width={markerSize * 4} height={markerSize * 4}>
              <div xmlns="http://www.w3.org/1999/xhtml" style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: 'white', fontSize: `${markerSize * 2.2}px`, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.45))' }}>
                <i className={`bi ${types[area.type].icon}`} />
              </div>
            </foreignObject>
          </g>)}
          {draftArea && <rect x={draftArea.minX} y={draftArea.minY} width={draftArea.maxX - draftArea.minX} height={draftArea.maxY - draftArea.minY} fill={types[type].color} fillOpacity="0.38" stroke={types[type].color} strokeWidth={markerSize * 0.35} strokeDasharray={`${markerSize} ${markerSize * 0.7}`} />}
          {draftArea && <>
            {[
              { edge: 'left', x: draftArea.minX - markerSize * 0.7, y: draftArea.minY, width: markerSize * 1.4, height: draftArea.maxY - draftArea.minY, cursor: 'ew-resize' },
              { edge: 'right', x: draftArea.maxX - markerSize * 0.7, y: draftArea.minY, width: markerSize * 1.4, height: draftArea.maxY - draftArea.minY, cursor: 'ew-resize' },
              { edge: 'top', x: draftArea.minX, y: draftArea.minY - markerSize * 0.7, width: draftArea.maxX - draftArea.minX, height: markerSize * 1.4, cursor: 'ns-resize' },
              { edge: 'bottom', x: draftArea.minX, y: draftArea.maxY - markerSize * 0.7, width: draftArea.maxX - draftArea.minX, height: markerSize * 1.4, cursor: 'ns-resize' }
            ].map(handle => <rect key={handle.edge} x={handle.x} y={handle.y} width={handle.width} height={handle.height} fill="transparent" stroke={types[type].color} strokeWidth={markerSize * 0.18} style={{ cursor: handle.cursor }} onPointerDown={event => {
              if (event.button !== 0) return;
              event.stopPropagation();
              resizing.current = { edge: handle.edge, area: draftArea };
              event.currentTarget.setPointerCapture(event.pointerId);
            }} />)}
          </>}
          {draftArea && <>
            <rect x={draftArea.minX} y={draftArea.minY - markerSize * 2.8} width={markerSize * 13} height={markerSize * 2.3} rx={markerSize * 0.5} fill="#10233d" />
            <text x={draftArea.minX + markerSize * 0.7} y={draftArea.minY - markerSize * 1.25} fontSize={markerSize * 1.2} fontWeight="700" fill="white">({Math.round(draftArea.minX)}, {Math.round(draftArea.minY)})</text>
            <rect x={draftArea.maxX - markerSize * 13} y={draftArea.maxY + markerSize * 0.5} width={markerSize * 13} height={markerSize * 2.3} rx={markerSize * 0.5} fill="#10233d" />
            <text x={draftArea.maxX - markerSize * 12.3} y={draftArea.maxY + markerSize * 2.05} fontSize={markerSize * 1.2} fontWeight="700" fill="white">({Math.round(draftArea.maxX)}, {Math.round(draftArea.maxY)})</text>
          </>}
          {hangars.map(hangar => {
            const labelWidth = Math.max(markerSize * 11, (hangar.name.length + 2) * markerSize);
            return <g key={hangar.id} pointerEvents="none">
            <rect x={hangar.positionX - markerSize * 1.4} y={hangar.positionY - markerSize * 1.4} width={markerSize * 2.8} height={markerSize * 2.8} rx={markerSize * 0.4} fill="#10233d" stroke="white" strokeWidth={markerSize * 0.3} />
            <circle cx={hangar.positionX} cy={hangar.positionY} r={markerSize * 0.42} fill="#60a5fa" />
            <rect x={hangar.positionX - labelWidth / 2} y={hangar.positionY - markerSize * 5.4} width={labelWidth} height={markerSize * 2.5} rx={markerSize * 0.65} fill="white" stroke="#0f5bd7" strokeWidth={markerSize * 0.18} />
            <text x={hangar.positionX} y={hangar.positionY - markerSize * 3.75} textAnchor="middle" fontSize={markerSize * 1.35} fontWeight="800" fill="#10233d">{hangar.name}</text>
          </g>;
          })}
        </svg>
        {cursorPoint && <div className="[position:absolute] [bottom:10px] [left:10px] [padding:6px_9px] [border-radius:8px] [background:rgba(16,35,61,0.88)] [color:white] [font-size:0.78rem] [font-weight:700] [pointer-events:none]">X: {Math.round(cursorPoint.x)} · Y: {Math.round(cursorPoint.y)}</div>}
      </div>

      <aside>
        <h2 className="[margin-top:0]">Editor de área</h2>
        <div className="[display:grid] [gap:9px]">
          {Object.entries(types).map(([value, option]) => <div key={value} className="[display:flex] [align-items:center] [gap:9px] [font-size:0.9rem]"><span style={{ background: option.color }} className="[display:grid] [width:26px] [height:26px] [place-items:center] [border-radius:7px] [color:white]"><i className={`bi ${option.icon}`} /></span>{option.label}</div>)}
        </div>
        {draft && <div className="[margin-top:20px] [padding-top:16px] [border-top:1px_solid_#e2e8f0]">
          <div className="[margin-bottom:12px] [padding:10px] [border-radius:9px] [background:#f1f5f9] [color:#40566f] [font-size:0.85rem]">
            <strong>Coordenadas selecionadas</strong><br />
            X: {Math.round(draftArea.minX)} até {Math.round(draftArea.maxX)}<br />
            Y: {Math.round(draftArea.minY)} até {Math.round(draftArea.maxY)}
          </div>
          <div className="[display:grid] [grid-template-columns:repeat(2,_minmax(0,_1fr))] [gap:9px] [margin-bottom:12px]">
            {[
              ['minX', 'X inicial'], ['maxX', 'X final'],
              ['minY', 'Y inicial'], ['maxY', 'Y final']
            ].map(([field, label]) => <label key={field} className="[font-size:0.8rem] [color:#58708d]">
              <span className="[display:block] [margin-bottom:4px]">{label}</span>
              <input type="number" step="1" value={Math.round(draftArea[field])} onChange={event => changeDraftCoordinate(field, event.target.value)} className="[width:100%] [padding:8px] [border:1px_solid_#d6deea] [border-radius:8px] [background:white] [color:#10233d]" />
            </label>)}
          </div>
          <label className="[display:block] [margin-bottom:6px] [font-weight:700]">Descrição</label>
          <textarea value={description} onChange={event => setDescription(event.target.value)} maxLength={500} rows={4} placeholder="Explique o motivo e os cuidados desta área..." className="[width:100%] [margin-bottom:12px] [padding:10px] [resize:vertical] [border:1px_solid_#d6deea] [border-radius:9px] [background:white]" />
          <label className="[display:block] [margin-bottom:6px] [font-weight:700]">Classificação</label>
          <select value={type} onChange={event => setType(event.target.value)} className="[width:100%] [padding:10px] [border:1px_solid_#d6deea] [border-radius:9px] [background:white]">
            {Object.entries(types).map(([value, option]) => <option key={value} value={value}>{option.label}</option>)}
          </select>
          <button type="button" onClick={save} disabled={saving} className="[width:100%] [margin-top:10px] [padding:10px] [border:0] [border-radius:9px] [background:#0f5bd7] [color:white] [font-weight:700] [cursor:pointer]">{saving ? 'Salvando...' : editingId ? 'Salvar edição' : 'Salvar área'}</button>
          <button type="button" onClick={cancel} className="[width:100%] [margin-top:8px] [padding:10px] [border:0] [border-radius:9px] [background:#edf2f7] [color:#10233d] [cursor:pointer]">Cancelar</button>
        </div>}
        {selected && <div className="[margin-top:20px] [padding:14px] [border-radius:12px] [background:#f8fafc]">
          <strong>{types[selected.type].label}</strong>
          <p className="[margin:8px_0_0] [color:#58708d] [font-size:0.9rem] [line-height:1.5]">{selected.description || 'Sem descrição.'}</p>
          <div className="[display:grid] [gap:8px] [margin-top:12px]">
            <button type="button" onClick={edit} className="[padding:9px] [border:0] [border-radius:8px] [background:#dbeafe] [color:#1d4ed8] [font-weight:700] [cursor:pointer]">Editar</button>
            <button type="button" onClick={cancel} className="[padding:9px] [border:0] [border-radius:8px] [background:#edf2f7] [color:#10233d] [cursor:pointer]">Cancelar</button>
            <button type="button" onClick={remove} disabled={saving} className="[padding:9px] [border:0] [border-radius:8px] [background:#fee2e2] [color:#c53030] [font-weight:700] [cursor:pointer]">Deletar</button>
          </div>
        </div>}
        {!draft && !selected && <p className="[margin-top:20px] [color:#58708d] [font-size:0.9rem] [line-height:1.5]">Arraste sobre uma parte vazia do mapa para criar uma área ou clique em uma área existente para gerenciá-la.</p>}
      </aside>
      </div>
    </section>
  </div>;
};

export default Alertas;
