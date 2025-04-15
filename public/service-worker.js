
const CACHE_NAME = 'genx-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/favicon.ico'
];

// Evento de instalação - armazenar em cache os assets
self.addEventListener('install', (event) => {
  console.log('Service Worker está sendo instalado!');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto');
        return cache.addAll(STATIC_ASSETS);
      })
  );
  // Ativar imediatamente sem esperar o antiga terminar
  self.skipWaiting();
});

// Evento de ativação - limpar caches antigos
self.addEventListener('activate', (event) => {
  console.log('Service Worker ativo!');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Controlar as páginas imediatamente
  event.waitUntil(clients.claim());
});

// Evento fetch - usar estratégia cache-first
self.addEventListener('fetch', (event) => {
  // Pular requisições Supabase
  if (event.request.url.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retornar resposta em cache se encontrada
        if (response) {
          return response;
        }

        // Clonar a requisição porque ela só pode ser usada uma vez
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          (response) => {
            // Não armazenar em cache se a resposta não for válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clonar a resposta porque ela só pode ser usada uma vez
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        ).catch(() => {
          // Se falhar o fetch (offline), mostrar página offline
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
        });
      })
  );
});

// Evento de notificação push
self.addEventListener('push', (event) => {
  console.log('Push event recebido!', event);
  try {
    let data;
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: 'GEN X - Notificação',
        body: event.data ? event.data.text() : 'Nova atualização disponível!'
      };
    }
    
    const options = {
      body: data.body || 'Nova atualização disponível!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-96x96.png',
      data: {
        url: data.url || '/'
      }
    };

    console.log('Mostrando notificação:', data.title, options);

    event.waitUntil(
      self.registration.showNotification(data.title || 'GEN X - Notificação', options)
    );
  } catch (error) {
    console.error('Erro ao mostrar notificação:', error);
    
    // Notificação fallback se o parsing de JSON falhar
    event.waitUntil(
      self.registration.showNotification('GEN X - Notificação', {
        body: 'Nova atualização disponível!',
        icon: '/icons/icon-192x192.png'
      })
    );
  }
});

// Evento de clique em notificação
self.addEventListener('notificationclick', (event) => {
  console.log('Clique em notificação:', event);
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({type: 'window'}).then(clientsList => {
      // Verificar se já existe uma janela/aba aberta e focar nela
      const hadWindowToFocus = clientsList.some(client => {
        if (client.url === event.notification.data?.url && 'focus' in client) {
          client.focus();
          return true;
        }
        return false;
      });

      // Se não encontrou uma janela para focar, abrir uma nova
      if (!hadWindowToFocus) {
        clients.openWindow(event.notification.data?.url || '/').then(windowClient => {
          if (windowClient && 'focus' in windowClient) {
            windowClient.focus();
          }
        });
      }
    })
  );
});

// Log de mensagens de debug para ajudar a diagnosticar problemas
self.addEventListener('message', event => {
  console.log('Mensagem recebida no Service Worker:', event.data);
});

console.log('Service worker carregado e pronto!');
