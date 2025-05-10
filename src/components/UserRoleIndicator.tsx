import { useAuth } from '@/contexts/AuthContext';
import { Shield, UserCheck } from 'lucide-react';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

const UserRoleIndicator = () => {
  const { userRole } = useAuth();

  if (!userRole) return null;

  const roleIcons = {
    'tecnico': <Shield className="h-4 w-4 mr-1" />,
    'monitor': <UserCheck className="h-4 w-4 mr-1" />
  };

  const roleColors = {
    'tecnico': 'bg-blue-50 text-blue-700 hover:bg-blue-100',
    'monitor': 'bg-green-50 text-green-700 hover:bg-green-100'
  };

  const icon = roleIcons[userRole as keyof typeof roleIcons] || <UserCheck className="h-4 w-4 mr-1" />;
  const colorClass = roleColors[userRole as keyof typeof roleColors] || 'bg-gray-50 text-gray-700 hover:bg-gray-100';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`cursor-help ${colorClass}`}
          >
            {icon}
            {userRole}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Papel de usuário definido no Supabase</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default UserRoleIndicator; 