
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface Profile {
  id: string;
  user_id?: string;
  atleta_id?: string;
  funcao: 'tecnico' | 'monitor' | 'atleta';
  status: string;
}

export function useAuth() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile data
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('perfis')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      return null;
    }
  };

  // Load authenticated user on mount
  useEffect(() => {
    // Get current auth state
    const checkUser = async () => {
      try {
        setIsLoading(true);
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          
          // Fetch profile data
          const profileData = await fetchProfile(session.user.id);
          setProfile(profileData);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('Error checking user:', error);
        setUser(null);
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        
        // Fetch profile data when user signs in
        const profileData = await fetchProfile(session.user.id);
        setProfile(profileData);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
      }
    });

    // Clean up subscription
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  return {
    user,
    profile,
    isLoading,
    isTecnico: profile?.funcao === 'tecnico',
    isMonitor: profile?.funcao === 'monitor',
    isAtleta: profile?.funcao === 'atleta',
  };
}
