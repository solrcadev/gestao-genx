import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

// Tipos para notificações
export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    url?: string;
    type?: string;
    [key: string]: any;
  };
  actions?: Array<{
    action: string;
    title: string;
  }>;
  silent?: boolean;
  requireInteraction?: boolean;
}

// Function to convert urlBase64 to Uint8Array for VAPID public key
function urlBase64ToUint8Array(base64String: string) {
  console.log('Convertendo VAPID key para Uint8Array');
  try {
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
  } catch (error) {
    console.error('Erro ao converter VAPID key:', error);
    throw error;
  }
}

// Check if the browser supports push notifications
export const isPushNotificationSupported = () => {
  const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
  console.log('Push notifications são suportadas?', isSupported);
  return isSupported;
};

// Request permission for push notifications
export const requestNotificationPermission = async (): Promise<boolean> => {
  console.log('Solicitando permissão para notificações...');
  
  if (!isPushNotificationSupported()) {
    console.warn('Push notifications não são suportadas neste navegador');
    toast({
      title: "Notificações não suportadas",
      description: "Seu navegador não suporta notificações push.",
      variant: "destructive"
    });
    return false;
  }

  try {
    const permission = await Notification.permission;
    console.log('Status atual da permissão:', permission);
    
    if (permission === 'granted') {
      console.log('Permissão já concedida anteriormente');
      return true;
    }
    
    if (permission === 'denied') {
      console.warn('Permissão para notificações foi negada anteriormente');
      toast({
        title: "Permissão bloqueada",
        description: "Notificações estão bloqueadas nas configurações do navegador.",
        variant: "destructive"
      });
      return false;
    }
    
    const requestResult = await Notification.requestPermission();
    console.log('Resultado da solicitação de permissão:', requestResult);
    
    if (requestResult === 'granted') {
      toast({
        title: "Notificações ativadas",
        description: "Você receberá notificações importantes do GEN X.",
        variant: "default"
      });
    } else {
      toast({
        title: "Notificações desativadas",
        description: "Você não receberá atualizações automáticas.",
        variant: "destructive"
      });
    }
    
    return requestResult === 'granted';
  } catch (error) {
    console.error('Erro ao solicitar permissão para notificações:', error);
    toast({
      title: "Erro",
      description: "Não foi possível configurar as notificações.",
      variant: "destructive"
    });
    return false;
  }
};

// Obter a chave pública VAPID do servidor
export const getVapidPublicKey = async (): Promise<string> => {
  try {
    // Usar URL absoluta
    const apiUrl = window.location.origin + '/api/notifications/vapid-public-key';
    console.log('Buscando VAPID public key de:', apiUrl);
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Erro ao obter VAPID public key: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('VAPID public key obtida com sucesso');
    
    return data.key;
  } catch (error) {
    console.error('Erro ao buscar VAPID public key:', error);
    // Usar a chave do .env público como fallback
    const fallbackKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (fallbackKey) {
      console.log('Usando VAPID public key de fallback');
      return fallbackKey;
    }
    throw error;
  }
};

// Subscribe to push notifications
export const subscribeToPushNotifications = async (atletaId?: string, userRole?: string): Promise<boolean> => {
  console.log('Iniciando inscrição em notificações push...', { atletaId, userRole });
  
  if (!isPushNotificationSupported()) {
    console.warn('Push notifications não são suportadas');
    return false;
  }

  try {
    // Verificar permissão primeiro
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.warn('Permissão para notificações não concedida');
      return false;
    }
    
    // Obter VAPID public key
    const vapidPublicKey = await getVapidPublicKey();
    console.log('VAPID key obtida, inscrevendo usuário...');
    
    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;
    console.log('Service worker está pronto:', registration);
    
    // Check if there's an existing subscription
    let subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      console.log('Subscription existente encontrada:', subscription.endpoint);
    } else {
      // Create a new subscription
      console.log('Criando nova subscription...');
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });
      console.log('Nova subscription criada com sucesso');
    }
    
    // Save subscription to Supabase
    if (subscription) {
      const subscriptionJSON = subscription.toJSON();
      console.log('Salvando subscription no Supabase:', subscriptionJSON);
      
      // Store in Supabase
      const { error } = await supabase
        .from('notificacoes_subscriptions')
        .upsert([
          {
            atleta_id: atletaId || null,
            user_role: userRole || 'atleta',
            endpoint: subscriptionJSON.endpoint,
            subscription_data: subscriptionJSON,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            device_info: {
              userAgent: navigator.userAgent,
              platform: navigator.platform,
              language: navigator.language
            }
          }
        ], { onConflict: 'endpoint' });
      
      if (error) {
        console.error('Erro ao salvar subscription no Supabase:', error);
        toast({
          title: "Erro ao ativar notificações",
          description: "Não foi possível salvar suas preferências.",
          variant: "destructive"
        });
        return false;
      }
      
      // Mostrar uma notificação de teste
      showLocalNotification({
        title: '🏐 Notificações Ativadas!', 
        body: 'Você receberá atualizações sobre metas, treinos e eventos importantes.',
        tag: 'welcome'
      });
      
      console.log('Subscription salva com sucesso');
      toast({
        title: "Notificações ativadas",
        description: "Você receberá atualizações importantes do GEN X.",
        variant: "default"
      });
      
      return true;
    }
    
    console.warn('Nenhuma subscription foi criada');
    return false;
  } catch (error) {
    console.error('Erro ao inscrever-se para notificações push:', error);
    toast({
      title: "Erro ao ativar notificações",
      description: error instanceof Error ? error.message : "Erro desconhecido",
      variant: "destructive"
    });
    return false;
  }
};

// Unsubscribe from push notifications
export const unsubscribeFromPushNotifications = async (): Promise<boolean> => {
  console.log('Cancelando inscrição em notificações push...');
  
  if (!isPushNotificationSupported()) {
    console.warn('Push notifications não são suportadas');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      console.log('Subscription encontrada, cancelando...', subscription.endpoint);
      
      // Unsubscribe from push service
      const result = await subscription.unsubscribe();
      console.log('Unsubscribe realizado:', result);
      
      if (result) {
        // Remove from Supabase
        const { error } = await supabase
          .from('notificacoes_subscriptions')
          .delete()
          .eq('endpoint', subscription.endpoint);
        
        if (error) {
          console.error('Erro ao remover subscription do Supabase:', error);
        } else {
          console.log('Subscription removida do Supabase com sucesso');
        }
      }
      
      toast({
        title: "Notificações desativadas",
        description: "Você não receberá mais notificações do GEN X.",
        variant: "default"
      });
      
      return result;
    }
    
    console.log('Nenhuma subscription ativa encontrada');
    return true;
  } catch (error) {
    console.error('Erro ao cancelar inscrição em notificações push:', error);
    toast({
      title: "Erro ao desativar notificações",
      description: error instanceof Error ? error.message : "Erro desconhecido",
      variant: "destructive"
    });
    return false;
  }
};

// Função para exibir notificação local (útil para testes)
export const showLocalNotification = (options: NotificationPayload) => {
  console.log('Exibindo notificação local:', options);
  
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(options.title, {
          body: options.body,
          icon: options.icon || '/icons/icon-192x192.png',
          badge: options.badge || '/icons/badge-96x96.png',
          tag: options.tag,
          data: options.data || {},
          requireInteraction: options.requireInteraction || false,
          silent: options.silent || false
        });
      });
    } catch (error) {
      console.error('Erro ao exibir notificação local:', error);
      // Fallback para notificação nativa
      try {
        new Notification(options.title, {
          body: options.body,
          icon: options.icon || '/icons/icon-192x192.png'
        });
      } catch (fallbackError) {
        console.error('Erro no fallback de notificação:', fallbackError);
      }
    }
  } else {
    console.warn('Notificações não estão habilitadas ou permitidas');
  }
};

// Enviar notificação para atleta específico via API
export const sendNotificationToAthlete = async (
  atletaId: string,
  notification: NotificationPayload
): Promise<boolean> => {
  console.log(`Enviando notificação para atleta ${atletaId}:`, notification);
  
  try {
    // Verificar que temos um athleteId válido
    if (!atletaId) {
      console.error('ID de atleta não especificado');
      return false;
    }

    // URL absoluta para evitar problemas de caminho relativo
    const apiUrl = window.location.origin + '/api/notifications/send';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        targetType: 'athlete',
        targetId: atletaId,
        notification
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erro na resposta da API: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Erro: ${response.status} ${response.statusText}`);
    }

    let result;
    try {
      result = await response.json();
    } catch (jsonError) {
      console.error('Erro ao analisar resposta JSON:', await response.text());
      throw new Error('Resposta da API não é um JSON válido');
    }
    
    console.log('Notificação enviada com sucesso:', result);
    return true;
  } catch (error) {
    console.error('Erro ao enviar notificação para atleta:', error);
    return false;
  }
};

// Enviar notificação para todos os atletas de uma equipe
export const sendNotificationToTeam = async (
  teamId: string,
  notification: NotificationPayload
): Promise<boolean> => {
  console.log(`Enviando notificação para equipe ${teamId}:`, notification);
  
  try {
    const response = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        targetType: 'team',
        targetId: teamId,
        notification
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Notificação enviada com sucesso para a equipe:', result);
    return true;
  } catch (error) {
    console.error('Erro ao enviar notificação para equipe:', error);
    return false;
  }
};

// Enviar notificação para todos os usuários (broadcast)
export const sendBroadcastNotification = async (
  notification: NotificationPayload
): Promise<boolean> => {
  console.log('Enviando notificação em broadcast:', notification);
  
  try {
    const response = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        targetType: 'broadcast',
        notification
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Broadcast enviado com sucesso:', result);
    return true;
  } catch (error) {
    console.error('Erro ao enviar broadcast:', error);
    return false;
  }
};

// Função para enviar notificação quando uma meta é criada
export const sendGoalNotification = async (atletaId: string, titulo: string, detalhes?: string) => {
  console.log(`Enviando notificação de meta para ${atletaId}: ${titulo}`);
  
  const notification: NotificationPayload = {
    title: '🎯 Nova Meta Criada!',
    body: `Uma nova meta foi definida: ${titulo}${detalhes ? `\n${detalhes}` : ''}`,
    tag: 'goal',
    data: {
      type: 'goal',
      goalTitle: titulo,
      url: '/metas'
    },
    requireInteraction: true
  };

  // Mostra localmente e também envia via API
  showLocalNotification(notification);
  return sendNotificationToAthlete(atletaId, notification);
};

// Função para enviar notificação quando um treino do dia é definido
export const sendTrainingDefinedNotification = async (
  teamId: string,
  nome: string,
  data: string,
  local?: string
) => {
  console.log(`Enviando notificação de treino definido para equipe ${teamId}: ${nome} em ${data}`);
  
  const notification: NotificationPayload = {
    title: '🏐 Treino do Dia Definido!',
    body: `O treino "${nome}" foi definido para ${data}${local ? ` em ${local}` : ''}`,
    tag: 'training',
    data: {
      type: 'training',
      trainingName: nome,
      trainingDate: data,
      url: '/treino-do-dia'
    }
  };

  return sendNotificationToTeam(teamId, notification);
};

// Função para enviar notificação de ranking semanal
export const sendWeeklyRankingNotification = async (
  atletaId: string,
  posicao: number,
  totalAtletas: number
) => {
  console.log(`Enviando notificação de ranking para ${atletaId}: posição ${posicao} de ${totalAtletas}`);
  
  let emoji = '🏅';
  let message = `Você está em ${posicao}º lugar entre ${totalAtletas} atletas esta semana!`;
  
  if (posicao === 1) {
    emoji = '🥇';
    message = `Parabéns! Você está em 1º lugar no ranking desta semana!`;
  } else if (posicao === 2) {
    emoji = '🥈';
  } else if (posicao === 3) {
    emoji = '🥉';
  } else if (posicao > totalAtletas / 2) {
    emoji = '💪';
    message = `Você está em ${posicao}º lugar. Continue se esforçando para subir no ranking!`;
  }
  
  const notification: NotificationPayload = {
    title: `${emoji} Atualização do Ranking Semanal`,
    body: message,
    tag: 'ranking',
    data: {
      type: 'ranking',
      position: posicao,
      total: totalAtletas,
      url: '/ranking'
    }
  };

  return sendNotificationToAthlete(atletaId, notification);
};

// Função para enviar alerta de ausência sem justificativa
export const sendAbsenceAlertNotification = async (
  atletaId: string,
  treinoNome: string,
  data: string,
  consecutivas: number
) => {
  console.log(`Enviando alerta de ausência para ${atletaId}: faltou em ${data}, ${consecutivas} consecutivas`);
  
  let title = '⚠️ Ausência em Treino';
  let message = `Você não compareceu ao treino "${treinoNome}" em ${data} e não justificou a falta.`;
  
  if (consecutivas > 1) {
    title = '⚠️ Ausências Consecutivas';
    message = `Você tem ${consecutivas} faltas consecutivas sem justificativa. A última foi no treino "${treinoNome}" em ${data}.`;
  }
  
  const notification: NotificationPayload = {
    title: title,
    body: message,
    tag: 'absence',
    data: {
      type: 'absence',
      trainingName: treinoNome,
      trainingDate: data,
      consecutiveAbsences: consecutivas,
      url: '/presencas'
    },
    requireInteraction: consecutivas > 2 // Requer interação se muitas faltas
  };

  return sendNotificationToAthlete(atletaId, notification);
};
