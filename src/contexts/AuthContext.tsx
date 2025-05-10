import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

// Chave para armazenar a última rota no localStorage
const LAST_ROUTE_KEY = 'last_route_path';

// Timeout para prevenir hang infinito da chamada getSession()
const SESSION_REQUEST_TIMEOUT_MS = 30000; // 30 segundos para prevenir timeouts prematuros

interface AuthContextType {
  session: Session | null;
  loading: boolean;
  userRole: string | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper para lidar com timeout em promises
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return new Promise((resolve, reject) => {
    // Criando o timeout
    timeoutId = setTimeout(() => {
      console.error(`Operação expirou após ${timeoutMs}ms: ${errorMessage}`);
      reject(new Error(errorMessage));
    }, timeoutMs);
    
    promise
      .then(result => {
        // Limpar o timeout quando a promise resolver com sucesso
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        resolve(result);
      })
      .catch(error => {
        // Limpar o timeout quando a promise for rejeitada com um erro
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        reject(error);
      });
  });
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState<boolean>(false); // Flag para tracking do estado de autenticação
  const isActive = useRef(true);
  const safetyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Limpar o localStorage de dados obsoletos
  useEffect(() => {
    localStorage.removeItem("perfil");
    localStorage.removeItem("userRole");
    localStorage.removeItem("user");
  }, []);

  // Salvar rota atual no localStorage quando ela mudar
  useEffect(() => {
    // Não salvar rotas de autenticação
    if (!location.pathname.includes('/login') && 
        !location.pathname.includes('/register') && 
        !location.pathname.includes('/reset-password') &&
        !location.pathname.includes('/forgot-password') &&
        !location.pathname.includes('/logout') &&
        location.pathname !== '/') {
      localStorage.setItem(LAST_ROUTE_KEY, location.pathname + location.search);
    }
  }, [location]);

  // Função para extrair o papel do usuário
  const extractUserRole = (session: Session | null) => {
    if (!session) {
      return null;
    }
    
    // Extrair o papel do app_metadata
    const role = session.user?.app_metadata?.role;
    return role || null;
  };

  // Função para atualizar o estado de sessão de forma segura
  const updateSessionState = useCallback((newSession: Session | null) => {
    if (isActive.current) {
      if (newSession) {
        setSession(newSession);
        setUserRole(extractUserRole(newSession));
        setAuthenticated(true);
      } else {
        // Apenas limpar a sessão se o usuário não estiver autenticado
        // ou se for um logout explícito
        if (!authenticated || location.pathname.includes('/logout')) {
          setSession(null);
          setUserRole(null);
          setAuthenticated(false);
        } else {
          // Ignora null session se usuário já está autenticado
        }
      }
    }
  }, [authenticated, location.pathname]);

  // Inicializar a sessão
  useEffect(() => {
    isActive.current = true; // Reset isActive flag
    
    const initializeAuth = async () => {
      try {
        // Usar timeout para prevenir hang infinito
        const sessionResult = await withTimeout(
          supabase.auth.getSession(),
          SESSION_REQUEST_TIMEOUT_MS,
          "Supabase getSession request timed out"
        );
        
        const { data, error } = sessionResult;
        
        if (isActive.current) {
          if (error) {
            console.error("Erro ao obter sessão:", error);
            updateSessionState(null);
          } else {
            updateSessionState(data.session);
            
            // Renovar sessão se estiver prestes a expirar
            if (data.session) {
              const expiresAt = data.session.expires_at;
              const currentTime = Math.floor(Date.now() / 1000);
              
              if (expiresAt - currentTime < 300) {
                try {
                  const refreshResult = await withTimeout(
                    supabase.auth.refreshSession(),
                    SESSION_REQUEST_TIMEOUT_MS,
                    "Supabase refreshSession request timed out"
                  );
                  
                  if (!refreshResult.error && refreshResult.data.session && isActive.current) {
                    updateSessionState(refreshResult.data.session);
                  }
                } catch (refreshError) {
                  console.error("Erro ao renovar sessão:", refreshError);
                  // Continuar com a sessão não renovada
                }
              }
            }
          }
        }
      } catch (e) {
        console.error("Erro na inicialização da autenticação:", e);
        if (isActive.current) {
          // Não atualizar o estado de sessão para null em caso de erro
          // se o usuário já estiver autenticado
          if (!authenticated) {
            updateSessionState(null);
          }
        }
      } finally {
        if (isActive.current) {
          setLoading(false);
          
          // Limpar o safety timer se existir
          if (safetyTimerRef.current) {
            clearTimeout(safetyTimerRef.current);
            safetyTimerRef.current = null;
          }
        }
      }
    };

    // Definir um backup de segurança para garantir que loading será false
    // mas NÃO afeta o estado de autenticação
    safetyTimerRef.current = setTimeout(() => {
      if (loading && isActive.current) {
        console.error("ALERTA: Loading ainda true após timeout. Forçando para false.");
        setLoading(false); // Apenas força loading para false, não altera session
      }
    }, SESSION_REQUEST_TIMEOUT_MS + 1000); // 1 segundo a mais que o timeout da chamada

    // Executar inicialização
    initializeAuth();

    // Configurar listener para mudanças na autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        // Log mínimo para eventos importantes
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          console.log(`Auth state changed: ${event}`);
        }
        
        if (newSession === null && session !== null) {
          // Verificar se é um logout explícito ou outro tipo de mudança
          if (event === 'SIGNED_OUT') {
            updateSessionState(null);
            
            // Redirecionamento apenas em caso de logout explícito
            if (isActive.current) {
              navigate("/login");
            }
          } else {
            // Verificar se o usuário está em uma rota que exige autenticação
            // Se não estiver em uma rota de autenticação (login/register), tentar manter a sessão
            if (!location.pathname.includes('/login') && 
                !location.pathname.includes('/register') &&
                !location.pathname.includes('/logout')) {
              
              // NÃO fazer logout automático se o usuário já estiver autenticado previamente
              // A menos que seja um logout explícito
              if (authenticated) {
                // Ignorar evento que causaria logout não intencional
                return;
              }
            }
            
            // Se chegamos aqui, devemos atualizar o estado normalmente
            updateSessionState(newSession);
          }
        } else {
          // Para outros eventos, atualizar o estado normalmente
          if (isActive.current) {
            updateSessionState(newSession);
            
            // Sempre garantir que loading seja false após mudança de estado de auth
            setLoading(false);
          }
        }
      }
    );

    // Limpeza
    return () => {
      isActive.current = false;
      
      if (safetyTimerRef.current) {
        clearTimeout(safetyTimerRef.current);
        safetyTimerRef.current = null;
      }
      
      authListener?.subscription?.unsubscribe();
    };
  }, [navigate, updateSessionState, loading, session, authenticated, location.pathname]);

  // Login
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({
          email,
          password,
        }),
        SESSION_REQUEST_TIMEOUT_MS,
        "Login request timed out"
      );

      if (error) {
        console.error("Erro ao fazer login:", error.message);
        toast({
          title: "Erro ao fazer login",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }
      
      // Extrair o papel do usuário após login
      const role = extractUserRole(data.session);
      updateSessionState(data.session);
      
      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo de volta${role ? ` (${role})` : ''}!`,
      });

      // Redirecionar para a última rota, se houver
      const lastRoutePath = localStorage.getItem(LAST_ROUTE_KEY);
      if (lastRoutePath) {
        navigate(lastRoutePath);
      } else {
        navigate("/dashboard");
      }

      return { error: null };
    } catch (err: any) {
      console.error("Erro inesperado no login:", err);
      toast({
        title: "Erro ao fazer login",
        description: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
        variant: "destructive",
      });
      return { error: err };
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const signOut = async () => {
    setLoading(true);
    try {
      await withTimeout(
        supabase.auth.signOut(),
        SESSION_REQUEST_TIMEOUT_MS,
        "Logout request timed out"
      );
      updateSessionState(null);
      toast({
        title: "Logout realizado com sucesso",
        description: "Você foi desconectado com segurança.",
      });
      navigate("/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      toast({
        title: "Erro ao fazer logout",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const value = {
    session,
    loading,
    userRole,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
