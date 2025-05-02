
import { AlertTriangle, CheckCircle, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// Tipo para os fundamentos
type Fundamento = 'saque' | 'recepção' | 'levantamento' | 'ataque' | 'bloqueio' | 'defesa';

// Interface para alertas
interface Alerta {
  atletaId: string;
  nome: string;
  fundamento: Fundamento;
  percentual: number;
  mediaEquipe: number;
}

interface PerformanceAlertsProps {
  alertas: Alerta[];
  onSelectAthlete: (id: string) => void;
  isLoading?: boolean;
}

const PerformanceAlerts = ({ alertas, onSelectAthlete, isLoading = false }: PerformanceAlertsProps) => {
  if (isLoading) {
    return (
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" /> Alertas de Desempenho
        </h2>
        <div className="space-y-3">
          {Array(3).fill(0).map((_, i) => (
            <Card key={i} className="overflow-hidden border-l-4 border-l-destructive">
              <div className="p-4">
                <div className="flex justify-between items-center mb-1">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
                <Skeleton className="h-4 w-32 mb-2" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    );
  }
  
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-destructive" /> Alertas de Desempenho
      </h2>
      
      {alertas.length > 0 ? (
        <div className="space-y-3">
          {alertas.map((alerta) => (
            <Card key={`${alerta.atletaId}-${alerta.fundamento}`} className="overflow-hidden border-l-4 border-l-destructive">
              <div className="p-4">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-medium">{alerta.nome}</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-0 h-8 w-8" 
                    onClick={() => onSelectAthlete(alerta.atletaId)}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
                <p className="text-sm capitalize mb-2">
                  Fundamento: <span className="font-medium">{alerta.fundamento}</span>
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-destructive font-medium">
                    {alerta.percentual.toFixed(1).replace('.', ',')}%
                  </span>
                  <span className="text-muted-foreground">
                    Média da equipe: {alerta.mediaEquipe.toFixed(1).replace('.', ',')}%
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <CheckCircle className="h-10 w-10 mb-2 text-green-500" />
            <p>Nenhum alerta de baixo desempenho!</p>
          </div>
        </Card>
      )}
    </section>
  );
};

export default PerformanceAlerts;
