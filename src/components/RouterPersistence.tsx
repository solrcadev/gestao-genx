
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useRoutePersistence } from '@/hooks/use-route-persistence';
import { useAuth } from '@/contexts/AuthContext';

interface RouterPersistenceProps {
  children: React.ReactNode;
}

/**
 * Componente que gerencia a persistência da rota do usuário
 * em toda a aplicação.
 * 
 * Este componente deve ser colocado dentro do Router, mas fora
 * das rotas protegidas para garantir que funcione corretamente.
 */
const RouterPersistence: React.FC<RouterPersistenceProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const { 
    clearPersistedRoute, 
    getPersistedRoute,
    clearAttemptedRoute,
    clearAllRoutes,
    getAttemptedRoute
  } = useRoutePersistence(!isLoading);
  
  // Limpar rota salva quando o usuário faz logout
  useEffect(() => {
    if (user === null && !isLoading) {
      clearPersistedRoute();
    }
  }, [user, isLoading, clearPersistedRoute]);

  // Salvar rota atual em mudanças específicas
  useEffect(() => {
    // A persistência de rotas agora será feita internamente pelo hook useRoutePersistence
    // que já observa as mudanças de localização
  }, [location.pathname, user, isLoading]);
  
  return <>{children}</>;
};

export default RouterPersistence;
