import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SafeAppEntry from './pages/Index';
import './index.css';
import { registerPWAInstallListener, registerNetworkStatusListeners, registerServiceWorker } from './services/pwaService';

// Create a client for React Query with settings to avoid excessive renders
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});

// Register Service Worker for PWA features
registerServiceWorker()
  .then(registration => {
    if (registration) {
      console.log('Service Worker registrado com sucesso!');
    }
  })
  .catch(error => {
    console.error('Erro ao registrar Service Worker:', error);
  });

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

const rootElement = document.getElementById('root');

// Verificar se o elemento root existe
if (!rootElement) {
  console.error('Elemento root não encontrado!');
} else {
  try {
    const root = createRoot(rootElement);
    
    root.render(
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <SafeAppEntry />
        </QueryClientProvider>
      </BrowserRouter>
    );
    
    console.log('Aplicação inicializada com sucesso!');
  } catch (error) {
    console.error('Erro ao renderizar a aplicação:', error);
    
    // Fallback básico para erro de renderização
    rootElement.innerHTML = `
      <div class="error-container">
        <div class="error-icon">⚠️</div>
        <h2 class="error-title">Erro na inicialização</h2>
        <p class="error-message">
          Ocorreu um erro ao iniciar a aplicação. Por favor, recarregue a página.
        </p>
        <button onclick="window.location.reload()" class="retry-button">
          Recarregar
        </button>
      </div>
    `;
  }
}

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
