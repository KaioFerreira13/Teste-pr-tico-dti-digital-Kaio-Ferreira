import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  groupDeliveriesByStatus,
  listDeliveries,
} from '../../services/deliveryService';
import { getErrorMessage } from '../../utils/errorMessage';
const statusColumns = [{
  value: 'AGUARDANDO_CONFIRMACAO',
  label: 'Aguardando confirmação'
}, {
  value: 'CONFIRMADA',
  label: 'Confirmada'
}, {
  value: 'EM_DESPACHO',
  label: 'Em despacho'
}, {
  value: 'ENTREGUE',
  label: 'Entregue'
}];
const PedidosPorEstado = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    const loadDeliveries = async () => {
      setLoading(true);
      try {
        setDeliveries(await listDeliveries());
      } catch (err) {
        setError(getErrorMessage(err, 'Nao foi possivel carregar os pedidos por estado.'));
      } finally {
        setLoading(false);
      }
    };
    loadDeliveries();
  }, []);
  const groupedDeliveries = useMemo(() => {
    return groupDeliveriesByStatus(deliveries, statusColumns);
  }, [deliveries]);
  return <div className="[min-height:100%] [background:linear-gradient(180deg,_#eef4ff_0%,_#f8fafc_100%)] [color:#10233d]">
      <div className="[margin:0_auto]">
        <div className="[display:flex] [justify-content:space-between] [align-items:center] [margin-bottom:24px] [gap:16px] [flex-wrap:wrap]">
          <div>
            <h1 className="[margin:0]">Pedidos por estado</h1>
            <p className="[margin:8px_0_0] [color:#58708d]">Cada coluna mostra os pedidos separados pelo status atual no sistema.</p>
          </div>
          <Link to="/dashboard" className="[padding:10px_16px] [border-radius:10px] [background:#0f5bd7] [color:white] [text-decoration:none]">
            Voltar ao dashboard
          </Link>
        </div>

        {error && <div className="[margin-bottom:16px] [padding:12px_14px] [border-radius:10px] [background:#ffe3e3] [color:#9d1c1c]">{error}</div>}

        {loading ? <div className="[background:white] [padding:24px] [border-radius:18px] [box-shadow:0_10px_30px_rgba(16,35,61,0.08)]">Carregando...</div> : <section className="[display:grid] [grid-template-columns:repeat(4,_minmax(240px,_1fr))] [gap:16px] [overflow-x:auto] [padding-bottom:6px]">
            {groupedDeliveries.map(column => <article key={column.value} className="[background:white] [padding:18px] [border-radius:18px] [box-shadow:0_10px_30px_rgba(16,35,61,0.08)] [min-height:260px]">
                <div className="[display:flex] [justify-content:space-between] [gap:12px] [align-items:center]">
                  <h2 className="[margin:0] [font-size:1.05rem]">{column.label}</h2>
                  <span className="[color:#58708d]">{column.items.length}</span>
                </div>
                <div className="internal-scroll-list [display:grid] [gap:10px] [margin-top:14px]">
                  {column.items.length ? column.items.map(delivery => <div key={delivery.id} className="[padding:12px] [border-radius:12px] [background:#f7f9fc] [border-left:4px_solid_#0f5bd7]">
                      <div className="[font-size:0.78rem] [color:#58708d] [margin-bottom:4px]">Codigo do pedido</div>
                      <div className="[font-family:monospace] [font-weight:700] [font-size:0.9rem] [word-break:break-all]">{delivery.codigo ?? '-'}</div>
                      <div className="[margin-top:8px] [font-weight:700]">{delivery.recipientName}</div>
                      <div className="[color:#58708d] [font-size:0.88rem]">Prioridade: {delivery.priority}</div>
                    </div>) : <span className="[color:#58708d]">Nenhum pedido neste estado.</span>}
                </div>
              </article>)}
          </section>}
      </div>
    </div>;
};
export default PedidosPorEstado;
