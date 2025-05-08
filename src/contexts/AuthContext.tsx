import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

// Chave para armazenar a última rota no localStorage
const LAST_ROUTE_KEY = 'last_route_path';

interface AuthContextType {
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialMount, setIsInitialMount] = useState(true);
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
    if (isInitialMount) {
      setIsInitialMount(false);
      return;
    }

    // Não salvar rotas de autenticação
    if (!location.pathname.includes('/login') && 
        !location.pathname.includes('/register') && 
        !location.pathname.includes('/reset-password') &&
        !location.pathname.includes('/forgot-password') &&
        !location.pathname.includes('/logout') &&
        location.pathname !== '/') {
      localStorage.setItem(LAST_ROUTE_KEY, location.pathname + location.search);
      console.log("🔖 Rota atual salva:", location.pathname);
    }
  }, [location, isInitialMount]);

  // Inicializar a sessão
  useEffect(() => {
    console.log("🔑 Inicializando AuthProvider...");

    // Verificar sessão atual ao iniciar
    const getCurrentSession = async () => {
      setLoading(true);
      try {
        console.log("🔄 Buscando sessão atual...");
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("❌ Erro ao buscar sessão:", error);
          setSession(null);
          setLoading(false);
          return;
        }

        console.log("✅ Sessão recuperada:", data.session ? "Válida" : "Nula");
        setSession(data.session);
        
        if (data.session) {
          // Verificar se a sessão está prestes a expirar
          const expiresAt = data.session.expires_at;
          const currentTime = Math.floor(Date.now() / 1000);
          
          if (expiresAt - currentTime < 300) { // menos de 5 minutos para expirar
            console.log("⚠️ Sessão prestes a expirar, renovando...");
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshError) {
              console.error("❌ Erro ao renovar sessão:", refreshError);
            } else if (refreshData.session) {
              console.log("🔄 Sessão renovada com sucesso");
              setSession(refreshData.session);
            }
          }
        }
      } catch (error) {
        console.error("❌ Erro inesperado ao verificar sessão:", error);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    getCurrentSession();

    // Configurar listener para mudanças na autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("🔔 Estado de autenticação alterado:", event);
        setSession(newSession);
        setLoading(false);

        // MUITO IMPORTANTE: Não redirecionamos automaticamente aqui!
        // O único caso onde redirecionamos é no login explícito ou logout
        if (event === "SIGNED_OUT") {
          console.log("👋 Usuário desconectado, redirecionando para login...");
          navigate("/login");
        } else if (event === "TOKEN_REFRESHED") {
          console.log("🔄 Token atualizado com sucesso");
        }
      }
    );

    // Limpeza
    return () => {
      console.log("♻️ Limpando listeners de autenticação");
      authListener?.subscription.unsubscribe();
    };
  }, [navigate]);

  // Função para login
  const signIn = async (email: string, password: string) => {
    try {
      console.log("🔑 Iniciando processo de login...");
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("❌ Erro durante login:", error);
        return { error };
      }

      console.log("✅ Login bem-sucedido");
      setSession(data.session);
      
      toast({
        title: "Login bem-sucedido",
        description: "Bem-vindo de volta!",
      });
      
      // Após login bem-sucedido, redirecionar para rota salva ou dashboard
      const savedRoute = localStorage.getItem(LAST_ROUTE_KEY);
      if (savedRoute && savedRoute !== '/' && !savedRoute.includes('/login')) {
        console.log("🚀 Redirecionando para rota salva:", savedRoute);
        navigate(savedRoute);
      } else {
        console.log("🚀 Redirecionando para dashboard");
        navigate("/dashboard");
      }
      
      return { error: null };
    } catch (error) {
      console.error("❌ Erro inesperado durante login:", error);
      return { error };
    }
  };

  // Função para logout
  const signOut = async () => {
    try {
      console.log("🚪 Iniciando processo de logout...");
      await supabase.auth.signOut();
      setSession(null);
      
      // Limpar dados de perfil e outras informações do localStorage
      localStorage.removeItem("perfil");
      localStorage.removeItem("userRole");
      localStorage.removeItem("user");
      
      toast({
        title: "Logout realizado",
        description: "Você saiu da sua conta.",
      });
      
      console.log("👋 Logout concluído, redirecionando...");
      navigate("/login");
    } catch (error) {
      console.error("❌ Erro durante logout:", error);
      toast({
        title: "Erro ao sair",
        description: "Ocorreu um erro ao tentar sair.",
        variant: "destructive",
      });
    }
  };

  const value = {
    session,
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
