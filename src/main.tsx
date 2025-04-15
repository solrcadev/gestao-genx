
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerPWAInstallListener, registerNetworkStatusListeners } from './services/pwaService';
import { useToast } from './hooks/use-toast';

// Register PWA event listeners
registerPWAInstallListener();

// Register network status listeners
registerNetworkStatusListeners(
  // Online callback
  () => {
    // We can't use hooks here, so we'll show a simple notification
    if (document.body) {
      const notification = document.createElement('div');
      notification.className = 'offline-toast online';
      notification.textContent = 'Você está online novamente!';
      document.body.appendChild(notification);
      
      // Remove after 3 seconds
      setTimeout(() => {
        if (notification.parentNode === document.body) {
          document.body.removeChild(notification);
        }
      }, 3000);
    }
  },
  // Offline callback
  () => {
    if (document.body) {
      const notification = document.createElement('div');
      notification.className = 'offline-toast';
      notification.textContent = 'Você está offline. Algumas funcionalidades podem estar limitadas.';
      document.body.appendChild(notification);
      
      // Remove after 5 seconds
      setTimeout(() => {
        if (notification.parentNode === document.body) {
          document.body.removeChild(notification);
        }
      }, 5000);
    }
  }
);

createRoot(document.getElementById("root")!).render(<App />);

// Add offline toast styles
const style = document.createElement('style');
style.textContent = `
.offline-toast {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #FF3B30;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  z-index: 9999;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  animation: slideIn 0.3s ease forwards;
}

.offline-toast.online {
  background-color: #34C759;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translate(-50%, 20px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}
`;
document.head.appendChild(style);
