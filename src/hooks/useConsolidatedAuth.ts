
import { useContext } from 'react';
import { useSupabaseAuth } from './useSupabaseAuth';
import { useAuth } from '@/contexts/AuthContext';

/**
 * This hook consolidates both auth implementations to ensure 
 * consistent access to auth functionality across the app.
 * It prioritizes the context-based auth but falls back to the hooks-based auth.
 */
export const useConsolidatedAuth = () => {
  const contextAuth = useAuth();
  const hooksAuth = useSupabaseAuth();

  // Check which implementation has user data
  const user = contextAuth.user || hooksAuth.user;
  const profile = hooksAuth.profile;
  const isLoading = contextAuth.loading || hooksAuth.isLoading;
  
  // Use the signOut function from whichever implementation is available
  const signOut = contextAuth.signOut || hooksAuth.signOut;

  return {
    user,
    profile,
    isLoading,
    signOut,
    // Include role-specific helpers from useSupabaseAuth
    isTecnico: profile?.funcao === 'tecnico',
    isMonitor: profile?.funcao === 'monitor',
    isAtleta: profile?.funcao === 'atleta',
  };
};
