// Constantes para chaves de armazenamento
export const ROUTE_STORAGE_KEY = 'last_route';
export const ATTEMPTED_ROUTE_KEY = 'attempted_route';

// Interface para estrutura de dados de rota
export interface PersistedRoute {
  pathname: string;
  search?: string;
  hash?: string;
  state?: any;
  timestamp: number;
}

/**
 * Salva a rota atual no localStorage
 * @param pathname Caminho da rota
 * @param search Parâmetros de consulta
 * @param hash Hash da URL
 * @param state Estado da rota
 * @param key Chave para armazenamento (padrão: 'last_route')
 */
export const saveRoute = (
  pathname: string, 
  search: string = '', 
  hash: string = '', 
  state: any = null,
  key: string = ROUTE_STORAGE_KEY
): void => {
  try {
    // Não salvar rotas relacionadas a login
    if (pathname.includes('/login') || 
        pathname.includes('/register') || 
        pathname.includes('/reset-password') ||
        pathname.includes('/forgot-password')) {
      return;
    }
    
    const routeData: PersistedRoute = {
      pathname,
      search,
      hash,
      state,
      timestamp: new Date().getTime()
    };
    
    localStorage.setItem(key, JSON.stringify(routeData));
  } catch (error) {
    console.error(`Erro ao salvar rota (${key}):`, error);
  }
};

/**
 * Recupera uma rota salva do localStorage
 * @param key Chave para armazenamento (padrão: 'last_route')
 * @param clearAfterRead Se verdadeiro, remove a rota após leitura
 * @param maxAgeMs Idade máxima em milissegundos (padrão: 24 horas)
 * @returns A rota salva ou null se não existir ou for inválida
 */
export const getRoute = (
  key: string = ROUTE_STORAGE_KEY, 
  clearAfterRead: boolean = false,
  maxAgeMs: number = 24 * 60 * 60 * 1000
): PersistedRoute | null => {
  try {
    const savedRouteJSON = localStorage.getItem(key);
    if (!savedRouteJSON) return null;
    
    const savedRoute: PersistedRoute = JSON.parse(savedRouteJSON);
    
    // Verificar validade da rota (não muito antiga)
    const savedTime = savedRoute.timestamp || 0;
    const currentTime = new Date().getTime();
    
    if (currentTime - savedTime > maxAgeMs) {
      localStorage.removeItem(key);
      return null;
    }
    
    // Limpar após leitura se solicitado
    if (clearAfterRead) {
      localStorage.removeItem(key);
    }
    
    return savedRoute;
  } catch (error) {
    console.error(`Erro ao recuperar rota (${key}):`, error);
    localStorage.removeItem(key);
    return null;
  }
};

/**
 * Limpa uma rota salva
 * @param key Chave para armazenamento (padrão: 'last_route')
 */
export const clearRoute = (key: string = ROUTE_STORAGE_KEY): void => {
  localStorage.removeItem(key);
};

/**
 * Limpa todas as rotas salvas
 */
export const clearAllRoutes = (): void => {
  clearRoute(ROUTE_STORAGE_KEY);
  clearRoute(ATTEMPTED_ROUTE_KEY);
}; 