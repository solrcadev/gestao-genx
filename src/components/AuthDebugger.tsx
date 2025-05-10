import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { UserCheck, Shield } from 'lucide-react';

const AuthDebugger = () => {
  const { session, loading, userRole } = useAuth();
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
                <p><strong>Papel (app_metadata):</strong> {' '}
                  {userRole ? (
                    <Badge variant="outline" className="ml-1 bg-green-50">
                      <UserCheck className="h-3 w-3 mr-1" />
                      {userRole}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="ml-1 bg-yellow-50">
                      <Shield className="h-3 w-3 mr-1" />
                      não definido
                    </Badge>
                  )}
                </p>
                <p><strong>Expiração:</strong> {new Date(session.expires_at * 1000).toLocaleString()}</p>
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500 italic">Use o Supabase Studio para definir o papel no app_metadata: {"{ \"role\": \"tecnico\" }"}</p>
                </div>
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
