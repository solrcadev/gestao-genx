
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { AthletePerformance } from "@/types";

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
      className="hover:border-primary/50 transition-all cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-12 w-12 border-2 border-primary/30">
            <AvatarImage src={atleta.foto_url || undefined} alt={atleta.nome} />
            <AvatarFallback className="bg-primary/20 text-primary-foreground">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold line-clamp-1">{atleta.nome}</h3>
            <div className="flex gap-2 items-center">
              <span className="text-sm text-muted-foreground">{atleta.posicao}</span>
              <span className="h-1 w-1 bg-muted-foreground rounded-full"></span>
              <span className="text-sm text-muted-foreground">{atleta.time}</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          {/* Presença */}
          <div>
            <div className="flex justify-between items-center mb-1">
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
            <div className="flex justify-between items-center mb-1">
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
          <div className="flex justify-between pt-2">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Treinos</p>
              <p className="font-semibold">{presenca.total}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Avaliações</p>
              <p className="font-semibold">{avaliacoes.total}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Fundamentos</p>
              <p className="font-semibold">{Object.keys(avaliacoes.porFundamento).length}</p>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="border-t pt-3 pb-3">
        <button className="text-xs text-primary flex items-center w-full justify-center">
          Ver detalhes
          <ChevronRight className="h-3 w-3 ml-1" />
        </button>
      </CardFooter>
    </Card>
  );
};

export default AthletePerformanceCard;
