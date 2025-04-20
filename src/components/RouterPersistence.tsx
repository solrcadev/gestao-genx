
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface RouterPersistenceProps {
  children: React.ReactNode;
}

const RouterPersistence: React.FC<RouterPersistenceProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Save current route to localStorage whenever it changes
  useEffect(() => {
    // Only save non-login routes to prevent redirect loops
    if (location.pathname !== '/login' && 
        location.pathname !== '/forgot-password' &&
        location.pathname !== '/register') {
      localStorage.setItem('lastRoute', location.pathname);
    }
  }, [location.pathname]);

  return <>{children}</>;
};

export default RouterPersistence;
