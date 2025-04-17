// Nome e versão do cache
const CACHE_NAME = 'genx-cache-v2';
const DYNAMIC_CACHE = 'genx-dynamic-v2';

// Assets que serão sempre cacheados (App Shell)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/badge-96x96.png',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png'
];

// Rotas importantes da aplicação para cache
const APP_ROUTES = [
  '/',
  '/admin',
  '/admin/atletas',
  '/admin/exercicios',
  '/admin/treinos',
  '/admin/treino-do-dia',
  '/admin/avaliacao',
  '/atleta'
];

// Evento de instalação - armazenar em cache os assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Cache aberto');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Pré-cache concluído');
        // Ativar imediatamente sem esperar o antigo terminar
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('[Service Worker] Erro no pré-cache:', err);
      })
  );
});

// Evento de ativação - limpar caches antigos
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Ativando...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
            console.log('[Service Worker] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('[Service Worker] Agora está controlando a página');
      // Controlar as páginas imediatamente
      return self.clients.claim();
    })
  );
});

// Função auxiliar para verificar se a URL é de API ou supabase
const isApiOrSupabase = (url) => {
  return url.includes('supabase.co') || 
         url.includes('/rest/v1/') || 
         url.includes('api.');
};

// Função auxiliar para verificar se é uma rota da app
const isAppRoute = (url) => {
  const urlObj = new URL(url);
  return APP_ROUTES.some(route => urlObj.pathname === route || urlObj.pathname.startsWith(`${route}/`));
};

// Função para direcionar para a página offline quando não há conexão
function returnOfflinePage() {
  return caches.match('/offline.html')
    .then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return new Response('Você está offline e a página offline não está disponível.', {
        headers: { 'Content-Type': 'text/plain' }
      });
    });
}

// Estratégia de cache - Network First para rotas da app, Cache First para assets estáticos
self.addEventListener('fetch', (event) => {
  try {
    // Verificar esquema e método da requisição logo no início
    const url = new URL(event.request.url);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      console.log(`[Service Worker] Ignorando requisição com esquema não suportado: ${url.protocol}`);
      return; // Não interferir com requisições de protocolos não suportados
    }
    
    // Não processar requisições POST para cache
    if (event.request.method !== 'GET') {
      console.log(`[Service Worker] Ignorando requisição com método não suportado: ${event.request.method}`);
      return; // Deixar o navegador lidar normalmente com requisições não-GET
    }
  
    // Pular requisições Supabase/APIs - sempre vão para network
    if (isApiOrSupabase(event.request.url)) {
      return;
    }

    // Verificar se é uma requisição de navegação (HTML)
    const isNavigationRequest = event.request.mode === 'navigate';
    
    // Rota da aplicação ou requisição de navegação - Network First
    if (isAppRoute(event.request.url) || isNavigationRequest) {
      event.respondWith(
        fetch(event.request)
          .then(response => {
            // Não armazenar em cache se a resposta não for válida
            if (!response || response.status !== 200) {
              return response;
            }

            // Verificar se o URL tem um esquema suportado
            const url = new URL(event.request.url);
            if (url.protocol !== 'http:' && url.protocol !== 'https:') {
              console.log(`[Service Worker] Esquema de URL não suportado para cache: ${url.protocol}`);
              return response;
            }

            // Não armazenar requisições POST em cache
            if (event.request.method !== 'GET') {
              console.log(`[Service Worker] Método de requisição não suportado para cache: ${event.request.method}`);
              return response;
            }

            // Clonar a resposta porque ela só pode ser usada uma vez
            const responseToCache = response.clone();

            caches.open(DYNAMIC_CACHE)
              .then(cache => {
                try {
                  cache.put(event.request, responseToCache);
                } catch (error) {
                  console.error('[Service Worker] Erro ao armazenar em cache:', error);
                }
              });

            return response;
          })
          .catch(() => {
            // Se falhar o fetch (offline), tentar buscar do cache
            return caches.match(event.request)
              .then(cachedResponse => {
                if (cachedResponse) {
                  return cachedResponse;
                }
                
                // Se não tiver no cache e for navegação, mostrar página offline
                if (isNavigationRequest) {
                  return returnOfflinePage();
                }
                
                return new Response('Não foi possível carregar o recurso', { 
                  status: 408,
                  headers: { 'Content-Type': 'text/plain' }
                });
              });
          })
      );
    } else {
      // Static assets - Cache First para melhor performance
      event.respondWith(
        caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }

            return fetch(event.request)
              .then(response => {
                // Não armazenar em cache se a resposta não for válida
                if (!response || response.status !== 200 || response.type !== 'basic') {
                  return response;
                }

                // Verificar se o URL tem um esquema suportado
                const url = new URL(event.request.url);
                if (url.protocol !== 'http:' && url.protocol !== 'https:') {
                  console.log(`[Service Worker] Esquema de URL não suportado para cache: ${url.protocol}`);
                  return response;
                }

                // Não armazenar requisições POST em cache
                if (event.request.method !== 'GET') {
                  console.log(`[Service Worker] Método de requisição não suportado para cache: ${event.request.method}`);
                  return response;
                }

                // Clonar a resposta porque ela só pode ser usada uma vez
                const responseToCache = response.clone();

                caches.open(DYNAMIC_CACHE)
                  .then(cache => {
                    try {
                      cache.put(event.request, responseToCache);
                    } catch (error) {
                      console.error('[Service Worker] Erro ao armazenar em cache:', error);
                    }
                  });

                return response;
              })
              .catch(() => {
                return new Response('Falha ao carregar recurso estático', { 
                  status: 408,
                  headers: { 'Content-Type': 'text/plain' }
                });
              });
          })
      );
    }
  } catch (error) {
    console.error('[Service Worker] Erro ao processar requisição:', error);
    return;
  }
});

// Sincronização em background
self.addEventListener('sync', event => {
  console.log('[Service Worker] Background Sync', event.tag);
  
  if (event.tag === 'sync-presencas') {
    console.log('[Service Worker] Sincronizando presenças...');
    event.waitUntil(syncPresencas());
  } else if (event.tag === 'sync-avaliacoes') {
    console.log('[Service Worker] Sincronizando avaliações...');
    event.waitUntil(syncAvaliacoes());
  }
});

// Função para sincronizar presenças
async function syncPresencas() {
  try {
    const response = await fetch('/api/sync-presencas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('[Service Worker] Sincronização de presenças concluída:', result);
      
      // Notificar o usuário
      self.registration.showNotification('Sincronização concluída', {
        body: `${result.count} registros de presença foram sincronizados.`,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-96x96.png'
      });
      
      return result;
    } else {
      throw new Error('Falha na sincronização de presenças');
    }
  } catch (error) {
    console.error('[Service Worker] Erro na sincronização de presenças:', error);
    return null;
  }
}

// Função para sincronizar avaliações
async function syncAvaliacoes() {
  try {
    const response = await fetch('/api/sync-avaliacoes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('[Service Worker] Sincronização de avaliações concluída:', result);
      
      // Notificar o usuário
      self.registration.showNotification('Sincronização concluída', {
        body: `${result.count} avaliações foram sincronizadas.`,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-96x96.png'
      });
      
      return result;
    } else {
      throw new Error('Falha na sincronização de avaliações');
    }
  } catch (error) {
    console.error('[Service Worker] Erro na sincronização de avaliações:', error);
    return null;
  }
}

// Evento de notificação push
self.addEventListener('push', event => {
  console.log('[Service Worker] Push recebido:', event);
  
  let notificationData = {};
  
  try {
    if (event.data) {
      console.log('[Service Worker] Dados push:', event.data.text());
      try {
        // Tentar analisar os dados como JSON
        notificationData = event.data.json();
        console.log('[Service Worker] Dados JSON da notificação:', notificationData);
      } catch (e) {
        // Se não for JSON, usar texto simples
        console.warn('[Service Worker] Dados não são JSON válido, usando texto simples');
        notificationData = {
          title: 'GEN X',
          body: event.data.text(),
        };
      }
    } else {
      console.warn('[Service Worker] Push sem dados recebido');
      notificationData = {
        title: 'GEN X',
        body: 'Nova notificação recebida',
      };
    }
    
    // Valores padrão para notificação
    const title = notificationData.title || 'GEN X';
    const options = {
      body: notificationData.body || 'Nova atualização disponível',
      icon: notificationData.icon || '/icons/icon-192x192.png',
      badge: notificationData.badge || '/icons/badge-96x96.png',
      tag: notificationData.tag || 'default',
      data: {
        url: notificationData.data?.url || '/',
        type: notificationData.data?.type || 'default',
        timestamp: Date.now(),
        ...(notificationData.data || {})
      },
      requireInteraction: notificationData.requireInteraction || false,
      actions: notificationData.actions || [],
      vibrate: [100, 50, 100],
    };
    
    console.log('[Service Worker] Mostrando notificação:', { title, options });
    
    // Mostrar a notificação
    event.waitUntil(
      self.registration.showNotification(title, options)
        .then(() => {
          console.log('[Service Worker] Notificação mostrada com sucesso');
          return Promise.resolve();
        })
        .catch(error => {
          console.error('[Service Worker] Erro ao mostrar notificação:', error);
          return Promise.reject(error);
        })
    );
  } catch (error) {
    console.error('[Service Worker] Erro ao processar push:', error);
    
    // Mostrar uma notificação de fallback em caso de erro
    event.waitUntil(
      self.registration.showNotification('GEN X', {
        body: 'Nova notificação recebida',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-96x96.png'
      })
    );
  }
});

// Handler para clique em notificação
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notificação clicada:', event);
  
  // Fechar a notificação
  event.notification.close();
  
  // Obter dados da notificação
  const notificationData = event.notification.data || {};
  
  // URL para abrir (padrão para / se não for especificado)
  let targetUrl = notificationData.url || '/';
  
  // Verificar se foi clicado em uma ação específica
  if (event.action) {
    console.log('[Service Worker] Ação clicada:', event.action);
    
    // Ações específicas baseadas no tipo
    switch (event.action) {
      case 'view':
        // Navegar para a URL de visualização especificada
        if (notificationData.type === 'training') {
          targetUrl = '/treino-do-dia';
        } else if (notificationData.type === 'goal') {
          targetUrl = '/metas-evolucao';
        } else if (notificationData.type === 'ranking') {
          targetUrl = '/ranking';
        } else if (notificationData.type === 'absence') {
          targetUrl = '/presencas';
        } else {
          // Usar a URL padrão fornecida
          targetUrl = notificationData.url || '/';
        }
        break;
        
      case 'dismiss':
        // Apenas fechar a notificação, sem navegar
        console.log('[Service Worker] Notificação dispensada');
        return;
        
      case 'later':
        // Agendar para mostrar novamente mais tarde (exemplo)
        console.log('[Service Worker] Lembrar mais tarde');
        
        // Programar uma nova notificação para 1 hora depois
        setTimeout(() => {
          self.registration.showNotification(event.notification.title, {
            body: `LEMBRETE: ${event.notification.body}`,
            icon: event.notification.icon,
            badge: event.notification.badge,
            tag: `reminder-${event.notification.tag || 'default'}`,
            data: event.notification.data
          });
        }, 60 * 60 * 1000); // 1 hora
        return;
        
      default:
        // Para ações não reconhecidas, usar a URL padrão
        console.log('[Service Worker] Ação não reconhecida:', event.action);
        targetUrl = notificationData.url || '/';
    }
  }
  
  console.log('[Service Worker] Abrindo URL:', targetUrl);
  
  // Foca em uma aba existente ou abre uma nova
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })
    .then(clientList => {
      // Verificar se já existe uma janela/aba aberta
      for (const client of clientList) {
        // Se encontrarmos uma janela já aberta, verificamos se é a URL que queremos
        if ('focus' in client) {
          if (client.url.includes(targetUrl)) {
            // Se a janela já está na URL desejada, apenas foca nela
            return client.focus();
          }
        }
      }
      
      // Se não encontramos uma janela aberta com a URL, pegamos qualquer janela e navegamos
      for (const client of clientList) {
        if ('focus' in client && 'navigate' in client) {
          return client.focus().then(() => client.navigate(targetUrl));
        }
      }
      
      // Se não houver janelas abertas, abrimos uma nova
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
    .catch(error => {
      console.error('[Service Worker] Erro ao abrir janela:', error);
    })
  );
});

// Tipos específicos de notificação - manejadores especializados
function showTrainingNotification(data) {
  console.log('[Service Worker] Mostrando notificação de treino:', data);
  
  const { nome, data: dataTreino, local } = data;
  
  // Formatar a data se necessário
  const dataFormatada = new Date(dataTreino).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return self.registration.showNotification('🏐 Treino do Dia', {
    body: `Treino "${nome}" agendado para ${dataFormatada}${local ? ` em ${local}` : ''}.`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-96x96.png',
    tag: 'training',
    data: {
      url: '/treino-do-dia',
      type: 'training',
      trainingId: data.id,
      trainingName: nome,
      trainingDate: dataTreino
    },
    actions: [
      {
        action: 'view',
        title: 'Ver treino'
      },
      {
        action: 'dismiss',
        title: 'Dispensar'
      }
    ]
  });
}

function showGoalNotification(data) {
  console.log('[Service Worker] Mostrando notificação de meta:', data);
  
  const { titulo, descricao, atletaNome } = data;
  
  return self.registration.showNotification('🎯 Nova Meta', {
    body: `${atletaNome ? `${atletaNome}: ` : ''}${titulo}${descricao ? `\n${descricao}` : ''}`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-96x96.png',
    tag: 'goal',
    data: {
      url: '/metas-evolucao',
      type: 'goal',
      goalId: data.id,
      goalTitle: titulo
    },
    actions: [
      {
        action: 'view',
        title: 'Ver meta'
      }
    ],
    requireInteraction: true
  });
}

function showRankingNotification(data) {
  console.log('[Service Worker] Mostrando notificação de ranking:', data);
  
  const { posicao, total, atletaNome } = data;
  
  let emoji = '🏅';
  let message = `${atletaNome ? `${atletaNome}: ` : ''}Você está em ${posicao}º lugar entre ${total} atletas esta semana!`;
  
  if (posicao === 1) {
    emoji = '🥇';
    message = `${atletaNome ? `${atletaNome}: ` : ''}Parabéns! Você está em 1º lugar no ranking desta semana!`;
  } else if (posicao === 2) {
    emoji = '🥈';
  } else if (posicao === 3) {
    emoji = '🥉';
  }
  
  return self.registration.showNotification(`${emoji} Ranking Semanal`, {
    body: message,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-96x96.png',
    tag: 'ranking',
    data: {
      url: '/ranking',
      type: 'ranking',
      position: posicao,
      total: total
    }
  });
}

function showAbsenceNotification(data) {
  console.log('[Service Worker] Mostrando notificação de ausência:', data);
  
  const { treinoNome, data: dataTreino, consecutivas, atletaNome } = data;
  
  // Formatar a data se necessário
  const dataFormatada = new Date(dataTreino).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
  
  let title = '⚠️ Ausência em Treino';
  let message = `${atletaNome ? `${atletaNome}: ` : ''}Você não compareceu ao treino "${treinoNome}" em ${dataFormatada} e não justificou a falta.`;
  
  if (consecutivas > 1) {
    title = '⚠️ Ausências Consecutivas';
    message = `${atletaNome ? `${atletaNome}: ` : ''}Você tem ${consecutivas} faltas consecutivas sem justificativa. A última foi no treino "${treinoNome}" em ${dataFormatada}.`;
  }
  
  return self.registration.showNotification(title, {
    body: message,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-96x96.png',
    tag: 'absence',
    data: {
      url: '/presencas',
      type: 'absence',
      trainingName: treinoNome,
      trainingDate: dataTreino,
      consecutiveAbsences: consecutivas
    },
    requireInteraction: consecutivas > 2, // Requer interação se muitas faltas
    actions: [
      {
        action: 'view',
        title: 'Justificar'
      }
    ]
  });
}

// Evento de mensagem para comunicação com o frontend
self.addEventListener('message', event => {
  console.log('[Service Worker] Mensagem recebida do cliente:', event.data);
  
  const data = event.data;
  
  if (!data) {
    console.warn('[Service Worker] Mensagem sem dados recebida');
    return;
  }
  
  // Tratar diferentes tipos de mensagem
  switch (data.type) {
    case 'SKIP_WAITING':
      // Atualizar imediatamente o service worker
      console.log('[Service Worker] Solicitação para pular espera');
      self.skipWaiting();
      break;
      
    case 'SHOW_NOTIFICATION':
      // Mensagem para mostrar uma notificação específica
      console.log('[Service Worker] Solicitação para mostrar notificação:', data.notification);
      
      // Verificar se notificação tem dados válidos
      if (!data.notification || !data.notification.title) {
        console.error('[Service Worker] Dados de notificação inválidos');
        return;
      }
      
      // Mostrar notificação com base no tipo
      if (data.notification.data && data.notification.data.type) {
        const notificationType = data.notification.data.type;
        
        switch (notificationType) {
          case 'training':
            showTrainingNotification(data.notification.data);
            break;
            
          case 'goal':
            showGoalNotification(data.notification.data);
            break;
            
          case 'ranking':
            showRankingNotification(data.notification.data);
            break;
            
          case 'absence':
            showAbsenceNotification(data.notification.data);
            break;
            
          default:
            // Notificação genérica
            self.registration.showNotification(
              data.notification.title,
              {
                body: data.notification.body || '',
                icon: data.notification.icon || '/icons/icon-192x192.png',
                badge: data.notification.badge || '/icons/badge-96x96.png',
                tag: data.notification.tag || 'default',
                data: data.notification.data || {},
                requireInteraction: data.notification.requireInteraction || false,
                actions: data.notification.actions || []
              }
            );
        }
      } else {
        // Notificação simples sem tipo específico
        self.registration.showNotification(
          data.notification.title,
          {
            body: data.notification.body || '',
            icon: data.notification.icon || '/icons/icon-192x192.png',
            badge: data.notification.badge || '/icons/badge-96x96.png',
            tag: data.notification.tag || 'default',
            data: data.notification.data || {},
            requireInteraction: data.notification.requireInteraction || false,
            actions: data.notification.actions || []
          }
        );
      }
      break;
      
    case 'TEST_NOTIFICATION':
      // Mensagem para testar notificações
      console.log('[Service Worker] Solicitação para teste de notificação');
      
      self.registration.showNotification('Teste de Notificação', {
        body: data.message || 'Esta é uma notificação de teste',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-96x96.png',
        vibrate: [100, 50, 100],
        data: {
          url: '/',
          timestamp: Date.now(),
          isTest: true
        },
        actions: [
          {
            action: 'view',
            title: 'Ver'
          },
          {
            action: 'dismiss',
            title: 'Dispensar'
          }
        ]
      });
      break;
      
    default:
      console.log('[Service Worker] Tipo de mensagem desconhecido:', data.type);
  }
});

console.log('[Service Worker] Service worker inicializado e pronto!');
