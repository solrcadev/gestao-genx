
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Session, User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { clearRoute, getRoute, ATTEMPTED_ROUTE_KEY, ROUTE_STORAGE_KEY } from "@/utils/route-persistence";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Configurar o listener para mudanças de autenticação PRIMEIRO
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("Auth state changed:", event);
        
        // Atualizações síncronas dos estados
        setSession(currentSession);
        setUser(currentSession?.user || null);
        
        if (event === "SIGNED_IN" && currentSession) {
          // Use setTimeout para evitar deadlock do Supabase
          setTimeout(() => {
            handleSuccessfulLogin();
          }, 0);
        } else if (event === "SIGNED_OUT") {
          // Limpar rota salva ao fazer logout
          clearRoute();
          navigate("/login");
          setLoading(false);
        }
      }
    );

    // DEPOIS verificar sessão existente
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        
        // Não precisamos atualizar estados aqui, o listener acima fará isso
        if (!data.session) {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error getting current session:", error);
        setLoading(false);
      }
    };

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Função para lidar com login bem-sucedido
  const handleSuccessfulLogin = () => {
    // Verificar se há uma rota salva para redirecionamento
    const attemptedRoute = getRoute(ATTEMPTED_ROUTE_KEY, true); // true = limpar após leitura
    
    if (attemptedRoute?.pathname) {
      console.log("Redirecionando para rota tentada:", attemptedRoute.pathname);
      navigate(attemptedRoute.pathname + (attemptedRoute.search || ''));
    } else {
      // Se não houver rota tentada, verificar a última rota visitada
      const lastRoute = getRoute(ROUTE_STORAGE_KEY);
      
      if (lastRoute?.pathname) {
        console.log("Redirecionando para última rota visitada:", lastRoute.pathname);
        navigate(lastRoute.pathname + (lastRoute.search || ''));
      } else {
        // Padrão: redirecionar para dashboard se não houver rota salva
        navigate("/dashboard");
      }
    }
    
    setLoading(false);
  };

  // Função para login
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setLoading(false);
        return { error };
      }
      
      // O resto será tratado pelo listener onAuthStateChange

      toast({
        title: "Login bem-sucedido",
        description: "Bem-vindo de volta!",
      });
      
      return { error: null };
    } catch (error) {
      console.error("Unexpected error during login:", error);
      setLoading(false);
      return { error };
    }
  };

  // Função para logout
  const signOut = async () => {
    try {
      // Limpar rota salva antes de fazer logout
      clearRoute();
      
      await supabase.auth.signOut();
      
      // O resto será tratado pelo listener onAuthStateChange
      
      toast({
        title: "Logout realizado",
        description: "Você saiu da sua conta.",
      });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Erro ao sair",
        description: "Ocorreu um erro ao tentar sair.",
        variant: "destructive",
      });
    }
  };

  const value = {
    session,
    user,
    loading,
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
