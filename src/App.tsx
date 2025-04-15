import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import RoleProtectedRoute from "./components/RoleProtectedRoute";

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
          
          {/* Coach Routes */}
          <Route path="/dashboard" element={
            <RoleProtectedRoute allowedRoles={["coach"]}>
              <Dashboard />
            </RoleProtectedRoute>
          } />
          <Route path="/atletas" element={
            <RoleProtectedRoute allowedRoles={["coach"]}>
              <Atletas />
            </RoleProtectedRoute>
          } />
          <Route path="/treinos" element={
            <RoleProtectedRoute allowedRoles={["coach"]}>
              <Treinos />
            </RoleProtectedRoute>
          } />
          
          {/* Shared Routes (both coach and athlete) */}
          <Route path="/metas-evolucao" element={
            <RoleProtectedRoute allowedRoles={["coach", "athlete"]}>
              <MetasEvolucao />
            </RoleProtectedRoute>
          } />
          <Route path="/desempenho-detalhado" element={
            <RoleProtectedRoute allowedRoles={["coach", "athlete"]}>
              <DesempenhoDetalhado />
            </RoleProtectedRoute>
          } />
          <Route path="/presencas" element={
            <RoleProtectedRoute allowedRoles={["coach", "athlete"]}>
              <Presencas />
            </RoleProtectedRoute>
          } />
          
          {/* Notification settings accessible to all authenticated users */}
          <Route path="/notification-settings" element={
            <RoleProtectedRoute allowedRoles={["coach", "athlete"]}>
              <NotificationSettings />
            </RoleProtectedRoute>
          } />

          <Route path="*" element={<NotFound />} />
        </Routes>
        <AutoSync />
        <Toaster />
      </div>
    </BrowserRouter>
  );
};

export default App;
