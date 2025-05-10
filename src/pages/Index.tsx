import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";

const Index = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  console.log("Index component: isLoading:", isLoading, "User:", user);

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        console.log("Index: User is authenticated, redirecting to dashboard");
        navigate("/dashboard");
      } else {
        console.log("Index: User is NOT authenticated, redirecting to login");
        navigate("/login");
      }
    }
  }, [navigate, user, isLoading]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // This return should not be visible as we're redirecting in the useEffect
  return null;
};

export default Index;
