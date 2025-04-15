
const CACHE_NAME = 'genx-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/favicon.ico'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(STATIC_ASSETS);
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - use cache-first strategy
self.addEventListener('fetch', (event) => {
  // Skip Supabase API requests
  if (event.request.url.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached response if found
        if (response) {
          return response;
        }

        // Clone the request because it can only be used once
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          (response) => {
            // Don't cache if response is not valid
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response because it can only be used once
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        ).catch(() => {
          // If fetch fails (offline), show offline page
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
        });
      })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'Nova atualização disponível!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-96x96.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/'
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'GEN X - Notificação', options)
    );
  } catch (error) {
    console.error('Error showing notification:', error);
    
    // Fallback notification if JSON parsing fails
    event.waitUntil(
      self.registration.showNotification('GEN X - Notificação', {
        body: 'Nova atualização disponível!',
        icon: '/icons/icon-192x192.png'
      })
    );
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});
