import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

// Define the type for the context value
interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
}

// Create the context with a default undefined value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component that wraps the application
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Core state
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Navigation and toast
  const navigate = useNavigate();
  const { toast } = useToast();

  // SINGLE useEffect for initialization and auth state changes
  useEffect(() => {
    // Flag to prevent state updates after component unmounts
    let isMounted = true;
    console.log("AuthProvider: useEffect principal INICIADO.");

    async function getInitialSessionAndSetupListener() {
      console.log("AuthProvider: getInitialSessionAndSetupListener - INÍCIO. Setando isLoading (se já não estiver).");
      if (isMounted) setIsLoading(true);

      try {
        // 1. Get the initial session IMMEDIATELY
        console.log("AuthProvider: getInitialSessionAndSetupListener - ANTES de supabase.auth.getSession()");
        const { data: { session: initialSession }, error: getSessionError } = await supabase.auth.getSession();
        console.log("AuthProvider: getInitialSessionAndSetupListener - DEPOIS de supabase.auth.getSession(). Resultado:", { 
          sessionExists: !!initialSession,
          errorExists: !!getSessionError
        });

        if (isMounted) {
          if (getSessionError) {
            console.error("AuthProvider: Erro em getSession():", getSessionError);
            setSession(null);
            setUser(null);
            setUserRole(null);
          } else {
            setSession(initialSession);
            setUser(initialSession?.user ?? null);
            setUserRole(initialSession?.user?.app_metadata?.role || null);
            console.log("AuthProvider: Estado inicial definido. User:", initialSession?.user?.id, "Role:", initialSession?.user?.app_metadata?.role);
          }
        }
      } catch (e) {
        console.error("AuthProvider: EXCEÇÃO GERAL ao buscar sessão inicial:", e);
        if (isMounted) {
          setSession(null);
          setUser(null);
          setUserRole(null);
        }
      } finally {
        // THIS IS THE MOST CRITICAL POINT FOR INFINITE LOADING
        console.log("AuthProvider: BLOCO FINALLY de getInitialSessionAndSetupListener. Definindo isLoading para false.");
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    getInitialSessionAndSetupListener();

    // 2. Setup the listener for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        console.log(`AuthProvider: onAuthStateChange disparado. Evento: ${_event}. Sessão atual:`, currentSession ? "SIM" : "NÃO");
        if (isMounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          setUserRole(currentSession?.user?.app_metadata?.role || null);
        }
      }
    );

    // 3. Cleanup function
    return () => {
      console.log("AuthProvider: useEffect principal LIMPANDO.");
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []); // Empty dependency array is crucial

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Erro ao fazer login:", error.message);
        toast({
          title: "Erro ao fazer login",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      // Get the user role from app_metadata
      const role = data.session?.user?.app_metadata?.role;
      
      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo${role ? ` (${role})` : ''}!`,
      });

      // Navigate to dashboard or saved route
      navigate("/dashboard");
      
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
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Erro ao fazer logout:", error);
        toast({
          title: "Erro ao fazer logout",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Logout realizado com sucesso",
          description: "Você foi desconectado com segurança.",
        });
        navigate("/login");
      }
    } catch (error: any) {
      console.error("Erro ao fazer logout:", error);
      toast({
        title: "Erro ao fazer logout",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Provide the context value
  const value = {
    user,
    session,
    userRole,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
