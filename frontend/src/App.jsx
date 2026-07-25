import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DashboardDrones from './pages/DashboardDrones';
import Hangars from './pages/Hangars';
import GerenciarHangars from './pages/GerenciarHangars';
import Drones from './pages/Drones';
import GerenciarDrones from './pages/GerenciarDrones';
import Modelos from './pages/Modelos';
import Entregas from './pages/Entregas';
import PedidosPorEstado from './pages/PedidosPorEstado';
import GerenciarEntregas from './pages/GerenciarEntregas';
import AppLayout from './components/AppLayout';
import { HangarProvider } from './context/HangarContext';
import './App.css';

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

function App() {
  return (
    <AuthProvider>
      <HangarProvider>
        <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
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
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </Router>
      </HangarProvider>
    </AuthProvider>
  );
}

export default App;
