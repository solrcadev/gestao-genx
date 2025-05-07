
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Profile = {
  id: string;
  funcao: string;
  atleta_id?: string;
  status?: string;
};

type User = {
  id: string;
  email?: string;
};

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<any>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoading: true,
  signIn: async () => {},
  signOut: async () => {},
  error: null
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.info('Auth state changed:', event);
        setIsLoading(true);

        if (session) {
          setUser({
            id: session.user.id,
            email: session.user.email
          });

          // Fetch user profile data
          const { data: profileData, error } = await supabase
            .from('perfis')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          if (error) {
            console.error('Error fetching user profile:', error);
          } else if (profileData) {
            setProfile(profileData);
          }
        } else {
          setUser(null);
          setProfile(null);
        }

        setIsLoading(false);
      }
    );

    // Initial auth check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser({
          id: session.user.id,
          email: session.user.email
        });

        // Fetch user profile data
        supabase
          .from('perfis')
          .select('*')
          .eq('user_id', session.user.id)
          .single()
          .then(({ data, error }) => {
            if (error) {
              console.error('Error fetching user profile:', error);
            } else if (data) {
              setProfile(data);
            }
            setIsLoading(false);
          });
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setError(error.message);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error: any) {
      setError(error.message);
      return { success: false, error };
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        setError(error.message);
        return { success: false, error };
      }
      
      return { success: true };
    } catch (error: any) {
      setError(error.message);
      return { success: false, error };
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, isLoading, signIn, signOut, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
