
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<any>;
  error: string | null;
  session: any;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
  error: null,
  session: null
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.info('Auth state changed:', event);
        setLoading(true);

        if (session) {
          setUser({
            id: session.user.id,
            email: session.user.email
          });
          setSession(session);
        } else {
          setUser(null);
          setSession(null);
        }

        setLoading(false);
      }
    );

    // Initial auth check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser({
          id: session.user.id,
          email: session.user.email
        });
        setSession(session);
      }
      setLoading(false);
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
    <AuthContext.Provider value={{ user, loading, signIn, signOut, error, session }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
