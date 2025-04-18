
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from './use-toast';

export interface UseNotificationsReturn {
  isSupported: boolean;
  isPermissionGranted: boolean;
  isLoading: boolean;
  setupNotifications: () => Promise<boolean>;
  error: Error | null;
}

export const useNotifications = (): UseNotificationsReturn => {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isPermissionGranted, setIsPermissionGranted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Check if notifications are supported and permission status
  useEffect(() => {
    const checkSupport = async () => {
      // Check if the browser supports notifications
      if (!('Notification' in window)) {
        setIsSupported(false);
        return;
      }

      setIsSupported(true);

      // Check if service worker is registered and available
      if (!('serviceWorker' in navigator)) {
        console.warn('Service Worker not supported in this browser');
        return;
      }

      // Check current permission status
      setIsPermissionGranted(Notification.permission === 'granted');
    };

    checkSupport();
  }, []);

  // Function to setup notifications
  const setupNotifications = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !user) return false;

    setIsLoading(true);
    setError(null);

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setIsPermissionGranted(granted);

      if (!granted) {
        toast({
          title: "Permissão negada",
          description: "Você precisa permitir as notificações para receber alertas.",
          variant: "destructive",
        });
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      
      // Get push subscription
      let subscription = await registration.pushManager.getSubscription();

      // If no subscription exists, create one
      if (!subscription) {
        try {
          // Get VAPID public key from the server
          const response = await fetch('/api/notifications/vapid-public-key');
          const { publicKey } = await response.json();

          // Subscribe the user
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: publicKey
          });
        } catch (error) {
          console.error('Error during push subscription:', error);
          throw new Error('Falha ao configurar a assinatura de notificações.');
        }
      }

      // Save subscription to database
      const { error: saveError } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          subscription: JSON.stringify(subscription),
          created_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (saveError) {
        throw new Error('Erro ao salvar assinatura no banco de dados.');
      }

      toast({
        title: "Notificações ativadas",
        description: "Você receberá notificações de eventos importantes.",
      });

      return true;
    } catch (err) {
      console.error('Error setting up notifications:', err);
      setError(err instanceof Error ? err : new Error('Erro ao configurar notificações'));
      
      toast({
        title: "Erro na configuração",
        description: err instanceof Error ? err.message : "Falha ao configurar notificações",
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, user, toast]);

  return {
    isSupported,
    isPermissionGranted,
    isLoading,
    setupNotifications,
    error
  };
};
