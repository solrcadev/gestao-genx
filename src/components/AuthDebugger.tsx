import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { UserCheck, Shield } from 'lucide-react';

const AuthDebugger = () => {
  const { user, session, isLoading, userRole } = useAuth();
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
          
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <Badge variant={isLoading ? "outline" : "default"}>
                {isLoading ? "Carregando..." : "Pronto"}
              </Badge>
              
              <Badge variant={user ? "success" : "destructive"}>
                {user ? (
                  <div className="flex items-center gap-1">
                    <UserCheck size={12} />
                    <span>Autenticado</span>
                  </div>
                ) : (
                  "Não Autenticado"
                )}
              </Badge>
              
              {userRole && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Shield size={12} />
                  <span>{userRole}</span>
                </Badge>
              )}
            </div>
            
            {user && (
              <div className="mt-2 space-y-1 bg-gray-50 p-2 rounded text-gray-700">
                <p><strong>ID:</strong> {user.id}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Role:</strong> {userRole || "Não definido"}</p>
                <p><strong>Criado em:</strong> {new Date(user.created_at).toLocaleString()}</p>
              </div>
            )}
            
            {session && (
              <div className="mt-2 space-y-1">
                <p><strong>Sessão Expira:</strong> {new Date(session.expires_at * 1000).toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthDebugger;
