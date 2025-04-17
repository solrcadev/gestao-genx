// Check if the app is running in standalone mode (installed as PWA)
export const isRunningAsPWA = () => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone || 
         document.referrer.includes('android-app://');
};

// Check if the app can be installed (PWA criteria met + not already installed)
export const isAppInstallable = () => {
  return !isRunningAsPWA() && 'deferredPrompt' in window;
};

// Register service worker for PWA functionality
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });
      
      console.log('Service Worker registrado com sucesso:', registration.scope);
      
      // Verificar se há atualizações
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('Nova versão disponível! Recarregue a página para atualizar.');
              
              // Mostrar notificação de atualização disponível
              if ('Notification' in window && Notification.permission === 'granted') {
                navigator.serviceWorker.ready.then(reg => {
                  reg.showNotification('Atualização disponível', {
                    body: 'Uma nova versão do app está disponível. Clique para atualizar.',
                    icon: '/logo192.png'
                  });
                });
              }
            }
          });
        }
      });
      
      // Verificar atualizações a cada hora
      setInterval(() => {
        registration.update();
        console.log('Verificando atualizações do Service Worker');
      }, 1000 * 60 * 60);
      
      return registration;
    } catch (error) {
      console.error('Falha ao registrar o Service Worker:', error);
      return null;
    }
  } else {
    console.warn('Service Worker não é suportado neste navegador');
    return null;
  }
};

// Function to register event listeners for PWA install prompt
export const registerPWAInstallListener = () => {
  // This event fires when the PWA is installable
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the default browser install prompt
    e.preventDefault();
    
    // Store the event for later use
    (window as any).deferredPrompt = e;
    
    console.log('App is installable as PWA');
    
    // Optionally dispatch a custom event that components can listen for
    window.dispatchEvent(new Event('pwaInstallable'));
  });
  
  // Event fired when PWA is installed
  window.addEventListener('appinstalled', () => {
    console.log('PWA installed successfully');
    
    // Clear the deferredPrompt
    (window as any).deferredPrompt = null;
    
    // Dispatch event for components to react to installation
    window.dispatchEvent(new Event('pwaInstalled'));
  });
};

// Function to check if the app is online
export const isOnline = () => {
  return navigator.onLine;
};

// Register network status change listeners
export const registerNetworkStatusListeners = (
  onOnline?: () => void,
  onOffline?: () => void
) => {
  window.addEventListener('online', () => {
    console.log('App is online');
    if (onOnline) onOnline();
  });
  
  window.addEventListener('offline', () => {
    console.log('App is offline');
    if (onOffline) onOffline();
  });
  
  return {
    removeListeners: () => {
      window.removeEventListener('online', onOnline || (() => {}));
      window.removeEventListener('offline', onOffline || (() => {}));
    }
  };
};
