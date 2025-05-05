
import React from 'react';
import { useConsolidatedAuth } from '@/hooks/useConsolidatedAuth';
import { Button } from './ui/button';

const AuthDebugger = () => {
  const { user, profile, isLoading } = useConsolidatedAuth();
  const [showDebug, setShowDebug] = React.useState(false);

  if (isLoading) {
    return <div>Carregando informações de autenticação...</div>;
  }

  return (
    <div className="fixed bottom-16 right-4 z-50">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setShowDebug(!showDebug)}
        className="bg-secondary"
      >
        {showDebug ? 'Fechar' : 'Debug Auth'}
      </Button>

      {showDebug && (
        <div className="mt-2 p-4 bg-white rounded-md shadow-lg border max-w-xs overflow-auto">
          <h4 className="font-medium mb-2">Informações de Autenticação</h4>
          <div className="text-sm">
            <p><strong>Autenticado:</strong> {user ? 'Sim' : 'Não'}</p>
            {user && (
              <>
                <p><strong>User ID:</strong> {user.id}</p>
                <p><strong>Email:</strong> {user.email}</p>
              </>
            )}
            <p><strong>Perfil carregado:</strong> {profile ? 'Sim' : 'Não'}</p>
            {profile && (
              <>
                <p><strong>Função:</strong> {profile.funcao}</p>
                <p><strong>Status:</strong> {profile.status}</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthDebugger;
