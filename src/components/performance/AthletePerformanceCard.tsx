import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { AthletePerformance } from "@/types";
import { Link } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AthletePerformanceCardProps {
  performance: AthletePerformance;
  onClick: () => void;
}

const AthletePerformanceCard = ({ performance, onClick }: AthletePerformanceCardProps) => {
  const { atleta, presenca, avaliacoes } = performance;
  
  // Obter iniciais do nome
  const getInitials = () => {
    const nameParts = atleta.nome.split(' ');
    if (nameParts.length >= 2) {
      return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase();
    }
    return atleta.nome.substring(0, 2).toUpperCase();
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
  
  return (
    <Card 
      className="hover:border-primary/50 transition-all cursor-pointer h-[320px] w-full flex flex-col"
      onClick={onClick}
    >
      <CardContent className="pt-6 flex-1 flex flex-col">
        <div className="flex flex-col items-center gap-4 mb-4">
          <Avatar className="h-16 w-16 border-2 border-primary/30">
            <AvatarImage src={atleta.foto_url || undefined} alt={atleta.nome} />
            <AvatarFallback className="bg-primary/20 text-primary-foreground">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <h3 className="font-semibold text-lg whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
                    {atleta.nome}
                  </h3>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{atleta.nome}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="flex gap-2 items-center justify-center mt-1">
              <span className="text-sm text-muted-foreground">{atleta.posicao}</span>
              <span className="h-1 w-1 bg-muted-foreground rounded-full"></span>
              <span className="text-sm text-muted-foreground">{atleta.time}</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-4 px-2">
          {/* Presença */}
          <div className="mb-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Presença</span>
              <span className="text-sm font-medium">{formatPercent(presenca.percentual)}</span>
            </div>
            <Progress 
              value={presenca.percentual} 
              className="h-2.5"
              indicatorClassName={getProgressColor(presenca.percentual)}
            />
          </div>
          
          {/* Desempenho */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Desempenho</span>
              <span className="text-sm font-medium">{formatPercent(avaliacoes.mediaNota)}</span>
            </div>
            <Progress 
              value={avaliacoes.mediaNota} 
              className="h-2.5"
              indicatorClassName={getProgressColor(avaliacoes.mediaNota)}
            />
          </div>
          
          {/* Estatísticas */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            <div className="text-center p-2 bg-muted/30 rounded-md">
              <p className="text-xs text-muted-foreground mb-1">Treinos</p>
              <p className="font-semibold">{presenca.total}</p>
            </div>
            <div className="text-center p-2 bg-muted/30 rounded-md">
              <p className="text-xs text-muted-foreground mb-1">Avaliações</p>
              <p className="font-semibold">{avaliacoes.total}</p>
            </div>
            <div className="text-center p-2 bg-muted/30 rounded-md">
              <p className="text-xs text-muted-foreground mb-1">Fundamentos</p>
              <p className="font-semibold">{Object.keys(avaliacoes.porFundamento).length}</p>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="border-t py-3 mt-auto">
        <Link 
          to={`/aluno/${atleta.id}/performance`}
          onClick={(e) => e.stopPropagation()}
          className="text-sm text-primary hover:text-primary/80 flex items-center w-full justify-center hover:bg-primary/10 py-1.5 rounded-md transition-colors"
        >
          Ver detalhes
          <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
      </CardFooter>
    </Card>
  );
};

export default AthletePerformanceCard;
