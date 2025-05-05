
import React, { ReactNode } from 'react';
import { useConsolidatedAuth } from '@/hooks/useConsolidatedAuth';
import { Navigate } from 'react-router-dom';

export interface RoleProtectedRouteProps {
  children: ReactNode;
  allowedRoles: string[];
}

/**
 * A route that only allows access to users with specific roles
 * @param children Component to render if user has appropriate role
 * @param allowedRoles Array of allowed role names
 */
const RoleProtectedRoute = ({ children, allowedRoles }: RoleProtectedRouteProps) => {
  const { user, profile, isLoading } = useConsolidatedAuth();
  
  // While loading, show nothing
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }
  
  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // If profile is loaded but user doesn't have required role, show access denied
  if (profile && !allowedRoles.includes(profile.funcao)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <h1 className="text-2xl font-bold mb-3">Acesso Restrito</h1>
        <p className="text-gray-600 mb-6">
          Você não tem permissão para acessar esta página.
          Esta área é restrita para {allowedRoles.join(', ')}.
        </p>
      </div>
    );
  }
  
  // If user role is allowed, render the children
  return <>{children}</>;
};

export default RoleProtectedRoute;
