import React, { Component, ErrorInfo, ReactNode } from 'react';
import ErrorFallback from './ErrorFallback';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Atualiza o estado para que a próxima renderização mostre a UI de fallback
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Você também pode registrar o erro em um serviço de relatório de erros
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // Chamar o callback onError, se fornecido
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Se um fallback personalizado for fornecido, use-o
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Caso contrário, use o ErrorFallback padrão
      return (
        <ErrorFallback 
          error={this.state.error || new Error('An unknown error occurred')} 
          resetErrorBoundary={this.resetErrorBoundary} 
        />
      );
    }

    // Se não houver erro, renderize os componentes filhos normalmente
    return this.props.children;
  }
}

export default ErrorBoundary; 