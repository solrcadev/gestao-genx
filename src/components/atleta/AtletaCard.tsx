
import { Link } from 'react-router-dom';
import { Athlete } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronRight } from 'lucide-react';

interface AtletaCardProps {
  atleta: Athlete;
  onClick?: () => void;
}

export function AtletaCard({ atleta, onClick }: AtletaCardProps) {
  const getTeamColor = (team: string) => {
    return team === 'Masculino' ? 'bg-sport-blue' : 'bg-sport-red';
  };

  const getInitials = (name: string) => {
    if (!name) return '';
    
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Link to={`/atleta/${atleta.id}`} className="block" onClick={onClick}>
      <Card className="hover:border-primary transition-colors">
        <CardContent className="flex items-center p-4 gap-3">
          <Avatar className={`h-12 w-12 ${getTeamColor(atleta.time)} text-white`}>
            <AvatarImage src={atleta.foto_url || ''} alt={atleta.nome} />
            <AvatarFallback>{getInitials(atleta.nome)}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate">{atleta.nome}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">{atleta.posicao}</Badge>
              <span className="text-xs text-muted-foreground">{atleta.idade} anos</span>
            </div>
          </div>
          
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  );
}
