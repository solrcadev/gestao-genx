
import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";
import { saveRoute, ATTEMPTED_ROUTE_KEY } from "@/utils/route-persistence";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Salvar a rota tentada quando o usuário não está autenticado
  useEffect(() => {
    if (!loading && !user) {
      // Não salvar rotas relacionadas ao login/autenticação
      if (!location.pathname.includes('/login') && 
          !location.pathname.includes('/register') && 
          !location.pathname.includes('/reset-password') &&
          !location.pathname.includes('/forgot-password')) {
        
        // Utilizamos o utilitário de rotas para salvar a rota tentada
        saveRoute(
          location.pathname,
          location.search,
          location.hash,
          location.state,
          ATTEMPTED_ROUTE_KEY
        );
        
        console.log("Rota tentada salva:", location.pathname);
      }
    }
  }, [user, loading, location]);

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
    // A rota já foi salva no useEffect acima
    return <Navigate to="/login" replace />;
  }

  // Renderizar a rota protegida se estiver autenticado
  return <>{children}</>;
};

export default ProtectedRoute;
