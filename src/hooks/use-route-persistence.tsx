
import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { saveRoute, clearRoute, ROUTE_STORAGE_KEY, ATTEMPTED_ROUTE_KEY } from '@/utils/route-persistence';

interface RouteReturnType {
  saveCurrentRoute: () => void;
  clearPersistedRoute: () => void;
  saveAttemptedRoute: (path: string, search?: string, hash?: string) => void;
}

/**
 * Hook para gerenciar a persistência de rotas
 * @param enabled Se o hook está ativado ou não
 * @returns Funções para salvar e limpar rotas persistidas
 */
export const useRoutePersistence = (enabled: boolean = true): RouteReturnType => {
  const location = useLocation();

  // Salva a rota atual no localStorage
  const saveCurrentRoute = useCallback(() => {
    if (!enabled) return;
    
    const { pathname, search, hash } = location;
    
    // Não persistir páginas relacionadas a autenticação
    if (pathname.includes('/login') || 
        pathname.includes('/register') || 
        pathname.includes('/reset-password') ||
        pathname.includes('/forgot-password')) {
      return;
    }
    
    saveRoute(pathname, search || '', hash || '');
  }, [location, enabled]);

  // Limpa a rota salva
  const clearPersistedRoute = useCallback(() => {
    clearRoute();
  }, []);

  // Salva uma rota tentada (para redirecionamento após login)
  const saveAttemptedRoute = useCallback((path: string, search: string = '', hash: string = '') => {
    if (!enabled) return;
    
    saveRoute(path, search, hash, undefined, ATTEMPTED_ROUTE_KEY);
  }, [enabled]);

  // Salvar a rota atual quando a localização muda
  useEffect(() => {
    if (enabled) {
      saveCurrentRoute();
    }
  }, [location.pathname, enabled, saveCurrentRoute]);

  return {
    saveCurrentRoute,
    clearPersistedRoute,
    saveAttemptedRoute
  };
};
