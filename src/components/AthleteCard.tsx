import { Athlete } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { 
  DropdownMenu,
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Transition } from '@/components/ui/transition';
import { useIsMobile } from '@/lib/responsive';

interface AthleteCardProps {
  athlete: Athlete;
  onEdit: (athlete: Athlete) => void;
  onDelete: (athlete: Athlete) => void;
  index?: number;
}

const AthleteCard = ({ athlete, onEdit, onDelete, index = 0 }: AthleteCardProps) => {
  const isMobile = useIsMobile();
  
  const getInitials = (name: string) => {
    if (!name) return ''; // Add null check to prevent split on undefined
    
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getTeamColor = (team: string) => {
    return team === 'Masculino' ? 'bg-sport-blue' : 'bg-sport-red';
  };

  return (
    <Transition type="slide" delay={index * 0.05}>
      <Card className="card-athlete card-hover touch-feedback">
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12 sm:w-16 sm:h-16 border-2 border-muted transition-all">
                <AvatarImage src={athlete.foto_url || ''} alt={athlete.nome} />
                <AvatarFallback className={`text-base sm:text-lg font-semibold ${getTeamColor(athlete.time)}`}>
                  {getInitials(athlete.nome)}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h3 className="font-bold text-base sm:text-lg line-clamp-1">{athlete.nome}</h3>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {athlete.posicao} • {athlete.idade} anos • {athlete.altura}cm
                </div>
                <div className={`mt-1.5 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getTeamColor(athlete.time)}`}>
                  {athlete.time}
                </div>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger className="focus:outline-none">
                <div className="p-1 rounded-full hover:bg-muted transition-all">
                  <MoreVertical className="h-5 w-5 text-muted-foreground" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(athlete)} className="cursor-pointer">
                  <Edit className="mr-2 h-4 w-4" />
                  <span>Editar</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive cursor-pointer" 
                  onClick={() => onDelete(athlete)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Excluir</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </Transition>
  );
};

export default AthleteCard;
