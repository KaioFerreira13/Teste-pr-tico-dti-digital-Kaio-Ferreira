import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Hangars from './pages/Hangars';
import Drones from './pages/Drones';
import Modelos from './pages/Modelos';
import Entregas from './pages/Entregas';
import AppLayout from './components/AppLayout';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { authenticated, loading } = useContext(AuthContext);

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route
            path="/hangars"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Hangars />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/drones"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Drones />
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
            path="/entregas"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Entregas />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
