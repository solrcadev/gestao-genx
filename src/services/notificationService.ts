import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

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
    const permission = await Notification.permission;
    if (permission === 'granted') {
      return true;
    }
    
    const requestResult = await Notification.requestPermission();
    return requestResult === 'granted';
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
    console.log('Service worker is ready:', registration);
    
    // Check if there's an existing subscription
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Create a new subscription
      console.log('Creating new push subscription...');
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });
      console.log('Successfully subscribed:', subscription);
    }
    
    // Save subscription to Supabase
    if (subscription) {
      const subscriptionJSON = subscription.toJSON();
      console.log('Saving subscription to database:', subscriptionJSON);
      
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
      
      // Mostrar uma notificação de teste
      showLocalNotification(
        '🏐 Notificações Ativadas!', 
        'Você receberá atualizações sobre novas metas, atletas cadastrados e treinos do dia.'
      );
      
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

// Função para exibir notificação local (útil para testes)
export const showLocalNotification = (title: string, body: string) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, {
          body: body,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-96x96.png',
          vibrate: [100, 50, 100]
        });
      });
    } catch (error) {
      console.error('Erro ao exibir notificação local:', error);
      // Fallback para notificação nativa
      new Notification(title, {
        body: body,
        icon: '/icons/icon-192x192.png'
      });
    }
  }
};

// Função para enviar notificação quando uma meta é criada
export const sendGoalNotification = (titulo: string) => {
  showLocalNotification(
    '🎯 Nova Meta Criada!', 
    `Uma nova meta foi definida: ${titulo}`
  );
};

// Função para enviar notificação quando um atleta é cadastrado
export const sendAthleteAddedNotification = (nome: string) => {
  showLocalNotification(
    '🏐 Novo Atleta Cadastrado!', 
    `O atleta ${nome} foi adicionado à equipe.`
  );
};

// Função para enviar notificação quando um treino do dia é definido
export const sendTrainingDefinedNotification = (nome: string, data: string) => {
  showLocalNotification(
    '🏐 Treino do Dia Definido!', 
    `O treino "${nome}" foi definido para ${data}.`
  );
};
