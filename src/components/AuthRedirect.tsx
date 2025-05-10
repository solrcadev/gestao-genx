import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

/**
 * AuthRedirect component 
 * 
 * This component checks the authentication state and redirects:
 * - Show loading spinner while authentication state is being checked
 * - Redirect to /dashboard if user is authenticated
 * - Redirect to /login if user is not authenticated
 */
const AuthRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  
  // Log the auth state for debugging
  useEffect(() => {
    console.log('AuthRedirect: Auth state -', { 
      isLoading, 
      isAuthenticated: !!user,
      location: location.pathname 
    });
  }, [isLoading, user, location]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // After loading is complete, redirect based on auth state
  if (user) {
    console.log('AuthRedirect: Redirecting to dashboard (user is authenticated)');
    return <Navigate to="/dashboard" replace />;
  } else {
    console.log('AuthRedirect: Redirecting to login (user is not authenticated)');
    return <Navigate to="/login" replace />;
  }
};

export default AuthRedirect; 