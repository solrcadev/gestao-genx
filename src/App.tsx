import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
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
import ErrorBoundary from "./components/ErrorBoundary";
import { TooltipProvider } from "@/components/ui/tooltip";

// Importação com lazy loading para evitar problemas de dependência circular
const Toaster = React.lazy(() => import("@/components/ui/toaster").then(module => ({ default: module.Toaster })));
const Sonner = React.lazy(() => import("@/components/ui/sonner").then(module => ({ default: module.Toaster })));

// Componente de fallback para carregamento
const LoadingFallback = () => <div></div>;

const App = () => {
  return (
    <ErrorBoundary>
      {/* Lazy loading para os componentes Toaster com Suspense para capturar erros */}
      <Suspense fallback={<LoadingFallback />}>
        <Toaster />
      </Suspense>
      <Suspense fallback={<LoadingFallback />}>
        <Sonner />
      </Suspense>
      
      <ErrorBoundary>
        <AuthProvider>
          <RouterPersistence>
            <TooltipProvider>
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
                        <ErrorBoundary>
                          <Performance />
                        </ErrorBoundary>
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
                        <ErrorBoundary>
                          <TreinoDoDia />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/treino-do-dia" 
                    element={
                      <ProtectedRoute>
                        <ErrorBoundary>
                          <TreinoDoDia />
                        </ErrorBoundary>
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
            </TooltipProvider>
          </RouterPersistence>
        </AuthProvider>
      </ErrorBoundary>
    </ErrorBoundary>
  );
};

// Componente wrapper para mostrar o BottomNavbar apenas em rotas autenticadas
const AuthNavbarWrapper = () => {
  const currentPath = window.location.pathname;
  const publicRoutes = ['/login', '/forgot-password', '/reset-password'];
  
  if (publicRoutes.some(route => currentPath.startsWith(route))) {
    return null;
  }
  
  return <BottomNavbar />;
};

export default App;
