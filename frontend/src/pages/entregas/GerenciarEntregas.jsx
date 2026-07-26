import React, { useContext, useEffect, useState } from 'react';
import {
  allocatePendingDeliveries,
  clearDeliveryQueue,
  confirmDeliveryDispatch,
  deleteDelivery,
  getDeliveryManagement,
  splitDelivery,
} from '../../services/deliveryService';
import { listHangars } from '../../services/hangarService';
import { HangarContext } from '../../context/HangarContext';
import { listAlertAreas } from '../../services/alertService';
const deliveryLabels = {
  AGUARDANDO_CONFIRMACAO: 'Aguardando confirmação',
  CONFIRMADA: 'Confirmada',
  EM_DESPACHO: 'Em despacho',
  EM_ROTA: 'Em rota',
  ENTREGUE: 'Entregue',
  INVIAVEL: 'Inviável'
};
const statusColors = {
  CONFIRMADA: '#b7791f',
  EM_DESPACHO: '#1769aa',
  ENTREGUE: '#2f855a',
  INVIAVEL: '#c53030',
  AGUARDANDO_CONFIRMACAO: '#58708d'
};
const inviabilityMessages = {
  PESO: 'Peso acima da capacidade dos drones deste hangar.',
  DISTANCIA: 'Distância acima da autonomia dos drones deste hangar.',
  PESO_E_DISTANCIA: 'Peso e distância acima da capacidade operacional dos drones deste hangar.',
  AREA_RESTRITA: 'As coordenadas de destino estão dentro de uma área restrita.'
};
const GerenciarEntregas = () => {
  const [hangars, setHangars] = useState([]);
  const {
    selectedHangarId: selectedHangar
  } = useContext(HangarContext);
  const [deliveries, setDeliveries] = useState([]);
  const [drones, setDrones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [prepared, setPrepared] = useState(false);
  const [inviableDelivery, setInviableDelivery] = useState(null);
  const [partitionCount, setPartitionCount] = useState(2);
  const [partitionWeights, setPartitionWeights] = useState(['', '']);
  const [restrictedAreas, setRestrictedAreas] = useState([]);
  const loadManagement = async hangarId => {
    if (!hangarId) {
      setDeliveries([]);
      setDrones([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await getDeliveryManagement(hangarId);
      setDeliveries(data.deliveries);
      setDrones(data.drones);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Nao foi possivel carregar o hangar.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    listHangars().then(setHangars).catch(() => setError('Nao foi possivel carregar os hangares.'));
    listAlertAreas().then(setRestrictedAreas).catch(() => setRestrictedAreas([]));
  }, []);
  useEffect(() => {
    setPrepared(false);
    loadManagement(selectedHangar);
  }, [selectedHangar]);
  const prepareDispatch = async () => {
    if (!selectedHangar) return;
    setError('');
    const hangar = hangars.find(item => item.id === selectedHangar);
    const allocation = allocatePendingDeliveries(deliveries, drones, hangar, restrictedAreas);
    setDeliveries(allocation.deliveries);
    setDrones(allocation.drones);
    setPrepared(true);
  };
  const confirmDispatch = async () => {
    if (deliveries.some(delivery => delivery.status === 'INVIAVEL')) {
      setError('Trate todas as entregas inviáveis antes de confirmar a movimentação.');
      return;
    }
    if (!window.confirm('Confirma a movimentacao das entregas para os drones?')) return;
    setLoading(true);
    setError('');
    try {
      const deliveryIds = deliveries.filter(delivery => delivery.status === 'CONFIRMADA').map(delivery => delivery.id);
      const data = await confirmDeliveryDispatch(selectedHangar, deliveryIds);
      setDeliveries(data.deliveries);
      setDrones(data.drones);
      setPrepared(false);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Nao foi possivel confirmar a movimentacao.');
    } finally {
      setLoading(false);
    }
  };
  const clearQueue = async () => {
    if (!window.confirm('Limpar a fila e devolver todos os pedidos para aguardando confirmação?')) return;
    setLoading(true);
    setError('');
    try {
      const data = await clearDeliveryQueue(selectedHangar);
      setDeliveries(data.deliveries);
      setDrones(data.drones);
      setPrepared(false);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Não foi possível limpar a fila.');
    } finally {
      setLoading(false);
    }
  };
  const openSplitModal = delivery => {
    setInviableDelivery(delivery);
    setPartitionCount(2);
    setPartitionWeights(['', '']);
  };
  const changePartitionCount = event => {
    const count = Math.max(2, Number(event.target.value) || 2);
    setPartitionCount(count);
    setPartitionWeights(current => Array.from({
      length: count
    }, (_, index) => current[index] || ''));
  };
  const splitInviable = async () => {
    const weights = partitionWeights.map(Number);
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    if (weights.some(weight => !Number.isFinite(weight) || weight <= 0) || Math.abs(total - inviableDelivery.weight) > 0.000001) {
      setError(`A soma das particoes deve ser exatamente ${inviableDelivery.weight} kg.`);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const parts = await splitDelivery(inviableDelivery.id, weights);
      const nextDeliveries = [...deliveries.filter(delivery => delivery.id !== inviableDelivery.id), ...parts];
      const hangar = hangars.find(item => item.id === selectedHangar);
      const allocation = allocatePendingDeliveries(nextDeliveries, drones, hangar, restrictedAreas);
      setDeliveries(allocation.deliveries);
      setDrones(allocation.drones);
      setPrepared(true);
      setInviableDelivery(null);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Nao foi possivel repartir a entrega.');
    } finally {
      setLoading(false);
    }
  };
  const deleteInviable = async () => {
    if (!window.confirm('Deseja excluir esta entrega inviavel?')) return;
    setLoading(true);
    try {
      await deleteDelivery(inviableDelivery.id);
      const nextDeliveries = deliveries.filter(delivery => delivery.id !== inviableDelivery.id);
      setDeliveries(nextDeliveries);
      setPrepared(true);
      setInviableDelivery(null);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Nao foi possivel excluir a entrega.');
    } finally {
      setLoading(false);
    }
  };
  const grouped = {
    AGUARDANDO_CONFIRMACAO: deliveries.filter(delivery => delivery.status === 'AGUARDANDO_CONFIRMACAO'),
    CONFIRMADA: deliveries.filter(delivery => delivery.status === 'CONFIRMADA').sort((a, b) => ({
      BAIXA: 1,
      MEDIA: 2,
      ALTA: 3
    }[b.priority] || 0) - ({
      BAIXA: 1,
      MEDIA: 2,
      ALTA: 3
    }[a.priority] || 0)),
    EM_DESPACHO: deliveries.filter(delivery => delivery.status === 'EM_DESPACHO'),
    EM_ROTA: deliveries.filter(delivery => delivery.status === 'EM_ROTA'),
    INVIAVEL: deliveries.filter(delivery => delivery.status === 'INVIAVEL')
  };
  const renderDelivery = delivery => <article key={delivery.id} style={{
    borderLeft: `4px solid ${statusColors[delivery.status] || '#58708d'}`
  }} className="[padding:14px] [border-radius:12px] [background:#f7f9fc]">
      <div className="[display:flex] [justify-content:space-between] [gap:12px]">
        <strong>{delivery.recipientName}</strong>
        <span style={{
        color: statusColors[delivery.status] || '#58708d'
      }} className="[font-weight:700] [font-size:0.85rem]">{deliveryLabels[delivery.status] || delivery.status}</span>
      </div>
      <div className="[margin-top:8px] [color:#58708d] [font-size:0.9rem]">
        {delivery.weight} kg | Prioridade: {delivery.priority?.toLowerCase()}
      </div>
      {delivery.droneId && <div className="[margin-top:5px] [color:#58708d] [font-size:0.9rem]">Drone: {drones.find(drone => drone.id === delivery.droneId)?.name || delivery.droneId}</div>}
      {delivery.status === 'INVIAVEL' && <div className="[margin-top:8px] [padding:8px_10px] [border-radius:8px] [background:#fff1f2] [color:#b42318] [font-size:0.85rem] [font-weight:700]">
        Motivo: {inviabilityMessages[delivery.inviabilityReason] || 'Nenhum drone atende aos requisitos desta entrega.'}
      </div>}
      {delivery.status === 'INVIAVEL' && <button onClick={() => openSplitModal(delivery)} className="[margin-top:10px] [padding:8px_11px] [border:0] [border-radius:8px] [background:#fee2e2] [color:#c53030] [font-weight:700] [cursor:pointer]">Tratar entrega</button>}
    </article>;
  const renderColumn = (title, status, description) => <section className="[padding:18px] [border-radius:16px] [background:white] [box-shadow:0_8px_24px_rgba(16,35,61,0.06)]">
      <h2 className="[margin:0] [font-size:1.15rem]">{title} <span className="[color:#58708d]">({grouped[status].length})</span></h2>
      <p className="[min-height:42px] [color:#58708d] [font-size:0.9rem] [line-height:1.4]">{description}</p>
      <div className="internal-scroll-list [display:grid] [gap:10px]">{grouped[status].length ? grouped[status].map(renderDelivery) : <span className="[color:#58708d]">Nenhuma entrega nesta etapa.</span>}</div>
    </section>;
  return <div className="[max-width:1180px]">
      <div className="[margin-bottom:20px] [padding:26px] [border-radius:20px] [background:white] [box-shadow:0_10px_30px_rgba(16,35,61,0.08)]">
        <h1 className="[margin:0_0_8px]">Gerenciar entregas</h1>
        <p className="[margin:0] [color:#58708d]">Selecione um hangar para visualizar a operação e preparar o despacho.</p>
        {selectedHangar && !prepared && <button onClick={prepareDispatch} disabled={loading} className="[margin-top:14px] [display:block] [padding:11px_16px] [border:0] [border-radius:10px] [background:#0f5bd7] [color:white] [font-weight:700] [cursor:pointer]">Preparar despacho</button>}
        {selectedHangar && prepared && <button onClick={confirmDispatch} disabled={loading || grouped.INVIAVEL.length > 0} title={grouped.INVIAVEL.length > 0 ? 'Trate as entregas inviáveis antes de confirmar' : ''} style={{
        background: grouped.INVIAVEL.length > 0 ? '#94a3b8' : '#2f855a',
        cursor: grouped.INVIAVEL.length > 0 ? 'not-allowed' : 'pointer'
      }} className="[margin-top:14px] [display:block] [padding:11px_16px] [border:0] [border-radius:10px] [color:white] [font-weight:700]">{loading ? 'Confirmando...' : 'Confirmar movimentação'}</button>}
        {selectedHangar && grouped.CONFIRMADA.length > 0 && <button onClick={clearQueue} disabled={loading} style={{
        cursor: loading ? 'not-allowed' : 'pointer'
      }} className="[margin-top:10px] [display:block] [padding:10px_15px] [border:0] [border-radius:10px] [background:#fee2e2] [color:#c53030] [font-weight:700]">{loading ? 'Limpando...' : 'Limpar fila'}</button>}
        {prepared && grouped.INVIAVEL.length > 0 && <p className="[margin-bottom:0] [color:#c53030]">Trate todas as entregas inviáveis para liberar a confirmação.</p>}
        {error && <p className="[color:#c53030] [margin-bottom:0]">{error}</p>}
      </div>

      {selectedHangar && !loading && <>
        <div className="[margin-bottom:20px] [padding:20px] [border-radius:16px] [background:#10233d] [color:white]">
          <h2 className="[margin:0_0_14px]">Drones do hangar ({drones.length})</h2>
          <div className="internal-scroll-list [display:grid] [grid-template-columns:repeat(auto-fit,_minmax(190px,_1fr))] [gap:10px]">
            {drones.map(drone => <div key={drone.id} className="[padding:12px] [border-radius:10px] [background:rgba(255,255,255,0.1)]"><strong>{drone.name}</strong><div className="[margin-top:5px] [font-size:0.88rem] [opacity:0.85]">{drone.status === 'EM_DESPACHO' ? 'Em despacho' : drone.status?.toLowerCase()} | {drone.currentLoad || 0} / {drone.maxWeight} kg</div></div>)}
            {!drones.length && <span>Nenhum drone cadastrado neste hangar.</span>}
          </div>
        </div>
        {!prepared && <div className="[display:grid] [grid-template-columns:repeat(auto-fit,_minmax(250px,_1fr))] [gap:16px]">
          {renderColumn('Aguardando confirmação', 'AGUARDANDO_CONFIRMACAO', 'Entregas ainda sem tratativa. Prepare o despacho para enviá-las à fila.')}
          {renderColumn('Fila de confirmadas', 'CONFIRMADA', 'Pedidos confirmados aguardando um drone disponível, ordenados por prioridade.')}
        </div>}
        {prepared && <div className="[display:grid] [grid-template-columns:repeat(auto-fit,_minmax(250px,_1fr))] [gap:16px]">
          {renderColumn('Fila de confirmadas', 'CONFIRMADA', 'Pedidos prontos para confirmação, ordenados por prioridade.')}
          {renderColumn('Inviável', 'INVIAVEL', 'Entregas que excedem o peso, a distância ou ambos os limites operacionais.')}
        </div>}
      </>}

      {inviableDelivery && <div className="[position:fixed] [inset:0] [z-index:10] [display:grid] [place-items:center] [padding:20px] [background:rgba(16,35,61,0.58)]">
        <div className="[width:min(100%,_520px)] [padding:26px] [border-radius:18px] [background:white] [box-shadow:0_20px_60px_rgba(0,0,0,0.2)]">
          <h2 className="[margin-top:0]">Entrega inviável</h2>
          <p className="[color:#58708d] [line-height:1.5]">A entrega de <strong>{inviableDelivery.weight} kg</strong> não pode ser atendida.</p>
          <div className="[margin-bottom:16px] [padding:11px_13px] [border-radius:10px] [background:#fff1f2] [color:#b42318] [font-weight:700]">
            Motivo: {inviabilityMessages[inviableDelivery.inviabilityReason] || 'Nenhum drone atende aos requisitos desta entrega.'}
          </div>
          {inviableDelivery.inviabilityReason === 'PESO' && <>
          <h3 className="[font-size:1rem]">Repartir entrega</h3>
          <label className="[display:block] [color:#58708d]">Quantidade de volumes</label>
          <select value={partitionCount} onChange={changePartitionCount} className="[width:100%] [margin:6px_0_12px] [padding:10px] [border-radius:8px] [border:1px_solid_#d6deea]">
            {Array.from({
            length: 8
          }, (_, index) => <option key={index + 2} value={index + 2}>{index + 2}</option>)}
          </select>
          <div className="[display:grid] [grid-template-columns:repeat(2,_1fr)] [gap:10px]">
            {partitionWeights.map((weight, index) => <input key={index} type="number" min="0.01" step="0.01" placeholder={`Volume ${index + 1} (kg)`} value={weight} onChange={event => setPartitionWeights(current => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} className="[padding:10px] [border-radius:8px] [border:1px_solid_#d6deea]" />)}
          </div>
          </>}
          {inviableDelivery.inviabilityReason !== 'PESO' && <p className="[color:#58708d] [line-height:1.5]">A divisão do peso não torna esta rota viável. Esta entrega pode apenas ser excluída.</p>}
          <div className="[display:flex] [justify-content:flex-end] [gap:10px] [margin-top:20px] [flex-wrap:wrap]">
            <button onClick={deleteInviable} disabled={loading} className="[padding:10px_14px] [border:0] [border-radius:8px] [background:#fee2e2] [color:#c53030] [cursor:pointer]">Excluir entrega</button>
            <button onClick={() => setInviableDelivery(null)} disabled={loading} className="[padding:10px_14px] [border:0] [border-radius:8px] [background:#edf2f7] [color:#243b53] [cursor:pointer]">Tratar depois</button>
            {inviableDelivery.inviabilityReason === 'PESO' && <button onClick={splitInviable} disabled={loading} className="[padding:10px_14px] [border:0] [border-radius:8px] [background:#0f5bd7] [color:white] [font-weight:700] [cursor:pointer]">Confirmar divisão</button>}
          </div>
        </div>
      </div>}
    </div>;
};
export default GerenciarEntregas;
