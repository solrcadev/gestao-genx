import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ChevronRight, Award, Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { AthletePerformance } from "@/types";
import { Link } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface AthletePerformanceCardProps {
  performance: AthletePerformance;
  onClick: (id: string) => void;
}

const AthletePerformanceCard = ({ performance, onClick }: AthletePerformanceCardProps) => {
  const { atleta, presenca, avaliacoes } = performance;
  const isMobile = useIsMobile();
  
  // Obter iniciais do nome
  const getInitials = (name: string) => {
    const nameParts = name.split(' ');
    if (nameParts.length >= 2) {
      return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  // Formatar percentual com 1 casa decimal
  const formatPercent = (value: number) => {
    return value.toFixed(1).replace('.', ',') + '%';
  };
  
  // Determinar a cor da barra de progresso com base no percentual
  const getProgressColor = (value: number) => {
    if (value >= 80) return "bg-green-500";
    if (value >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };
  
  const handleCardClick = () => {
    onClick(atleta.id);
  };
  
  return (
    <Card 
      className={cn(
        "card-mobile-friendly card-hover animate-scaleIn h-full",
        "transition-all duration-200",
        isMobile && "active:scale-95 active:opacity-80"
      )}
      onClick={isMobile ? handleCardClick : undefined}
    >
      <CardContent className="p-mobile-dense">
        <div className="flex flex-col items-center text-center mb-4">
          <div className="relative">
            <Avatar className="h-16 w-16 mb-2 border-2 border-primary/20">
              <AvatarImage src={atleta.foto_url || undefined} alt={atleta.nome} />
              <AvatarFallback>{getInitials(atleta.nome)}</AvatarFallback>
            </Avatar>
            {presenca.percentual >= 85 && (
              <div className="absolute -top-1 -right-1 bg-primary rounded-full h-6 w-6 flex items-center justify-center shadow-sm">
                <Award className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
          
          <h3 className="font-semibold text-base truncate max-w-full mb-0.5">{atleta.nome}</h3>
          <div className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
            <Users className="h-3.5 w-3.5" />
            <span className="truncate">{atleta.posicao}</span>
          </div>
        </div>
        
        <div className="space-y-3 px-0.5">
          {/* Presença */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-muted-foreground">Presença</span>
              <span className="text-xs font-medium">{formatPercent(presenca.percentual)}</span>
            </div>
            <Progress 
              value={presenca.percentual} 
              className="h-2"
              indicatorClassName={getProgressColor(presenca.percentual)}
            />
          </div>
          
          {/* Desempenho */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-muted-foreground">Desempenho</span>
              <span className="text-xs font-medium">{formatPercent(avaliacoes.mediaNota)}</span>
            </div>
            <Progress 
              value={avaliacoes.mediaNota} 
              className="h-2"
              indicatorClassName={getProgressColor(avaliacoes.mediaNota)}
            />
          </div>
          
          {/* Estatísticas */}
          <div className="grid grid-cols-3 gap-1.5 pt-1.5">
            <div className="text-center py-1.5 px-1 bg-muted/30 rounded-md">
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5">Treinos</p>
              <p className="font-semibold text-sm">{presenca.total}</p>
            </div>
            <div className="text-center py-1.5 px-1 bg-muted/30 rounded-md">
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5">Avaliações</p>
              <p className="font-semibold text-sm">{avaliacoes.total}</p>
            </div>
            <div className="text-center py-1.5 px-1 bg-muted/30 rounded-md">
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5">Fundamentos</p>
              <p className="font-semibold text-sm">{Object.keys(avaliacoes.porFundamento).length}</p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-mobile-dense pt-0">
        {!isMobile && (
          <Button
            variant="outline"
            size="sm"
            className="w-full touch-feedback"
            onClick={() => onClick(atleta.id)}
          >
            Ver Detalhes
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default AthletePerformanceCard;
