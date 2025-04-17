import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Home, Users, Calendar, Settings, FileText } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';

interface NavItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  to: string;
  active: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, to, active }) => (
  <Link to={to} className="flex flex-col items-center justify-center">
    <Icon className={`h-5 w-5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
    <span className={`text-xs ${active ? 'text-primary' : 'text-muted-foreground'}`}>{label}</span>
  </Link>
);

const BottomNavbar = () => {
  const location = useLocation();
  const { profile } = useProfile();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t z-50">
      <div className="flex items-center justify-around p-2">
        <NavItem 
          icon={Home} 
          label="Início" 
          to="/" 
          active={location.pathname === '/'} 
        />
        <NavItem 
          icon={Users} 
          label="Atletas" 
          to="/athletes" 
          active={location.pathname === '/athletes'} 
        />
        <NavItem 
          icon={Calendar} 
          label="Treinos" 
          to="/trainings" 
          active={location.pathname === '/trainings'} 
        />
        
        {(profile?.role === 'coach' || profile?.role === 'trainer') && (
          <NavItem 
            icon={FileText} 
            label="Relatórios" 
            to="/training-reports" 
            active={location.pathname === '/training-reports'} 
          />
        )}
        
        <NavItem 
          icon={Settings} 
          label="Ajustes" 
          to="/settings" 
          active={location.pathname === '/settings'} 
        />
      </div>
    </nav>
  );
};

export default BottomNavbar;
