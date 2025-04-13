import { useEffect, useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { syncLocalStorageWithDatabase } from '@/services/syncService';
import { useAuth } from '@/contexts/AuthContext';

interface AutoSyncProps {
  intervalMinutes?: number;
  showToasts?: boolean;
}

const AutoSync = ({ 
  intervalMinutes = 5, 
  showToasts = false 
}: AutoSyncProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    if (!user) return;

    // Função para realizar a sincronização
    const syncData = async () => {
      try {
        await syncLocalStorageWithDatabase();
        setLastSync(new Date());
        
        if (showToasts) {
          toast({
            title: "Sincronização concluída",
            description: "Os dados foram sincronizados com sucesso.",
          });
        }
      } catch (error) {
        console.error("Erro na sincronização automática:", error);
        
        if (showToasts) {
          toast({
            title: "Erro na sincronização",
            description: "Não foi possível sincronizar os dados.",
            variant: "destructive",
          });
        }
      }
    };

    // Executar a sincronização imediatamente ao montar o componente
    syncData();

    // Configurar o intervalo de sincronização
    const intervalId = setInterval(() => {
      syncData();
    }, intervalMinutes * 60 * 1000);

    // Limpar o intervalo quando o componente for desmontado
    return () => clearInterval(intervalId);
  }, [user, intervalMinutes, showToasts, toast]);

  return null; // Este componente não renderiza nada visualmente
};

export default AutoSync; 