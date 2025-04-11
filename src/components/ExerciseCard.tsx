
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  DropdownMenu,
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash2, Clock, Users } from 'lucide-react';

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
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/50 animate-fade-in">
      {exercise.imagem_url && (
        <div className="h-40 overflow-hidden">
          <img 
            src={exercise.imagem_url} 
            alt={exercise.nome}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Replace with placeholder if image fails to load
              (e.target as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
        </div>
      )}
      
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex gap-2 items-center mb-1">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${getCategoryColor(exercise.categoria)}`}>
                {exercise.categoria}
              </span>
            </div>
            
            <h3 className="font-bold text-lg mb-1">{exercise.nome}</h3>
            
            <div className="flex text-xs text-muted-foreground gap-3 mb-2">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{exercise.tempo_estimado} min</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{exercise.numero_jogadores} atletas</span>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground line-clamp-2">
              {truncateText(exercise.objetivo)}
            </p>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none">
              <MoreVertical className="h-5 w-5 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Editar</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive" 
                onClick={onDelete}
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

export default ExerciseCard;
