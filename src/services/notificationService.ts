
import { supabase } from '@/lib/supabase';

// Function to convert urlBase64 to Uint8Array for VAPID public key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Check if the browser supports push notifications
export const isPushNotificationSupported = () => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

// Request permission for push notifications
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isPushNotificationSupported()) {
    console.warn('Push notifications are not supported in this browser');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

// Subscribe to push notifications
export const subscribeToPushNotifications = async (atletaId?: string): Promise<boolean> => {
  if (!isPushNotificationSupported()) {
    return false;
  }

  try {
    // VAPID public key (in a real app, this would come from your server)
    const vapidPublicKey = 'BFnrHhwNKc9JZP1QVQGGKr2xSOPVk7Gg54tGg3XSuaTRxJkJ5Ch9M0Ss0u1-iBx9F1i5jJKR_ERTBwmCJbtA3BY';
    
    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;
    
    // Check if there's an existing subscription
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Create a new subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });
    }
    
    // Save subscription to Supabase
    if (subscription) {
      const subscriptionJSON = subscription.toJSON();
      
      // Store in Supabase
      const { error } = await supabase
        .from('subscriptions')
        .upsert([
          {
            atleta_id: atletaId || null,
            subscription_data: subscriptionJSON,
          }
        ], { onConflict: 'subscription_data->endpoint' });
      
      if (error) {
        console.error('Error storing push subscription:', error);
        return false;
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return false;
  }
};

// Unsubscribe from push notifications
export const unsubscribeFromPushNotifications = async (): Promise<boolean> => {
  if (!isPushNotificationSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      // Unsubscribe from push service
      const result = await subscription.unsubscribe();
      
      if (result) {
        // Remove from Supabase
        const { error } = await supabase
          .from('subscriptions')
          .delete()
          .eq('subscription_data->endpoint', subscription.endpoint);
        
        if (error) {
          console.error('Error removing push subscription from database:', error);
        }
      }
      
      return result;
    }
    
    return true;
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return false;
  }
};
