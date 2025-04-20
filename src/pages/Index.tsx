
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/LoadingSpinner';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Try to get the last route the user was on
        const lastRoute = localStorage.getItem('lastRoute');
        if (lastRoute && lastRoute !== '/') {
          navigate(lastRoute);
        } else {
          navigate("/dashboard");
        }
      } else {
        navigate("/login");
      }
    }
  }, [navigate, user, loading]);

  // Show a loading state while checking authentication
  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <LoadingSpinner />
        <p className="mt-4 text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  // This will only show briefly before redirect happens
  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-4">Bem-vindo ao GEN X</h1>
      <p className="mb-6 text-muted-foreground">Redirecionando...</p>
      <div className="flex gap-4">
        <Button onClick={() => navigate('/login')}>Login</Button>
        <Button onClick={() => navigate('/dashboard')} variant="outline">Dashboard</Button>
      </div>
    </div>
  );
};

export default Index;
