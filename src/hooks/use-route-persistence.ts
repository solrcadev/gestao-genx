import { useEffect } from 'react';
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
 * Esta versão melhorada evita redirecionamentos automáticos indesejados.
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
    
    // Não salvar rotas de login/autenticação
    if (location.pathname === '/' || 
        location.pathname.includes('/login') || 
        location.pathname.includes('/register') || 
        location.pathname.includes('/reset-password') ||
        location.pathname.includes('/forgot-password')) {
      return;
    }
    
    // Salvar a rota atual
    saveRoute(
      location.pathname,
      location.search,
      location.hash,
      location.state
    );
    
    console.log("🔖 Rota persistida pelo hook:", location.pathname);
  }, [location, shouldPersist]);
  
  // NÃO restauramos automaticamente a rota quando o foco volta para a janela
  // Isso é para evitar problemas com o fluxo de navegação normal
  
  return { 
    clearPersistedRoute: () => clearRoute(ROUTE_STORAGE_KEY),
    clearAttemptedRoute: () => clearRoute(ATTEMPTED_ROUTE_KEY),
    clearAllRoutes: clearAllRoutes,
    getPersistedRoute: () => getRoute(ROUTE_STORAGE_KEY, false),
    getAttemptedRoute: () => getRoute(ATTEMPTED_ROUTE_KEY, true), // Limpar após leitura
  };
} 