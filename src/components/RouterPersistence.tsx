import React, { useEffect } from 'react';
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
  const { session, loading } = useAuth();
  const { clearPersistedRoute } = useRoutePersistence(!loading);
  
  // Limpar rota salva quando o usuário faz logout
  useEffect(() => {
    if (session === null && !loading) {
      clearPersistedRoute();
    }
  }, [session, loading, clearPersistedRoute]);
  
  return <>{children}</>;
};

export default RouterPersistence; 