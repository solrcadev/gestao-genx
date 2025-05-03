
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';

interface RoleProtectedRouteProps {
  allowedRoles: string[];
}

const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, profile, isLoading } = useAuth();

  // While loading, show a spinner
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user has a profile with an allowed role, render the route
  if (profile && 'funcao' in profile && allowedRoles.includes(profile.funcao)) {
    return <Outlet />;
  }

  // If none of the above, redirect to unauthorized page
  return <Navigate to="/unauthorized" replace />;
};

export default RoleProtectedRoute;
