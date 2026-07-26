import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import DashboardDrones from './pages/dashboard/DashboardDrones';
import PedidosPorEstado from './pages/dashboard/PedidosPorEstado';
import Hangars from './pages/hangars/Hangars';
import GerenciarHangars from './pages/hangars/GerenciarHangars';
import Drones from './pages/drones/Drones';
import GerenciarDrones from './pages/drones/GerenciarDrones';
import Modelos from './pages/modelos/Modelos';
import Entregas from './pages/entregas/Entregas';
import GerenciarEntregas from './pages/entregas/GerenciarEntregas';
import AppLayout from './components/layout/AppLayout';
import { HangarProvider } from './context/HangarContext';
import './styles/App.css';

const ProtectedRoute = ({ children }) => {
  const { authenticated, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-mist text-ink"><i className="bi bi-arrow-repeat mr-2 animate-spin" />Carregando...</div>;
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const PublicOnlyRoute = ({ children }) => {
  const { authenticated, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-mist text-ink"><i className="bi bi-arrow-repeat mr-2 animate-spin" />Carregando...</div>;
  }

  return authenticated ? <Navigate to="/dashboard/geral" replace /> : children;
};

const SessionRedirect = () => {
  const { authenticated, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-mist text-ink"><i className="bi bi-arrow-repeat mr-2 animate-spin" />Carregando...</div>;
  }

  return <Navigate to={authenticated ? '/dashboard/geral' : '/login'} replace />;
};

function App() {
  return (
    <AuthProvider>
      <HangarProvider>
        <Router>
        <Routes>
          <Route path="/" element={<SessionRedirect />} />
          <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
          <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
          <Route path="/dashboard" element={<Navigate to="/dashboard/geral" replace />} />
          <Route
            path="/dashboard/geral" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route
            path="/dashboard/pedidos"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <PedidosPorEstado />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/drones"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <DashboardDrones />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hangars/criar"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Hangars />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hangars/gerenciar"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <GerenciarHangars />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/drones/criar"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Drones />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/drones/gerenciar"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <GerenciarDrones />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/modelos"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Modelos />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/entregas/criar"
            element={<Navigate to="/entregas/cadastrar" replace />}
          />
          <Route
            path="/entregas/cadastrar"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Entregas />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/entregas/gerenciar"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <GerenciarEntregas />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<SessionRedirect />} />
        </Routes>
        </Router>
      </HangarProvider>
    </AuthProvider>
  );
}

export default App;
