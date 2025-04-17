import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { 
  DropdownMenu,
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash2, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface Exercise {
  id: string;
  nome: string;
  categoria: string;
  tempo_estimado: number;
  numero_jogadores: number;
  objetivo: string;
  descricao: string;
  video_url?: string;
  imagem_url?: string;
}

interface ExerciseCardProps {
  exercise: Exercise;
  onEdit: () => void;
  onDelete: () => void;
}

const ExerciseCard = ({ exercise, onEdit, onDelete }: ExerciseCardProps) => {
  const isMobile = useIsMobile();
  
  // Function to get category color
  const getCategoryColor = (category: string) => {
    const categoryColors = {
      "Aquecimento": "bg-amber-500",
      "Defesa": "bg-blue-500",
      "Ataque": "bg-red-500",
      "Técnica": "bg-purple-500",
      "Tática": "bg-green-500",
      "Condicionamento": "bg-orange-500",
      "Jogo": "bg-indigo-500",
      "Outro": "bg-gray-500"
    };
    return categoryColors[category] || "bg-gray-500";
  };

  // Truncate text to specified number of lines
  const truncateText = (text: string, maxLines: number = 2) => {
    const words = text.split(' ');
    const maxChars = maxLines * 50; // Approximate characters per line
    if (text.length <= maxChars) return text;
    
    return words.slice(0, Math.floor(maxChars / (text.length / words.length))).join(' ') + '...';
  };

  return (
    <Card className="card-mobile-friendly animate-scaleIn overflow-hidden h-full flex flex-col card-hover">
      {exercise.imagem_url && (
        <div className="h-40 sm:h-48 w-full overflow-hidden">
          <img 
            src={exercise.imagem_url} 
            alt={exercise.nome}
            className="w-full h-full object-cover transition-transform hover:scale-105"
            loading="lazy"
            onError={(e) => {
              // Replace with placeholder if image fails to load
              (e.target as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
        </div>
      )}
      
      <CardContent className="p-mobile-dense flex-grow">
        <div className="flex justify-between items-start">
          <div className="overflow-hidden">
            <div className="flex gap-2 items-center mb-1">
              <span className={cn(
                "px-2 py-0.5 rounded-full text-xs font-medium text-white truncate max-w-[120px]",
                getCategoryColor(exercise.categoria)
              )}>
                {exercise.categoria}
              </span>
            </div>
            
            <h3 className="font-bold text-responsive mb-1 break-words line-clamp-2">{exercise.nome}</h3>
            
            <div className="flex text-xs text-muted-foreground gap-2 mb-2 flex-wrap">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 flex-shrink-0" />
                <span>{exercise.tempo_estimado} min</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 flex-shrink-0" />
                <span>{exercise.numero_jogadores} atletas</span>
              </div>
            </div>
            
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 break-words">
              {truncateText(exercise.objetivo)}
            </p>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-mobile-dense pt-0 flex justify-end gap-2 mt-auto">
        {isMobile ? (
          <>
            <Button
              size="sm"
              variant="ghost"
              className="touch-feedback flex-1 min-h-[48px]"
              onClick={onEdit}
            >
              <Edit className="h-4 w-4 mr-1.5" />
              <span>Editar</span>
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              className="touch-feedback flex-1 min-h-[48px] text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              <span>Excluir</span>
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              variant="outline"
              className="touch-feedback"
              onClick={onEdit}
            >
              <Edit className="h-3.5 w-3.5 mr-1.5" />
              Editar
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              className="touch-feedback"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Excluir
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
};

export default ExerciseCard;
