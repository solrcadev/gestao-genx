import React from 'react';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary?: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetErrorBoundary }) => {
  return (
    <div className="error-container">
      <div className="error-icon">⚠️</div>
      <h2 className="error-title">Algo deu errado</h2>
      <p className="error-message">
        {error.message || 'Ocorreu um erro inesperado. Por favor, tente novamente.'}
      </p>
      {resetErrorBoundary && (
        <button onClick={resetErrorBoundary} className="retry-button">
          Tentar novamente
        </button>
      )}
    </div>
  );
};

export default ErrorFallback; 