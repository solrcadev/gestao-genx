
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

interface AthleteCardProps {
  athlete: Athlete;
  onEdit: (athlete: Athlete) => void;
  onDelete: (athlete: Athlete) => void;
}

const AthleteCard = ({ athlete, onEdit, onDelete }: AthleteCardProps) => {
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
    <Card className="card-athlete animate-fade-in">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <Avatar className="w-16 h-16 border-2 border-muted">
              <AvatarImage src={athlete.foto_url || ''} alt={athlete.nome} />
              <AvatarFallback className="text-lg font-semibold">
                {getInitials(athlete.nome)}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h3 className="font-bold text-lg">{athlete.nome}</h3>
              <div className="text-xs text-muted-foreground">
                {athlete.posicao} • {athlete.idade} anos • {athlete.altura}cm
              </div>
              <div className={`mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getTeamColor(athlete.time)}`}>
                {athlete.time}
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none">
              <MoreVertical className="h-5 w-5 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(athlete)}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Editar</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive" 
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
  );
};

export default AthleteCard;
