import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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
    // Atualiza o state para que a próxima renderização mostre a UI alternativa
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Renderizar fallback customizado se fornecido
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback padrão
      return (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center p-6 max-w-md rounded-lg border shadow-sm">
            <h2 className="text-xl font-bold mb-4">Algo deu errado</h2>
            <p className="text-muted-foreground mb-4">
              Ocorreu um erro na aplicação. Por favor, tente novamente.
            </p>
            <p className="text-xs text-destructive mb-6 overflow-auto max-h-32 whitespace-pre-wrap">
              {this.state.error?.toString() || "Erro desconhecido"}
            </p>
            <Button onClick={() => window.location.reload()}>Recarregar página</Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 