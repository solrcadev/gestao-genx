
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

// Simplified notification hook for Lovable
export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return;
    }

    // Initialize permission state
    setPermission(Notification.permission);
  }, []);

  // Request permission for notifications
  const requestPermission = async () => {
    try {
      if (!('Notification' in window)) {
        throw new Error('Notifications not supported');
      }

      const permission = await Notification.requestPermission();
      setPermission(permission);
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied' as NotificationPermission;
    }
  };

  // Subscribe to push notifications
  const subscribe = async () => {
    try {
      // Request permission if not granted
      if (permission !== 'granted') {
        const newPermission = await requestPermission();
        if (newPermission !== 'granted') {
          throw new Error('Notification permission not granted');
        }
      }

      // Get service worker registration
      if (!('serviceWorker' in navigator)) {
        throw new Error('Service workers not supported');
      }

      const registration = await navigator.serviceWorker.ready;
      
      // Get existing subscription or create a new one
      let pushSubscription = await registration.pushManager.getSubscription();
      
      if (!pushSubscription) {
        // In a real app, we would fetch the VAPID public key from the server
        // For now, use a dummy key to make TypeScript happy
        const vapidPublicKey = 'dummy-key-for-development';
        
        // Create a new subscription
        pushSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidPublicKey
        });
      }

      setSubscription(pushSubscription);
      
      // Here we would send the subscription to the server
      console.log('Subscription:', pushSubscription);
      
      toast({
        title: 'Notificações ativadas',
        description: 'Você receberá notificações importantes sobre treinos e eventos.'
      });
      
      return pushSubscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      
      toast({
        title: 'Erro ao ativar notificações',
        description: 'Não foi possível ativar as notificações. Verifique as permissões do navegador.',
        variant: 'destructive'
      });
      
      return null;
    }
  };

  // Unsubscribe from push notifications
  const unsubscribe = async () => {
    try {
      if (!subscription) {
        return true;
      }
      
      const result = await subscription.unsubscribe();
      
      if (result) {
        setSubscription(null);
        
        toast({
          title: 'Notificações desativadas',
          description: 'Você não receberá mais notificações deste site.'
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  };

  return {
    permission,
    subscription,
    requestPermission,
    subscribe,
    unsubscribe
  };
}
