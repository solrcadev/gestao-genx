
import { useState, useEffect } from 'react';
import { getVapidPublicKey } from '@/api/notifications/vapid-public-key';
import { sendNotification } from '@/api/notifications/send';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface UseNotificationsReturn {
  permission: NotificationPermission;
  subscription: PushSubscription | null;
  isSupported: boolean;
  isPermissionGranted: boolean;
  isLoading: boolean;
  requestPermission: () => Promise<NotificationPermission>;
  subscribe: () => Promise<PushSubscription | null>;
  unsubscribe: () => Promise<boolean>;
  setupNotifications: () => Promise<void>;
}

export const useNotifications = (): UseNotificationsReturn => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { user } = useAuth();

  // Check if notifications are supported
  const isSupported = typeof window !== 'undefined' && 
    'Notification' in window && 
    'serviceWorker' in navigator && 
    'PushManager' in window;

  // Check if permission is granted
  const isPermissionGranted = permission === 'granted';

  useEffect(() => {
    if (isSupported) {
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, [isSupported]);

  // Check if user is already subscribed
  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      setSubscription(existingSubscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  // Request notification permission
  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!isSupported) return 'denied';

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (error) {
      console.error('Error requesting permission:', error);
      return 'denied';
    }
  };

  // Subscribe to push notifications
  const subscribe = async (): Promise<PushSubscription | null> => {
    if (!isSupported || permission !== 'granted') return null;

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Get the VAPID public key
      const { publicKey } = await getVapidPublicKey();
      
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey
      });
      
      setSubscription(newSubscription);
      
      // Save subscription to database
      if (user) {
        await supabase
          .from('push_subscriptions')
          .insert([
            {
              user_id: user.id,
              subscription: JSON.stringify(newSubscription),
              created_at: new Date().toISOString()
            }
          ]);
      }
      
      return newSubscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return null;
    }
  };

  // Unsubscribe from push notifications
  const unsubscribe = async (): Promise<boolean> => {
    if (!subscription) return false;

    try {
      const success = await subscription.unsubscribe();
      
      if (success && user) {
        // Remove subscription from database
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id);
      }
      
      setSubscription(null);
      return success;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      return false;
    }
  };

  // Setup notifications (request permission and subscribe)
  const setupNotifications = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const permissionResult = await requestPermission();
      if (permissionResult === 'granted') {
        await subscribe();
      }
    } catch (error) {
      console.error('Error setting up notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return { 
    permission, 
    subscription, 
    isSupported,
    isPermissionGranted,
    isLoading,
    requestPermission, 
    subscribe, 
    unsubscribe,
    setupNotifications
  };
};

export default useNotifications;
