
import { useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ROUTE_STORAGE_KEY, 
  ATTEMPTED_ROUTE_KEY, 
  saveRoute, 
  getRoute, 
  clearRoute,
  clearAllRoutes
} from '@/utils/route-persistence';

/**
 * Hook para persistir a rota atual e restaurá-la quando o usuário retorna
 * ao aplicativo após alternar abas ou minimizar.
 * 
 * Este hook salva a rota atual no localStorage e permite restaurá-la
 * quando necessário.
 * 
 * @param shouldPersist Booleano que indica se o hook deve persistir rotas
 * @returns Um objeto com métodos para gerenciar rotas persistidas
 */
export function useRoutePersistence(shouldPersist = true) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Salvar a rota atual no localStorage
  useEffect(() => {
    if (!shouldPersist) return;
    
    // Não persistir páginas relacionadas a autenticação
    if (location.pathname.includes('/login') || 
        location.pathname.includes('/register') || 
        location.pathname.includes('/reset-password') ||
        location.pathname.includes('/forgot-password')) {
      return;
    }

    // Delegamos para o utilitário a verificação de rotas de login
    saveRoute(
      location.pathname,
      location.search,
      location.hash,
      location.state
    );
  }, [location, shouldPersist]);
  
  // Restaurar a rota quando o foco volta para a janela
  useEffect(() => {
    if (!shouldPersist) return;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        tryRestoreRoute();
      }
    };
    
    const handleFocus = () => {
      tryRestoreRoute();
    };
    
    const tryRestoreRoute = () => {
      // Não restaurar se estivermos na página de login
      if (location.pathname.includes('/login') || 
          location.pathname.includes('/register') || 
          location.pathname.includes('/reset-password') ||
          location.pathname.includes('/forgot-password')) {
        return;
      }
      
      // Tentativa de restaurar a última rota
      const savedRoute = getRoute(ROUTE_STORAGE_KEY);
      if (!savedRoute) return;
      
      // Não restaurar se já estivermos na rota salva
      if (savedRoute.pathname === location.pathname) return;
      
      // Navegar para a rota salva
      console.log('Restaurando para a rota:', savedRoute.pathname);
      navigate(savedRoute.pathname + (savedRoute.search || ''));
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [navigate, location.pathname, shouldPersist]);
  
  return { 
    clearPersistedRoute: () => clearRoute(ROUTE_STORAGE_KEY),
    clearAttemptedRoute: () => clearRoute(ATTEMPTED_ROUTE_KEY),
    clearAllRoutes: clearAllRoutes,
    getPersistedRoute: () => getRoute(ROUTE_STORAGE_KEY, false),
    getAttemptedRoute: () => getRoute(ATTEMPTED_ROUTE_KEY, true), // Limpar após leitura
  };
} 
