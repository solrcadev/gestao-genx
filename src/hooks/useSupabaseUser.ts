
import { useAuth } from '@/contexts/AuthContext';

export const useSupabaseUser = () => {
  const { user } = useAuth();
  return user;
}; 
