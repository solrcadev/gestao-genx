
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  isPushNotificationSupported, 
  requestNotificationPermission, 
  subscribeToPushNotifications,
  showLocalNotification
} from '@/services/notificationService';

export function useNotifications() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isPermissionGranted, setIsPermissionGranted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Verificar se as notificações são suportadas
  useEffect(() => {
    const supported = isPushNotificationSupported();
    setIsSupported(supported);
    
    // Verificar o status da permissão
    if (supported) {
      setIsPermissionGranted(Notification.permission === 'granted');
    }
    
    // Registrar o service worker se ainda não estiver registrado
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        console.log('Service Worker está pronto:', registration);
      });
    }
  }, []);
  
  // Função para solicitar permissão e se inscrever nas notificações
  const setupNotifications = async (atletaId?: string) => {
    if (!isPushNotificationSupported()) {
      toast({
        title: "Notificações não suportadas",
        description: "Seu navegador não suporta notificações push.",
        variant: "destructive",
      });
      return false;
    }
    
    setIsLoading(true);
    
    try {
      // Solicitar permissão
      console.log("Solicitando permissão para notificações...");
      const permissionGranted = await requestNotificationPermission();
      setIsPermissionGranted(permissionGranted);
      
      if (!permissionGranted) {
        toast({
          title: "Permissão negada",
          description: "Você não permitiu notificações para este app.",
          variant: "destructive",
        });
        setIsLoading(false);
        return false;
      }
      
      console.log("Permissão concedida, inscrevendo nas notificações push...");
      
      // Inscrever-se nas notificações push
      const subscribed = atletaId 
        ? await subscribeToPushNotifications(atletaId)
        : await subscribeToPushNotifications();
      
      if (subscribed) {
        toast({
          title: "Notificações ativadas",
          description: "Você receberá notificações sobre novas metas, atletas e treinos.",
        });
        
        // Mostrar uma notificação de teste
        console.log("Mostrando notificação de teste...");
        showLocalNotification(
          "🏐 Notificações Ativadas!", 
          "Você receberá atualizações sobre novas metas, atletas cadastrados e treinos do dia."
        );
      } else {
        toast({
          title: "Erro ao ativar notificações",
          description: "Não foi possível configurar as notificações. Tente novamente.",
          variant: "destructive",
        });
      }
      
      setIsLoading(false);
      return subscribed;
    } catch (error) {
      console.error("Error setting up notifications:", error);
      toast({
        title: "Erro ao configurar notificações",
        description: "Ocorreu um problema ao configurar as notificações.",
        variant: "destructive",
      });
      setIsLoading(false);
      return false;
    }
  };
  
  return {
    isSupported,
    isPermissionGranted,
    isLoading,
    setupNotifications,
  };
}
