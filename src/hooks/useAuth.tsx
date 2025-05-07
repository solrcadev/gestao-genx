
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { useToast } from '@/components/ui/use-toast';

type Profile = {
  id: string;
  funcao: string;
  atleta_id?: string;
  status?: string;
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<any>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  signIn: async () => {},
  signOut: async () => {},
  error: null
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Configurar primeiro o listener de mudança de estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.info('Auth state changed:', event);
        
        // Atualizar estado da sessão e usuário
        setSession(currentSession);
        setUser(currentSession?.user || null);
        
        // Se temos um usuário, buscar os dados do perfil
        if (currentSession?.user) {
          fetchUserProfile(currentSession.user.id);
        } else {
          // Se não temos usuário, limpar o perfil
          setProfile(null);
          setIsLoading(false);
        }
      }
    );

    // Verificação inicial de sessão
    const initialSessionCheck = async () => {
      setIsLoading(true);
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          await fetchUserProfile(currentSession.user.id);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error checking initial session:', error);
        setIsLoading(false);
      }
    };

    initialSessionCheck();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Função para buscar o perfil do usuário
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('perfis')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        setProfile(null);
      } else if (data) {
        setProfile(data);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setError(error.message);
        toast({
          title: "Erro ao fazer login",
          description: error.message,
          variant: "destructive"
        });
        setIsLoading(false);
        return { success: false, error };
      }

      // A sessão e o usuário serão atualizados pelo listener onAuthStateChange
      return { success: true, data };
    } catch (error: any) {
      setError(error.message);
      toast({
        title: "Erro ao fazer login",
        description: error.message,
        variant: "destructive"
      });
      setIsLoading(false);
      return { success: false, error };
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        setError(error.message);
        toast({
          title: "Erro ao fazer logout",
          description: error.message,
          variant: "destructive"
        });
        setIsLoading(false);
        return { success: false, error };
      }
      
      // A sessão e o usuário serão limpos pelo listener onAuthStateChange
      return { success: true };
    } catch (error: any) {
      setError(error.message);
      toast({
        title: "Erro ao fazer logout",
        description: error.message,
        variant: "destructive"
      });
      setIsLoading(false);
      return { success: false, error };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      profile, 
      isLoading, 
      signIn, 
      signOut, 
      error 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
