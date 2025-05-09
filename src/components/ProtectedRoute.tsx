
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Mostrar tela de carregamento enquanto verifica autenticação
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Redirecionar para login se não estiver autenticado
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Renderizar a rota protegida se estiver autenticado
  return <>{children}</>;
};

export default ProtectedRoute;
