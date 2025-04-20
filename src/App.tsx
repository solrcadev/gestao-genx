
import { Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import BottomNavbar from '@/components/BottomNavbar';
import RouterPersistence from '@/components/RouterPersistence';
import { NotificationsManager } from '@/components/NotificationsManager';

// Context Providers
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

// Components
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleProtectedRoute from '@/components/RoleProtectedRoute';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
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

            <Route 
              path="/mais" 
              element={
                <ProtectedRoute>
                  <More />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/ciclos" 
              element={
                <ProtectedRoute>
                  <Ciclos />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/notificacoes" 
              element={
                <ProtectedRoute>
                  <NotificationSettings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/metas" 
              element={
                <ProtectedRoute>
                  <MetasEvolucao />
                </ProtectedRoute>
              } 
            />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </RouterPersistence>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
