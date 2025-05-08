/**
 * Hook simplificado de notificações que retorna dados vazios
 * para evitar erros de servidor.
 * 
 * NOTA: Este é um fallback temporário enquanto o problema de
 * recursão infinita no Supabase é resolvido.
 */
export function useNotifications() {
  // Retornando dados vazios e nenhuma chamada ao servidor
  return { 
    notifications: [], 
    loading: false, 
    error: null, 
    sendNotification: async () => true 
  };
}
