
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

// Define our own interface for Profile
interface Profile {
  id: string;
  user_id: string;
  funcao: string; // Use 'funcao' instead of 'role'
  atleta_id?: string;
  status: string;
}

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}

const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  children,
  allowedRoles,
  redirectTo = '/login',
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    async function checkUserRole() {
      try {
        const { data: authData } = await supabase.auth.getSession();

        if (!authData.session?.user) {
          setIsAllowed(false);
          setIsLoading(false);
          return;
        }

        // Get user profile to check role/function
        const { data: profile, error } = await supabase
          .from('perfis')
          .select('*')
          .eq('user_id', authData.session.user.id)
          .single();

        if (error || !profile) {
          console.error('Error fetching user profile or profile not found:', error);
          setIsAllowed(false);
          setIsLoading(false);
          return;
        }

        // Using 'funcao' instead of 'role'
        setIsAllowed(allowedRoles.includes(profile.funcao));
        setIsLoading(false);
      } catch (error) {
        console.error('Error in role protection:', error);
        setIsAllowed(false);
        setIsLoading(false);
      }
    }

    checkUserRole();
  }, [allowedRoles]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAllowed) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default RoleProtectedRoute;
