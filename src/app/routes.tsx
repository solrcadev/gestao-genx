import { Home } from '@/pages/Home';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Dashboard } from '@/pages/Dashboard';
import { ForgotPassword } from '@/pages/ForgotPassword';
import { ResetPassword } from '@/pages/ResetPassword';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import AvaliacaoFisica from '@/pages/AvaliacaoFisica';
import TreinoDoDia from '@/pages/TreinoDoDia';
import Atletas from '@/pages/Atletas';
import Performance from '@/pages/Performance';
import EvaluationManagement from '@/pages/EvaluationManagement';
import MonitorManagement from '@/pages/MonitorManagement';
import Presenca from '@/pages/Presenca';

export const appRoutes = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/avaliacao-fisica",
    element: (
      <ProtectedRoute>
        <AvaliacaoFisica />
      </ProtectedRoute>
    ),
  },
  {
    path: "/treino-do-dia",
    element: (
      <ProtectedRoute>
        <TreinoDoDia />
      </ProtectedRoute>
    ),
  },
  {
    path: "/atletas",
    element: (
      <ProtectedRoute>
        <Atletas />
      </ProtectedRoute>
    ),
  },
  {
    path: "/performance",
    element: (
      <ProtectedRoute>
        <Performance />
      </ProtectedRoute>
    ),
  },
  {
    path: "/evaluation-management",
    element: (
      <ProtectedRoute>
        <EvaluationManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: "/monitor-management",
    element: (
      <ProtectedRoute>
        <MonitorManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: "/presenca",
    element: (
      <ProtectedRoute>
        <Presenca />
      </ProtectedRoute>
    ),
  },
];
