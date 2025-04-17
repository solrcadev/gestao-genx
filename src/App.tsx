<<<<<<< HEAD
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Athletes from "./pages/Athletes";
import Trainings from "./pages/Trainings";
import Performance from "./pages/Performance";
import More from "./pages/More";
import NotFound from "./pages/NotFound";
import Exercises from "./pages/Exercises";
import TrainingAssembly from "./pages/TrainingAssembly";
import TreinoDoDia from "./pages/TreinoDosDia";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import Dashboard from "./pages/Dashboard";
import BottomNavbar from "./components/BottomNavbar";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import StudentPerformance from './pages/StudentPerformance';
import AttendanceManagement from './pages/AttendanceManagement';
import AthleteDetails from './pages/AthleteDetails';
import MetasEvolucao from './pages/MetasEvolucao';
import RouterPersistence from "./components/RouterPersistence";
=======
>>>>>>> f1b3285a32698cf39fc0b4ec27169b31117b1f90

import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import Dashboard from './pages/Dashboard';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import { useAuth } from './contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import AutoSync from './components/AutoSync';
import NotificationSettings from './pages/NotificationSettings';
import Atletas from './pages/Athletes';
import Treinos from './pages/Trainings';
import MetasEvolucao from './pages/MetasEvolucao';
import DesempenhoDetalhado from './pages/Performance';
import Presencas from './pages/AttendanceManagement';
import Historico from './pages/StudentPerformance';
import Calendario from './pages/TreinoDosDia';
import More from './pages/More';
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import LoadingSpinner from './components/LoadingSpinner';

const App = () => {
  const { loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
<<<<<<< HEAD
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <RouterPersistence>
              <div className="bg-background min-h-screen">
                <Routes>
                  {/* Rotas públicas */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  
                  {/* Rotas protegidas */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route 
                    path="/dashboard" 
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/atletas" 
                    element={
                      <ProtectedRoute>
                        <Athletes />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/atleta/:id" 
                    element={
                      <ProtectedRoute>
                        <AthleteDetails />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/treinos" 
                    element={
                      <ProtectedRoute>
                        <Trainings />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/exercicios" 
                    element={
                      <ProtectedRoute>
                        <Exercises />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/montar-treino" 
                    element={
                      <ProtectedRoute>
                        <TrainingAssembly />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/montagem-treino" 
                    element={
                      <ProtectedRoute>
                        <TrainingAssembly />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/desempenho" 
                    element={
                      <ProtectedRoute>
                        <Performance />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/mais" 
                    element={
                      <ProtectedRoute>
                        <More />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/treino-do-dia/:id" 
                    element={
                      <ProtectedRoute>
                        <TreinoDoDia />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/treino-do-dia" 
                    element={
                      <ProtectedRoute>
                        <TreinoDoDia />
                      </ProtectedRoute>
                    } 
                  />
                  <Route path="/aluno/:studentId/performance" element={
                    <ProtectedRoute>
                      <StudentPerformance />
                    </ProtectedRoute>
                  } />
                  <Route path="/presencas" element={
                    <ProtectedRoute>
                      <AttendanceManagement />
                    </ProtectedRoute>
                  } />
                  <Route
                    path="/metas-evolucao"
                    element={
                      <ProtectedRoute>
                        <MetasEvolucao />
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* Nova rota para gestão de presenças */}
                  <Route path="/presencas" element={
                    <ProtectedRoute>
                      <AttendanceManagement />
                    </ProtectedRoute>
                  } />
                  
                  {/* Rota 404 */}
                  <Route path="*" element={
                    <ProtectedRoute>
                      <NotFound />
                    </ProtectedRoute>
                  } />
                </Routes>
                
                {/* BottomNavbar apenas em rotas autenticadas */}
                <AuthNavbarWrapper />
              </div>
            </RouterPersistence>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
=======
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

        <Route path="/more" element={
          <RoleProtectedRoute allowedRoles={["coach", "athlete"]}>
            <More />
          </RoleProtectedRoute>
        } />

        <Route path="*" element={<NotFound />} />
      </Routes>
      <AutoSync />
      <Toaster />
    </div>
>>>>>>> f1b3285a32698cf39fc0b4ec27169b31117b1f90
  );
};

export default App;
