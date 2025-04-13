import { TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

// Tipo para os fundamentos
type Fundamento = 'saque' | 'recepção' | 'levantamento' | 'ataque' | 'bloqueio' | 'defesa';

// Interface para as médias dos fundamentos
interface FundamentoMedia {
  nome: Fundamento;
  media: number;
  totalExecucoes: number;
}

interface TeamPerformanceSummaryProps {
  mediasFundamentos: FundamentoMedia[];
}

const TeamPerformanceSummary = ({ mediasFundamentos }: TeamPerformanceSummaryProps) => {
  // Função para determinar a cor com base no percentual
  const getColorByPercentage = (value: number) => {
    if (value >= 80) return "text-green-500";
    if (value >= 60) return "text-yellow-500";
    return "text-red-500";
  };
  
  // Função para determinar a cor de fundo com base no percentual
  const getBgColorByPercentage = (value: number) => {
    if (value >= 80) return "bg-green-500";
    if (value >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <section>
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" /> Desempenho por Fundamento
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {mediasFundamentos.map((fundamento) => (
          <Card key={fundamento.nome} className="overflow-hidden">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base capitalize">{fundamento.nome}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="mt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">Média da equipe</span>
                  <span className={`font-semibold ${getColorByPercentage(fundamento.media)}`}>
                    {fundamento.media.toFixed(1).replace('.', ',')}%
                  </span>
                </div>
                <Progress
                  value={fundamento.media}
                  className="h-2.5 mb-3"
                  indicatorClassName={getBgColorByPercentage(fundamento.media)}
                />
                <div className="text-xs text-muted-foreground mt-2">
                  Total de execuções: {fundamento.totalExecucoes}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default TeamPerformanceSummary; 