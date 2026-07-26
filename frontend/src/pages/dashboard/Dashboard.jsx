import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { HangarContext } from '../../context/HangarContext';
import {
  getDashboardData,
  getDeliveryMetrics,
  getDroneRanking,
} from '../../services/dashboardService';
import { getErrorMessage } from '../../utils/errorMessage';
import HangarRouteMap from '../../components/maps/HangarRouteMap';
const Dashboard = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [drones, setDrones] = useState([]);
  const [hangars, setHangars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const {
    selectedHangarId
  } = useContext(HangarContext);
  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const data = await getDashboardData();
        setDeliveries(data.deliveries);
        setDrones(data.drones);
        setHangars(data.hangars);
      } catch (err) {
        setError(getErrorMessage(err, 'Nao foi possivel carregar a dashboard.'));
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);
  const selectedHangar = useMemo(() => hangars.find(hangar => hangar.id === selectedHangarId) || hangars[0] || null, [hangars, selectedHangarId]);
  const metrics = useMemo(() => getDeliveryMetrics(deliveries, drones), [deliveries, drones]);
  const droneRanking = useMemo(() => getDroneRanking(deliveries, drones), [deliveries, drones]);
  const mapDeliveries = useMemo(() => deliveries.filter(delivery => !selectedHangar || delivery.hangarId === selectedHangar.id), [deliveries, selectedHangar]);
  const mapDrones = useMemo(() => drones.filter(drone => !selectedHangar || drone.hangarId === selectedHangar.id), [drones, selectedHangar]);
  return <div className="[min-height:100%] [background:linear-gradient(180deg,_#eef4ff_0%,_#f8fafc_100%)] [color:#10233d]">
      <div className="[margin:0_auto]">
        <div className="[display:flex] [justify-content:space-between] [align-items:center] [margin-bottom:24px] [gap:16px] [flex-wrap:wrap]">
          <div>
            <h1 className="[margin:0]">Dashboard</h1>
            <p className="[margin:8px_0_0] [color:#58708d]">Visao geral das suas entregas com dados reais do sistema.</p>
          </div>
          <div className="[display:flex] [gap:10px] [flex-wrap:wrap]">
            <Link to="/entregas/cadastrar" className="[padding:10px_16px] [border-radius:10px] [background:#0f5bd7] [color:white] [text-decoration:none]">
              Nova entrega
            </Link>
            <Link to="/dashboard/pedidos" className="[padding:10px_16px] [border-radius:10px] [background:#10233d] [color:white] [text-decoration:none]">
              Pedidos
            </Link>
          </div>
        </div>

        {error && <div className="[margin-bottom:16px] [padding:12px_14px] [border-radius:10px] [background:#ffe3e3] [color:#9d1c1c]">{error}</div>}

        <section className="[display:grid] [grid-template-columns:repeat(auto-fit,_minmax(220px,_1fr))] [gap:16px] [margin-bottom:24px]">
          {metrics.map(item => <article key={item.label} className="[background:white] [padding:22px] [border-radius:18px] [box-shadow:0_10px_30px_rgba(16,35,61,0.08)]">
              <div className="[color:#58708d] [margin-bottom:10px]">{item.label}</div>
              <div className="[font-size:2rem] [font-weight:700]">{loading ? '...' : item.value}</div>
            </article>)}
        </section>

        <section className="[background:white] [padding:24px] [border-radius:18px] [box-shadow:0_10px_30px_rgba(16,35,61,0.08)] [margin-bottom:20px]">
          <div className="[display:flex] [justify-content:space-between] [gap:12px] [align-items:center] [flex-wrap:wrap]">
            <div>
              <h2 className="[margin:0]">Ranking de drones</h2>
              <p className="[margin:6px_0_0] [color:#58708d] [font-size:0.85rem]">
                Ordenado por entregas concluidas divididas pela distancia da rota. Quanto maior o indice, mais eficiente o drone aparece.
              </p>
            </div>
          </div>
          <div className="internal-scroll-list [display:grid] [gap:12px] [margin-top:16px]">
            {loading ? <p>Carregando...</p> : droneRanking.length === 0 ? <p>Nenhum drone finalizou entregas ainda.</p> : droneRanking.map((item, index) => <article key={item.drone.id} style={{
            background: index === 0 ? '#eef6ff' : '#f7f9fc'
          }} className="[padding:14px_16px] [border-radius:12px] [display:flex] [justify-content:space-between] [gap:16px] [align-items:center]">
                  <div>
                    <div className="[font-weight:700]">
                      {index + 1}. {item.drone.name}
                    </div>
                    <div className="[color:#58708d] [font-size:0.9rem]">
                      {item.deliveredCount} entregas realizadas | Rota: {item.routeDistance || 0} km | Velocidade media: {item.averageSpeed || 0}
                    </div>
                  </div>
                  <div className="[font-weight:700] [color:#0f5bd7]">{item.efficiencyScore.toFixed(3)}</div>
                </article>)}
          </div>
        </section>

        {selectedHangar && <div className="[margin-bottom:20px]">
            <HangarRouteMap hangar={selectedHangar} drones={mapDrones} deliveries={mapDeliveries} />
          </div>}
      </div>
    </div>;
};
export default Dashboard;
