import { User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AthletePerformance } from '@/types';
import { Link } from 'react-router-dom';

// Tipo para os fundamentos
type Fundamento = 'saque' | 'recepção' | 'levantamento' | 'ataque' | 'bloqueio' | 'defesa';

// Interface para as médias dos fundamentos
interface FundamentoMedia {
  nome: Fundamento;
  media: number;
  totalExecucoes: number;
}

interface AthleteAnalysisProps {
  performanceData: AthletePerformance[] | undefined;
  selectedAthleteId: string | null;
  setSelectedAthleteId: (id: string) => void;
  selectedAthlete: AthletePerformance | undefined;
  mediasFundamentos: FundamentoMedia[];
  team: string;
  onOpenDetailDrawer: () => void;
}

const AthleteAnalysis = ({ 
  performanceData, 
  selectedAthleteId, 
  setSelectedAthleteId, 
  selectedAthlete,
  mediasFundamentos,
  team,
  onOpenDetailDrawer
}: AthleteAnalysisProps) => {
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
  
  // Dados para o gráfico de evolução do atleta selecionado
  // Simulação de dados de evolução (em um caso real, viriam do backend)
  const dadosEvolucao = [
    { mes: 'Jan', percentual: 65 },
    { mes: 'Fev', percentual: 68 },
    { mes: 'Mar', percentual: 72 },
    { mes: 'Abr', percentual: 75 },
    { mes: 'Mai', percentual: 73 },
    { mes: 'Jun', percentual: 78 }
  ];

  return (
    <div className="space-y-6">
      {/* Seletor de atleta */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Selecione um atleta</h2>
        <Select value={selectedAthleteId || ""} onValueChange={setSelectedAthleteId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um atleta" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {performanceData?.map(performance => (
                <SelectItem key={performance.atleta.id} value={performance.atleta.id}>
                  {performance.atleta.nome}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Card>
      
      {selectedAthlete ? (
        <div className="space-y-6">
          {/* Informações do atleta */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{selectedAthlete.atleta.nome}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {selectedAthlete.atleta.posicao} • {team}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-medium mb-2">Evolução de Desempenho</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dadosEvolucao}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="percentual" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          activeDot={{ r: 8 }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-base font-medium mb-3">Desempenho por Fundamento</h3>
                  <div className="space-y-4">
                    {Object.entries(selectedAthlete.avaliacoes.porFundamento).map(([fundamento, avaliacao]) => {
                      const mediaEquipe = mediasFundamentos.find(f => f.nome === fundamento)?.media || 0;
                      
                      return (
                        <div key={fundamento} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="capitalize">{fundamento}</span>
                            <span className={getColorByPercentage(avaliacao.percentualAcerto)}>
                              {avaliacao.percentualAcerto.toFixed(1).replace('.', ',')}%
                            </span>
                          </div>
                          <Progress
                            value={avaliacao.percentualAcerto}
                            className="h-3"
                            indicatorClassName={getBgColorByPercentage(avaliacao.percentualAcerto)}
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Total: {avaliacao.total} execuções</span>
                            <span>Média da equipe: {mediaEquipe.toFixed(1).replace('.', ',')}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Button 
            variant="outline"
            className="w-full"
            onClick={onOpenDetailDrawer}
          >
            Ver relatório completo
          </Button>
          
          <Link to={`/aluno/${selectedAthlete.atleta.id}/performance`} className="w-full">
            <Button 
              variant="default"
              className="w-full"
            >
              Ver desempenho detalhado
            </Button>
          </Link>
        </div>
      ) : (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <User className="h-10 w-10 mb-2 opacity-30" />
            <p>Selecione um atleta para ver os detalhes</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AthleteAnalysis; 