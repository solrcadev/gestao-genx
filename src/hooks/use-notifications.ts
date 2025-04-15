
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  isPushNotificationSupported, 
  requestNotificationPermission, 
  subscribeToPushNotifications,
} from '@/services/notificationService';

export function useNotifications() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isPermissionGranted, setIsPermissionGranted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Check if notifications are supported
  useEffect(() => {
    setIsSupported(isPushNotificationSupported());
  }, []);
  
  // Check permission status on mount
  useEffect(() => {
    const checkPermission = async () => {
      if (isPushNotificationSupported()) {
        setIsPermissionGranted(Notification.permission === 'granted');
      }
    };
    
    checkPermission();
  }, []);
  
  // Function to request permission and subscribe to notifications
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
      // Request permission
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
      
      // Subscribe to push notifications
      const subscribed = await subscribeToPushNotifications(atletaId);
      
      if (subscribed) {
        toast({
          title: "Notificações ativadas",
          description: "Você receberá notificações sobre novas metas e eventos.",
        });
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
