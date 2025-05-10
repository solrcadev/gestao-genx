import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { 
  DropdownMenu,
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash2, Clock, Users, Youtube, PlayCircle, Instagram, Tag, BarChart2, Calendar, History, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import VideoModal from './ui/video-modal';
import { getVideoPlatform } from '@/utils/video-utils';
import { formatExerciseDate } from '@/services/exerciseService';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import RoleBasedAccess from '@/components/RoleBasedAccess';

interface Exercise {
  id: string;
  nome: string;
  categoria: string;
  tempo_estimado: number;
  numero_jogadores: number;
  objetivo: string;
  descricao: string;
  video_url?: string;
  video_inicio?: string;
  video_fim?: string;
  imagem_url?: string;
  fundamentos?: string[];
  dificuldade?: string;
  checklist_tecnico?: string[];
  contagem_uso?: number;
  ultima_vez_usado?: string | null;
}

interface ExerciseCardProps {
  exercise: Exercise;
  onEdit: () => void;
  onDelete: () => void;
}

const ExerciseCard = ({ exercise, onEdit, onDelete }: ExerciseCardProps) => {
  const isMobile = useIsMobile();
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  
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

  // Function to get fundamento color
  const getFundamentoColor = (fundamento: string) => {
    const fundamentoColors = {
      "Levantamento": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      "Recepção": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      "Defesa": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      "Saque": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      "Ataque": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      "Bloqueio": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      "Deslocamento": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
      "Comunicação": "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300"
    };
    return fundamentoColors[fundamento] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  };

  // Function to get dificuldade color and styles
  const getDificuldadeStyles = (dificuldade: string) => {
    const styles = {
      "Iniciante": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
      "Intermediário": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
      "Avançado": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800"
    };
    
    return styles[dificuldade] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700";
  };

  // Truncate text to specified number of lines
  const truncateText = (text: string, maxLines: number = 2) => {
    const words = text.split(' ');
    const maxChars = maxLines * 50; // Approximate characters per line
    if (text.length <= maxChars) return text;
    
    return words.slice(0, Math.floor(maxChars / (text.length / words.length))).join(' ') + '...';
  };

  // Verificar se tem vídeo e qual plataforma
  const hasVideo = !!exercise.video_url;
  const videoPlatform = getVideoPlatform(exercise.video_url || '');

  // Determinando ícone com base na plataforma
  const getVideoIcon = () => {
    switch (videoPlatform) {
      case 'youtube':
        return <Youtube className="h-4 w-4 mr-2" />;
      case 'instagram':
        return <Instagram className="h-4 w-4 mr-2" />;
      default:
        return <PlayCircle className="h-4 w-4 mr-2" />;
    }
  };

  /**
   * Renderiza as estatísticas de uso do exercício
   */
  const renderUsoStats = () => {
    // Exercício nunca usado
    if (!exercise.contagem_uso || exercise.contagem_uso === 0) {
      return (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
          <History className="h-3.5 w-3.5 flex-shrink-0" />
          <span>Nunca utilizado</span>
        </div>
      );
    }
    
    // Usado, mas sem data (caso improvável, mas para robustez)
    if (!exercise.ultima_vez_usado) {
      return (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
          <History className="h-3.5 w-3.5 flex-shrink-0" />
          <span>
            Usado em {exercise.contagem_uso} {exercise.contagem_uso === 1 ? 'treino' : 'treinos'}
          </span>
        </div>
      );
    }
    
    // Caso completo: usado com data
    const dataFormatada = formatExerciseDate(exercise.ultima_vez_usado);
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
        <History className="h-3.5 w-3.5 flex-shrink-0" />
        <span>
          Usado em {exercise.contagem_uso} {exercise.contagem_uso === 1 ? 'treino' : 'treinos'}. 
          {dataFormatada && (
            <>
              <span className="mx-1">·</span>
              <span className="inline-flex items-center">
                <Calendar className="h-3 w-3 mr-0.5" /> 
                Último: {dataFormatada}
              </span>
            </>
          )}
        </span>
      </div>
    );
  };

  return (
    <>
      <Card className="card-mobile-friendly animate-scaleIn overflow-hidden h-full flex flex-col card-hover shadow">
        {/* Área de imagem ou prévia do vídeo */}
        <div className="h-48 w-full overflow-hidden relative bg-gray-100 dark:bg-gray-800">
          {exercise.imagem_url ? (
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
          ) : hasVideo ? (
            // Mini prévia para vídeo (thumbnail gerado do YouTube)
            <div className="relative w-full h-full flex justify-center items-center">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50"></div>
              {/* Botão de play sobreposto */}
              <Button 
                variant="outline" 
                size="lg" 
                className="absolute z-10 rounded-full p-2 bg-white/90 text-primary hover:bg-white hover:scale-105 transition-all shadow-lg"
                onClick={() => setVideoModalOpen(true)}
                aria-label="Reproduzir vídeo"
              >
                <PlayCircle className="h-10 w-10" />
              </Button>
              {/* Título do exercício sobreposto */}
              <div className="absolute bottom-0 left-0 right-0 p-3 text-white z-10">
                <h4 className="font-medium text-sm truncate">{exercise.nome}</h4>
                <p className="text-xs opacity-90">{exercise.tempo_estimado}min</p>
              </div>
              
              {/* Indicador de plataforma */}
              {videoPlatform !== 'outro' && (
                <div className="absolute top-2 right-2 z-10">
                  <div className={`rounded-full p-1 ${videoPlatform === 'youtube' ? 'bg-red-500' : 'bg-gradient-to-tr from-purple-500 to-pink-500'} text-white`}>
                    {videoPlatform === 'youtube' ? 
                      <Youtube className="h-3 w-3" /> : 
                      <Instagram className="h-3 w-3" />
                    }
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Placeholder para quando não há imagem nem vídeo
            <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
              <div className="text-center p-4">
                <div className="h-10 w-10 mx-auto mb-2 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Sem visualização</p>
              </div>
            </div>
          )}
        </div>
        
        <CardContent className="p-4 flex-grow">
          <div>
            <div className="flex gap-2 items-center justify-between mb-2">
              <span className={cn(
                "px-2 py-0.5 rounded-full text-xs md:text-sm font-medium text-white truncate max-w-[120px]",
                getCategoryColor(exercise.categoria)
              )}>
                {exercise.categoria}
              </span>
              
              {/* Badge de nível de dificuldade */}
              {exercise.dificuldade && (
                <span 
                  className={cn(
                    "px-2 py-0.5 text-xs font-medium rounded-full flex items-center gap-1 border",
                    getDificuldadeStyles(exercise.dificuldade)
                  )}
                >
                  <BarChart2 className="h-3 w-3" />
                  {exercise.dificuldade}
                </span>
              )}
            </div>
            
            <h3 className="font-bold text-base md:text-lg mb-2 break-words line-clamp-2">{exercise.nome}</h3>
            
            <div className="flex text-xs md:text-sm text-muted-foreground gap-3 mb-2 flex-wrap">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span>{exercise.tempo_estimado} min</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 flex-shrink-0" />
                <span>{exercise.numero_jogadores} atletas</span>
              </div>
            </div>
            
            <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 break-words mb-3">
              {truncateText(exercise.objetivo)}
            </p>

            {/* Exibir etiquetas de fundamentos técnicos */}
            {exercise.fundamentos && exercise.fundamentos.length > 0 && (
              <div className="mt-2 mb-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-medium">Fundamentos</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {exercise.fundamentos.map(fundamento => (
                    <span 
                      key={fundamento} 
                      className={cn(
                        "px-1.5 py-0.5 rounded-full text-xs font-medium",
                        getFundamentoColor(fundamento)
                      )}
                    >
                      {fundamento}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Checklist Técnico (Pontos de Atenção) */}
            {exercise.checklist_tecnico && exercise.checklist_tecnico.length > 0 && (
              <div className="mt-2 mb-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <CheckCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-medium">
                    Pontos de Atenção ({exercise.checklist_tecnico.length})
                  </span>
                </div>
                <TooltipProvider>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 text-xs flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Ver checklist técnico
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-sm">
                      <div className="text-sm font-medium mb-1">Checklist Técnico:</div>
                      <ul className="list-disc pl-5 text-xs space-y-1">
                        {exercise.checklist_tecnico.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
            
            {/* Estatísticas de uso */}
            {renderUsoStats()}

            {/* Botão de Ver Vídeo grande e chamativo quando tem vídeo */}
            {hasVideo && (
              <Button 
                variant="default" 
                size="sm"
                className={`w-full text-white mt-3 ${
                  videoPlatform === 'youtube' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : videoPlatform === 'instagram' 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' 
                      : 'bg-blue-600 hover:bg-blue-700'
                }`}
                onClick={() => setVideoModalOpen(true)}
              >
                {getVideoIcon()}
                Ver Vídeo Completo
              </Button>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="p-4 pt-0 flex justify-end gap-2 mt-auto border-t">
          <RoleBasedAccess allowedRoles={['tecnico']}>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={onEdit}
          >
            <Edit className="h-4 w-4 mr-1.5" />
            <span>Editar</span>
          </Button>
          </RoleBasedAccess>
          
          <RoleBasedAccess allowedRoles={['tecnico']}>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-destructive hover:bg-destructive/10"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            <span>Excluir</span>
          </Button>
          </RoleBasedAccess>
        </CardFooter>
      </Card>

      {/* Modal de vídeo */}
      <VideoModal 
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        videoUrl={exercise.video_url || ''}
        videoTitle={exercise.nome}
        inicio={exercise.video_inicio}
        fim={exercise.video_fim}
      />
    </>
  );
};

export default ExerciseCard;
