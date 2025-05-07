
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
  const { user, loading } = useAuth();
  const location = useLocation();
  const { clearPersistedRoute, saveCurrentRoute } = useRoutePersistence(!loading);
  
  // Limpar rota salva quando o usuário faz logout
  useEffect(() => {
    if (user === null && !loading) {
      clearPersistedRoute();
    }
  }, [user, loading, clearPersistedRoute]);

  // Salvar rota atual em mudanças específicas
  useEffect(() => {
    if (user && !loading) {
      saveCurrentRoute();
    }
  }, [location.pathname, user, loading, saveCurrentRoute]);
  
  return <>{children}</>;
};

export default RouterPersistence;
