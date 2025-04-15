
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import Dashboard from './pages/Dashboard';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import { useAuth } from './contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import AutoSync from './components/AutoSync';
import { registerPWAInstallListener } from './services/pwaService';
import NotificationSettings from './pages/NotificationSettings';
import Atletas from './pages/Athletes';
import Treinos from './pages/Trainings';
import MetasEvolucao from './pages/MetasEvolucao';
import DesempenhoDetalhado from './pages/Performance';
import Presencas from './pages/AttendanceManagement';
import Historico from './pages/StudentPerformance';
import Calendario from './pages/TreinoDosDia';
import Configuracoes from './pages/StudentPerformance';
import More from './pages/More';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  
  useEffect(() => {
    registerPWAInstallListener();
  }, []);

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

const App = () => {
  const { loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="loading loading-spinner text-primary"></span>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/atletas" element={
            <ProtectedRoute>
              <Atletas />
            </ProtectedRoute>
          } />
          <Route path="/treinos" element={
            <ProtectedRoute>
              <Treinos />
            </ProtectedRoute>
          } />
          <Route path="/metas-evolucao" element={
            <ProtectedRoute>
              <MetasEvolucao />
            </ProtectedRoute>
          } />
          <Route path="/desempenho-detalhado" element={
            <ProtectedRoute>
              <DesempenhoDetalhado />
            </ProtectedRoute>
          } />
          <Route path="/presencas" element={
            <ProtectedRoute>
              <Presencas />
            </ProtectedRoute>
          } />
          <Route path="/historico" element={
            <ProtectedRoute>
              <Historico />
            </ProtectedRoute>
          } />
          <Route path="/calendario" element={
            <ProtectedRoute>
              <Calendario />
            </ProtectedRoute>
          } />
          <Route path="/configuracoes" element={
            <ProtectedRoute>
              <Configuracoes />
            </ProtectedRoute>
          } />
          <Route path="/more" element={
            <ProtectedRoute>
              <More />
            </ProtectedRoute>
          } />
          
          {/* Add the new NotificationSettings route */}
          <Route path="/notification-settings" element={
            <ProtectedRoute>
              <NotificationSettings />
            </ProtectedRoute>
          } />

          <Route path="/register" element={<LoginPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <AutoSync />
        <Toaster />
      </div>
    </BrowserRouter>
  );
};

export default App;
