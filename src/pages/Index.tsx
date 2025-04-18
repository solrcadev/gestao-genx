import React, { Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import ErrorBoundary from '@/components/ErrorBoundary';

// Componente de loading
const LoadingSpinner = () => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
    <p className="mt-4 text-muted-foreground">Carregando...</p>
  </div>
);

// Lazy load da App principal para evitar problemas de importação circular
const App = lazy(() => import('@/App'));

/**
 * Componente de entrada seguro que encapsula toda a aplicação 
 * dentro de ErrorBoundary e Suspense para prevenir erros fatais
 */
const SafeAppEntry: React.FC = () => {
  const navigate = useNavigate();

  const handleError = (error: Error) => {
    console.error('Erro fatal na aplicação:', error);
    
    // Se possível, redirecione para a página de login em caso de erro fatal
    try {
      navigate('/login');
    } catch (e) {
      console.error('Falha ao navegar para página de login:', e);
    }
  };

  return (
    <ErrorBoundary onError={handleError}>
      <Suspense fallback={<LoadingSpinner />}>
        <App />
      </Suspense>
    </ErrorBoundary>
  );
};

export default SafeAppEntry;
