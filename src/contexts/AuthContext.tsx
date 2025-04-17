import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Session, User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

// Constante da chave de localStorage para manter consistência
const ROUTE_STORAGE_KEY = 'last_route';

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

  // Função para verificar se há uma rota salva para restaurar
  const getPersistedRoute = () => {
    try {
      const savedRouteJSON = localStorage.getItem(ROUTE_STORAGE_KEY);
      if (!savedRouteJSON) return null;
      
      const savedRoute = JSON.parse(savedRouteJSON);
      
      // Verificar se a rota salva não é muito antiga (24 horas)
      const savedTime = savedRoute.timestamp || 0;
      const currentTime = new Date().getTime();
      const MAX_AGE = 24 * 60 * 60 * 1000; // 24 horas em milissegundos
      
      if (currentTime - savedTime > MAX_AGE) {
        localStorage.removeItem(ROUTE_STORAGE_KEY);
        return null;
      }
      
      return savedRoute;
    } catch (error) {
      console.error("Erro ao ler rota salva:", error);
      localStorage.removeItem(ROUTE_STORAGE_KEY);
      return null;
    }
  };

  // Limpa a rota persistida
  const clearPersistedRoute = () => {
    localStorage.removeItem(ROUTE_STORAGE_KEY);
  };

  useEffect(() => {
    // Verificar sessão atual ao iniciar
    const getCurrentSession = async () => {
      setLoading(true);
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        setUser(data.session?.user || null);
      } catch (error) {
        console.error("Error getting current session:", error);
      } finally {
        setLoading(false);
      }
    };

    getCurrentSession();

    // Configurar listener para mudanças na autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state changed:", event);
        setSession(newSession);
        setUser(newSession?.user || null);
        setLoading(false);

        if (event === "SIGNED_IN") {
          // Verificar se há uma rota salva para redirecionamento
          const savedRoute = getPersistedRoute();
          if (savedRoute && savedRoute.pathname) {
            console.log("Redirecionando para rota salva:", savedRoute.pathname);
            navigate(savedRoute.pathname + (savedRoute.search || ''));
          } else {
            // Padrão: redirecionar para dashboard se não houver rota salva
            navigate("/dashboard");
          }
        } else if (event === "SIGNED_OUT") {
          // Limpar rota salva ao fazer logout
          clearPersistedRoute();
          navigate("/login");
        }
      }
    );

    // Limpeza
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [navigate]);

  // Função para login
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      setSession(data.session);
      setUser(data.session?.user || null);
      
      toast({
        title: "Login bem-sucedido",
        description: "Bem-vindo de volta!",
      });
      
      return { error: null };
    } catch (error) {
      console.error("Unexpected error during login:", error);
      return { error };
    }
  };

  // Função para logout
  const signOut = async () => {
    try {
      // Limpar rota salva antes de fazer logout
      clearPersistedRoute();
      
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      toast({
        title: "Logout realizado",
        description: "Você saiu da sua conta.",
      });
      navigate("/login");
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