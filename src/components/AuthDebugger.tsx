import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from './ui/button';

const AuthDebugger = () => {
  const { session, loading } = useAuth();
  const [showDebug, setShowDebug] = React.useState(false);

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
            <p><strong>Autenticado:</strong> {session ? 'Sim' : 'Não'}</p>
            {session && (
              <>
                <p><strong>User ID:</strong> {session.user.id}</p>
                <p><strong>Email:</strong> {session.user.email}</p>
                <p><strong>Expiração:</strong> {new Date(session.expires_at * 1000).toLocaleString()}</p>
              </>
            )}
            <p><strong>Estado:</strong> {loading ? 'Carregando...' : 'Pronto'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthDebugger;
