import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import BottomNavbar from '@/components/BottomNavbar';
import RouterPersistence from '@/components/RouterPersistence';
import NotificationsManager from '@/components/NotificationsManager';
import { useState, useEffect } from 'react';
import { isRunningAsPWA, isFirstVisitAfterInstall } from './services/pwaService';
import { WelcomeScreen } from './components/WelcomeScreen';

// Import BrowserRouter separately to avoid nesting issues
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Pages
import Index from '@/pages/Index';
import LoginPage from '@/pages/LoginPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import Dashboard from '@/pages/Dashboard';
import Athletes from '@/pages/Athletes';
import AthleteDetails from '@/pages/AthleteDetails';
import Exercises from '@/pages/Exercises';
import Trainings from '@/pages/Trainings';
import TrainingAssembly from '@/pages/TrainingAssembly';
import TreinoDosDia from '@/pages/TreinoDosDia';
import AttendanceManagement from '@/pages/AttendanceManagement';
import Performance from '@/pages/Performance';
import EvaluationManagement from '@/pages/EvaluationManagement';
import StudentPerformance from '@/pages/StudentPerformance';
import NotFound from '@/pages/NotFound';
import More from '@/pages/More';
import Ciclos from './pages/Ciclos';
import NotificationSettings from './pages/NotificationSettings';
import MetasEvolucao from './pages/MetasEvolucao';
import AvaliacaoQualitativa from '@/pages/AvaliacaoQualitativa';

// Components
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleProtectedRoute from '@/components/RoleProtectedRoute';

// Atas de Reunião 
import AtasReuniao from './app/atas-reuniao/page';
import NovaAtaReuniao from './app/atas-reuniao/nova/page';
import DashboardAtasReuniao from './app/atas-reuniao/dashboard/page';
import { useParams } from 'react-router-dom';
import AtasReuniaoDetalhe from './app/atas-reuniao/[id]/page';

// Componente wrapper para lidar com os parâmetros da rota
const AtasReuniaoDetalhePage = () => {
  const params = useParams();
  return <AtasReuniaoDetalhe />;
};

const queryClient = new QueryClient();

// SplashScreen component
const SplashScreen = () => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-primary z-50">
      <img
        src="/icons/icon-512x512.png"
        alt="GEN X Logo"
        className="w-32 h-32 mb-6 animate-pulse"
      />
      <h1 className="text-2xl font-bold text-white mb-2">GEN X</h1>
      <p className="text-white/80 text-sm">Painel de Gestão</p>
      <div className="mt-8 w-48 h-1 bg-gray-700 rounded-full overflow-hidden">
        <div className="h-full bg-white animate-[loading_1.5s_ease-in-out_infinite]"></div>
      </div>
    </div>
  );
};

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const isPWA = isRunningAsPWA();
  
  useEffect(() => {
    // Verificar se é a primeira visita após instalação
    if (isFirstVisitAfterInstall()) {
      setShowWelcome(true);
    }
    
    // Simular carregamento para mostrar a tela de splash por alguns segundos
    // Mais tempo se for PWA para melhor experiência de "app"
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, isPWA ? 2500 : 1000);
    
    return () => clearTimeout(timeout);
  }, [isPWA]);

  if (isLoading && isPWA) {
    return <SplashScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* Keep AuthProvider inside BrowserRouter to ensure useNavigate works properly */}
        <AuthProvider>
          <RouterPersistence>
            <NotificationsManager />
            <BottomNavbar />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              {/* Protected Routes */}
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
                path="/aluno/:studentId"
                element={
                  <ProtectedRoute>
                    <AthleteDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/aluno/:studentId/performance"
                element={
                  <ProtectedRoute>
                    <StudentPerformance />
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
                path="/treinos"
                element={
                  <ProtectedRoute>
                    <Trainings />
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
                path="/treino-do-dia"
                element={
                  <ProtectedRoute>
                    <TreinoDosDia />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/presenca"
                element={
                  <ProtectedRoute>
                    <AttendanceManagement />
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
                path="/gerenciar-avaliacoes"
                element={
                  <RoleProtectedRoute allowedRoles={['admin', 'coach']}>
                    <EvaluationManagement />
                  </RoleProtectedRoute>
                }
              />

              <Route path="/mais" element={
                <ProtectedRoute>
                  <More />
                </ProtectedRoute>
              } />
              <Route path="/ciclos" element={
                <ProtectedRoute>
                  <Ciclos />
                </ProtectedRoute>
              } />
              <Route path="/notificacoes" element={
                <ProtectedRoute>
                  <NotificationSettings />
                </ProtectedRoute>
              } />
              <Route path="/metas" element={
                <ProtectedRoute>
                  <MetasEvolucao />
                </ProtectedRoute>
              } />
              
              {/* Avaliação Qualitativa */}
              <Route path="/avaliacao-qualitativa" element={
                <ProtectedRoute>
                  <AvaliacaoQualitativa />
                </ProtectedRoute>
              } />
              
              {/* Rotas para Atas de Reunião */}
              <Route path="/atas-reuniao" element={
                <ProtectedRoute>
                  <AtasReuniao />
                </ProtectedRoute>
              } />
              <Route path="/atas-reuniao/nova" element={
                <ProtectedRoute>
                  <NovaAtaReuniao />
                </ProtectedRoute>
              } />
              <Route path="/atas-reuniao/dashboard" element={
                <ProtectedRoute>
                  <DashboardAtasReuniao />
                </ProtectedRoute>
              } />
              <Route path="/atas-reuniao/editar/:id" element={
                <ProtectedRoute>
                  <NovaAtaReuniao />
                </ProtectedRoute>
              } />
              <Route path="/atas-reuniao/:id" element={
                <ProtectedRoute>
                  <AtasReuniaoDetalhePage />
                </ProtectedRoute>
              } />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
            {showWelcome && <WelcomeScreen onClose={() => setShowWelcome(false)} />}
          </RouterPersistence>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
