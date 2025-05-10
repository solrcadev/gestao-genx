import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

type RoleBasedAccessProps = {
  /**
   * Os papéis que têm permissão para acessar o conteúdo.
   * Se não especificado, assume-se que qualquer papel autenticado tem acesso.
   */
  allowedRoles?: string[];
  
  /**
   * Determina se o componente deve ser renderizado como desabilitado 
   * em vez de completamente oculto quando o usuário não tem acesso.
   */
  fallbackDisabled?: boolean;
  
  /**
   * Conteúdo a ser renderizado quando o usuário tem o papel permitido.
   */
  children: React.ReactNode;
  
  /**
   * Conteúdo alternativo a ser renderizado quando o usuário não tem 
   * o papel permitido. Se não fornecido e fallbackDisabled=false, nada 
   * será renderizado.
   */
  fallback?: React.ReactNode;
  
  /**
   * Propriedades para passar para o wrapper quando o elemento estiver desabilitado.
   */
  disabledProps?: React.HTMLAttributes<HTMLDivElement>;
};

/**
 * Componente para renderização condicional baseada no papel do usuário.
 * Utiliza o userRole do AuthContext para determinar o acesso.
 */
const RoleBasedAccess: React.FC<RoleBasedAccessProps> = ({
  allowedRoles = ['tecnico'], // Por padrão, apenas técnicos têm acesso
  fallbackDisabled = false,
  children,
  fallback = null,
  disabledProps = {}
}) => {
  const { userRole } = useAuth();
  
  // Usuários com papel 'tecnico' sempre têm acesso total
  if (userRole === 'tecnico') {
    return <>{children}</>;
  }
  
  // Verificar se o usuário tem um dos papéis permitidos
  const hasAccess = userRole && allowedRoles.includes(userRole);
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  // Se devemos desabilitar em vez de ocultar
  if (fallbackDisabled) {
    return (
      <div 
        className="opacity-50 pointer-events-none cursor-not-allowed" 
        {...disabledProps}
      >
        {children}
      </div>
    );
  }
  
  // Sem acesso e sem fallback, não renderiza nada
  return <>{fallback}</>;
};

export default RoleBasedAccess; 