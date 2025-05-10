import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import BottomNavbar from '@/components/BottomNavbar';
import RouterPersistence from '@/components/RouterPersistence';
// Desativado temporariamente devido a erros de servidor (recursão infinita em políticas)
// import NotificationsManager from '@/components/NotificationsManager';
import { useState, useEffect } from 'react';
import { isRunningAsPWA, isFirstVisitAfterInstall } from './services/pwaService';
import { WelcomeScreen } from './components/WelcomeScreen';
import AuthDebugger from './components/AuthDebugger';

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
import DashboardExerciciosPage from '@/pages/DashboardExerciciosPage';
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
import DBMigrationPage from '@/pages/DBMigration';

// Components
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleProtectedRoute from '@/components/RoleProtectedRoute';
import AuthRedirect from '@/components/AuthRedirect';

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

// Create a QueryClient instance for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Verifica se a aplicação está rodando como PWA
const isPWA = isRunningAsPWA();
console.log(`App rodando como PWA: ${isPWA}`);

// Roteamento para PWA vs. Navegador normal
const getInitialRoute = () => {
  if (isPWA) {
    // No PWA, verificamos se é a primeira visita após instalação
    if (isFirstVisitAfterInstall()) {
      console.log('Primeira visita após instalação do PWA');
      return '/welcome'; // Exibir tela de boas-vindas
    }
    
    // Já instalado, verificar se está logado
    const hasToken = localStorage.getItem('supabase.auth.token');
    return hasToken ? '/dashboard' : '/login';
  }
  
  // Em navegador normal, iniciar na landing page
  return '/';
};

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  
  useEffect(() => {
    // Verificar se deve mostrar tela de boas-vindas
    if (isPWA && isFirstVisitAfterInstall()) {
      setShowWelcome(true);
    }
    
    // Simular tempo de carregamento para splash screen
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Mostrar splash screen enquanto carrega
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background">
        <img 
          src="/logo.png" 
          alt="Painel GenX" 
          className="w-24 h-24 mb-4 animate-pulse" 
        />
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  // Mostrar tela de boas-vindas se necessário
  if (showWelcome) {
    return <WelcomeScreen onComplete={() => setShowWelcome(false)} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <RouterPersistence>
            {/* Desativado temporariamente devido a erros de servidor */}
            {/* <NotificationsManager /> */}
            <BottomNavbar />
            <Routes>
              <Route path="/" element={<AuthRedirect />} />
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
                path="/exercicios/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardExerciciosPage />
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
                    <RoleProtectedRoute allowedRoles={['tecnico']}>
                    <TrainingAssembly />
                    </RoleProtectedRoute>
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
                  <ProtectedRoute>
                    <EvaluationManagement />
                  </ProtectedRoute>
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
                  <RoleProtectedRoute allowedRoles={['tecnico']}>
                  <NovaAtaReuniao />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              } />
              <Route path="/atas-reuniao/dashboard" element={
                <ProtectedRoute>
                  <DashboardAtasReuniao />
                </ProtectedRoute>
              } />
              <Route path="/atas-reuniao/editar/:id" element={
                <ProtectedRoute>
                  <RoleProtectedRoute allowedRoles={['tecnico']}>
                  <NovaAtaReuniao />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              } />
              <Route path="/atas-reuniao/:id" element={
                <ProtectedRoute>
                  <AtasReuniaoDetalhePage />
                </ProtectedRoute>
              } />
              
              {/* Páginas restritas a técnicos */}
              <Route path="/historico" element={
                <ProtectedRoute>
                  <RoleProtectedRoute allowedRoles={['tecnico']}>
                    <NotFound /> {/* Placeholder até ser implementada */}
                  </RoleProtectedRoute>
                </ProtectedRoute>
              } />
              <Route path="/configuracoes" element={
                <ProtectedRoute>
                  <RoleProtectedRoute allowedRoles={['tecnico']}>
                    <NotFound /> {/* Placeholder até ser implementada */}
                  </RoleProtectedRoute>
                </ProtectedRoute>
              } />
              
              {/* Página de Migração do Banco de Dados */}
              <Route path="/admin/migracao-db" element={
                <ProtectedRoute>
                  <RoleProtectedRoute allowedRoles={['tecnico']}>
                  <DBMigrationPage />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              } />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <AuthDebugger />
            <Toaster />
          </RouterPersistence>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
