import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

type RoleProtectedRouteProps = {
  /**
   * Os papéis que têm permissão para acessar esta rota.
   * Por padrão, apenas técnicos podem acessar.
   */
  allowedRoles?: string[];
  
  /**
   * Rota para redirecionar quando o usuário não tem permissão.
   * Por padrão, redireciona para o dashboard.
   */
  redirectTo?: string;
  
  /**
   * Conteúdo da rota a ser renderizado quando o usuário tem permissão.
   */
  children: React.ReactNode;
};

/**
 * Componente para proteger rotas com base no papel do usuário.
 * Se o usuário não tiver o papel necessário, será redirecionado.
 */
const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  allowedRoles = ['tecnico'],
  redirectTo = '/dashboard',
  children
}) => {
  const { userRole, session } = useAuth();
  
  // Se o usuário não estiver autenticado, não faça nada
  // (isso será tratado pelo ProtectedRoute existente)
  if (!session) {
    return <>{children}</>;
  }
  
  // Técnicos sempre têm acesso completo
  if (userRole === 'tecnico') {
    return <>{children}</>;
  }
  
  // Verificar se o usuário tem um dos papéis permitidos
  const hasAccess = userRole && allowedRoles.includes(userRole);
  
  // Se não tiver acesso, redirecionar
  if (!hasAccess) {
    console.warn(`Acesso negado para usuário com papel '${userRole}'. Redirecionando para ${redirectTo}`);
    return <Navigate to={redirectTo} replace />;
  }
  
  return <>{children}</>;
};

export default RoleProtectedRoute; 