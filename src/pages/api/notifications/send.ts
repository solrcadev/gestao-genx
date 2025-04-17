import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import webpush from 'web-push';

// Tipos
interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: Array<{ action: string; title: string }>;
  silent?: boolean;
  requireInteraction?: boolean;
}

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Configurar VAPID para Web Push
// Estas chaves devem ser geradas e armazenadas de forma segura
// Para desenvolvimento, você pode gerar em https://web-push-codelab.glitch.me/
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BFnrHhwNKc9JZP1QVQGGKr2xSOPVk7Gg54tGg3XSuaTRxJkJ5Ch9M0Ss0u1-iBx9F1i5jJKR_ERTBwmCJbtA3BY';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'k1ILuL5K3E6CbEYiQa0Z9wFHxqBYJdFvXn5h9JZxnMY';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contato@genx.com.br';

// Configurar web-push
webpush.setVapidDetails(
  VAPID_SUBJECT,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[API] Recebida solicitação para enviar notificação');
  
  // Permitir apenas POST
  if (req.method !== 'POST') {
    console.error('[API] Método não permitido:', req.method);
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Inicializar cliente Supabase
    const supabase = createServerSupabaseClient({ req, res });
    
    // Verificar autenticação (opcional - você pode remover se quiser permitir requisições não autenticadas)
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      console.error('[API] Usuário não autenticado');
      return res.status(401).json({ error: 'Não autorizado' });
    }

    // Extrair dados da requisição
    const { targetType, targetId, notification } = req.body;
    
    if (!notification || !notification.title || !notification.body) {
      console.error('[API] Dados de notificação inválidos:', notification);
      return res.status(400).json({ error: 'Dados de notificação inválidos' });
    }
    
    console.log(`[API] Enviando notificação tipo ${targetType}${targetId ? ` para ${targetId}` : ''}:`, notification);

    // Determinar quais subscriptions devem receber a notificação
    let subscriptionsQuery = supabase
      .from('notificacoes_subscriptions')
      .select('*');

    // Filtrar subscriptions com base no tipo de alvo
    if (targetType === 'athlete' && targetId) {
      subscriptionsQuery = subscriptionsQuery.eq('atleta_id', targetId);
    } else if (targetType === 'team' && targetId) {
      // Buscar primeiro os IDs dos atletas dessa equipe
      const { data: atletasData, error: atletasError } = await supabase
        .from('atletas')
        .select('id')
        .eq('equipe_id', targetId);
      
      if (atletasError) {
        console.error('[API] Erro ao buscar atletas da equipe:', atletasError);
        return res.status(500).json({ error: 'Erro ao buscar atletas da equipe' });
      }
      
      const atletaIds = atletasData.map(atleta => atleta.id);
      if (atletaIds.length === 0) {
        console.warn('[API] Nenhum atleta encontrado para a equipe:', targetId);
        return res.status(200).json({ sent: 0, message: 'Nenhum atleta encontrado para esta equipe' });
      }
      
      subscriptionsQuery = subscriptionsQuery.in('atleta_id', atletaIds);
    } else if (targetType === 'role' && targetId) {
      subscriptionsQuery = subscriptionsQuery.eq('user_role', targetId);
    }
    // Para broadcast, não aplicamos filtros e enviamos para todos

    // Obter subscriptions
    const { data: subscriptions, error: subError } = await subscriptionsQuery;

    if (subError) {
      console.error('[API] Erro ao buscar subscriptions:', subError);
      return res.status(500).json({ error: 'Erro ao buscar subscriptions' });
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.warn('[API] Nenhuma subscription encontrada para enviar notificação');
      return res.status(200).json({ sent: 0, message: 'Nenhum dispositivo registrado para receber notificações' });
    }

    console.log(`[API] Encontradas ${subscriptions.length} subscriptions para enviar notificação`);

    // Enviar notificações para cada subscription
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          const pushSubscription: PushSubscription = sub.subscription_data;
          const payload = JSON.stringify({
            title: notification.title,
            body: notification.body,
            icon: notification.icon || '/icons/icon-192x192.png',
            badge: notification.badge || '/icons/badge-96x96.png',
            tag: notification.tag || 'default',
            data: {
              ...notification.data,
              url: notification.data?.url || '/',
              timestamp: Date.now()
            },
            requireInteraction: notification.requireInteraction || false,
            silent: notification.silent || false,
            actions: notification.actions || []
          });

          // Enviar notificação push
          await webpush.sendNotification(pushSubscription, payload);
          console.log(`[API] Notificação enviada com sucesso para ${sub.endpoint}`);
          
          // Atualizar última atividade da subscription
          await supabase
            .from('notificacoes_subscriptions')
            .update({ last_used: new Date().toISOString() })
            .eq('endpoint', sub.endpoint);
            
          return { success: true, endpoint: sub.endpoint };
        } catch (error: any) {
          console.error(`[API] Erro ao enviar notificação para ${sub.endpoint}:`, error);
          
          // Se o erro for 404 ou 410, a subscription não é mais válida
          if (error.statusCode === 404 || error.statusCode === 410) {
            console.log(`[API] Subscription inválida, removendo ${sub.endpoint}`);
            
            // Remover subscription inválida
            await supabase
              .from('notificacoes_subscriptions')
              .delete()
              .eq('endpoint', sub.endpoint);
          }
          
          return { 
            success: false, 
            endpoint: sub.endpoint, 
            statusCode: error.statusCode, 
            message: error.message 
          };
        }
      })
    );

    // Contar resultados
    const successful = results.filter(r => r.status === 'fulfilled' && (r as any).value.success).length;
    const failed = results.filter(r => r.status === 'rejected' || !(r as any).value.success).length;
    
    // Registrar o envio no histórico
    await supabase.from('notificacoes_historico').insert({
      tipo: targetType,
      target_id: targetId || null,
      titulo: notification.title,
      mensagem: notification.body,
      enviadas: successful,
      falhas: failed,
      data: notification.data || null,
      created_at: new Date().toISOString(),
      user_id: session.user.id
    });

    return res.status(200).json({
      success: true,
      sent: successful,
      failed: failed,
      total: subscriptions.length,
      results: results.map(r => r.status === 'fulfilled' ? (r as any).value : { error: (r as any).reason })
    });

  } catch (error: any) {
    console.error('[API] Erro ao processar envio de notificações:', error);
    return res.status(500).json({
      error: 'Erro ao processar envio de notificações',
      message: error.message
    });
  }
} 