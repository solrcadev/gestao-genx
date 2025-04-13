import { AlertTriangle, CheckCircle, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
}

const PerformanceAlerts = ({ alertas, onSelectAthlete }: PerformanceAlertsProps) => {
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