import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Add diagnostic logging
  useEffect(() => {
    console.log("ProtectedRoute:", {
      path: location.pathname,
      isLoading, 
      isAuthenticated: !!user
    });
  }, [isLoading, user, location.pathname]);

  // Show loading screen while checking authentication
  if (isLoading) {
    console.log("ProtectedRoute: Still loading, showing spinner");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    console.log("ProtectedRoute: Not authenticated, redirecting to login");
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Render the protected route if authenticated
  console.log("ProtectedRoute: Authenticated, rendering protected content");
  return <>{children}</>;
};

export default ProtectedRoute;
