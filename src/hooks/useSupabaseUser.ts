
import { useSupabaseAuth } from './useSupabaseAuth';

export const useSupabaseUser = () => {
  const { user } = useSupabaseAuth();
  return user;
};
