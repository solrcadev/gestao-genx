
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
