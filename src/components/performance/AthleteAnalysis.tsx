import { User, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';
import { AthletePerformance, TeamType } from '@/types';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { AvaliacaoQualitativa, buscarAvaliacoesQualitativas } from '@/services/rankingQualitativoService';

// Tipo para os fundamentos
type Fundamento = 'saque' | 'recepção' | 'levantamento' | 'ataque' | 'bloqueio' | 'defesa';

// Interface para as médias dos fundamentos
interface FundamentoMedia {
  nome: Fundamento;
  media: number;
  totalExecucoes: number;
  mediaQualitativa?: number;
  totalAvaliacoesQualitativas?: number;
}

interface AthleteAnalysisProps {
  performanceData: AthletePerformance[] | undefined;
  selectedAthleteId: string | null;
  setSelectedAthleteId: (id: string) => void;
  selectedAthlete: AthletePerformance | undefined;
  mediasFundamentos: FundamentoMedia[];
  team: TeamType;
  onOpenDetailDrawer: () => void;
  hideSelector?: boolean;
}

const AthleteAnalysis = ({ 
  performanceData, 
  selectedAthleteId, 
  setSelectedAthleteId, 
  selectedAthlete,
  mediasFundamentos,
  team,
  onOpenDetailDrawer,
  hideSelector = false
}: AthleteAnalysisProps) => {
  const [avaliacoesQualitativas, setAvaliacoesQualitativas] = useState<AvaliacaoQualitativa[]>([]);
  const [isLoadingQualitativas, setIsLoadingQualitativas] = useState(false);
  const [fundamentos, setFundamentos] = useState<Record<string, {
    avaliacaoQuantitativa: number;
    avaliacaoQualitativa?: number;
    avaliacaoQualitativaTexto?: string;
    totalExecucoes: number;
    totalAvaliacoes?: number;
  }>>({});
  
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
  
  // Função para determinar a cor para avaliação qualitativa
  const getColorByQualitativeValue = (value: number) => {
    if (value >= 80) return "text-indigo-500";
    if (value >= 60) return "text-blue-500";
    return "text-purple-500";
  };
  
  // Função para determinar a cor de fundo para avaliação qualitativa
  const getBgColorByQualitativeValue = (value: number) => {
    if (value >= 80) return "bg-indigo-500";
    if (value >= 60) return "bg-blue-500";
    return "bg-purple-500";
  };
  
  // Carregar avaliações qualitativas quando o atleta for selecionado
  useEffect(() => {
    if (!selectedAthleteId) return;
    
    const loadQualitativeData = async () => {
      setIsLoadingQualitativas(true);
      try {
        // Buscar todas as avaliações qualitativas para o atleta
        const avaliacoes = await buscarAvaliacoesQualitativas(team);
        
        // Filtrar apenas as avaliações do atleta selecionado
        const avaliacoesDoAtleta = avaliacoes.filter(av => av.atleta_id === selectedAthleteId);
        setAvaliacoesQualitativas(avaliacoesDoAtleta);
        
        // Processar os dados por fundamento
        if (selectedAthlete) {
          const fundamentos: Record<string, any> = {};
          
          // Preencher com dados quantitativos primeiro
          Object.entries(selectedAthlete.avaliacoes.porFundamento).forEach(([nome, avaliacao]) => {
            fundamentos[nome] = {
              avaliacaoQuantitativa: avaliacao.percentualAcerto,
              totalExecucoes: avaliacao.total
            };
          });
          
          // Adicionar dados qualitativos
          avaliacoesDoAtleta.forEach(av => {
            const fundamento = av.fundamento.toLowerCase();
            if (!fundamentos[fundamento]) {
              fundamentos[fundamento] = {
                avaliacaoQuantitativa: 0,
                totalExecucoes: 0
              };
            }
            
            fundamentos[fundamento].avaliacaoQualitativa = av.nota_percentual;
            fundamentos[fundamento].avaliacaoQualitativaTexto = av.avaliacao_qualitativa;
            fundamentos[fundamento].totalAvaliacoes = av.total_avaliacoes;
          });
          
          setFundamentos(fundamentos);
        }
      } catch (error) {
        console.error('Erro ao carregar avaliações qualitativas:', error);
      } finally {
        setIsLoadingQualitativas(false);
      }
    };
    
    loadQualitativeData();
  }, [selectedAthleteId, selectedAthlete, team]);
  
  // Dados para o gráfico de evolução do atleta selecionado
  // Simulação de dados de evolução (em um caso real, viriam do backend)
  const dadosEvolucao = [
    { mes: 'Jan', percentual: 65, qualitativa: 60 },
    { mes: 'Fev', percentual: 68, qualitativa: 65 },
    { mes: 'Mar', percentual: 72, qualitativa: 70 },
    { mes: 'Abr', percentual: 75, qualitativa: 75 },
    { mes: 'Mai', percentual: 73, qualitativa: 78 },
    { mes: 'Jun', percentual: 78, qualitativa: 82 }
  ];

  return (
    <div className="space-y-6">
      {/* Seletor de atleta - exibido apenas se hideSelector for false */}
      {!hideSelector && (
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
      )}
      
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
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-base font-medium">Evolução de Desempenho</h3>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="w-64">
                          <p className="text-sm">Evolução ao longo do tempo: linha azul representa desempenho quantitativo (taxa de acerto), e linha roxa representa avaliação qualitativa.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dadosEvolucao}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" />
                        <YAxis domain={[0, 100]} />
                        <RechartsTooltip 
                          formatter={(value: number, name: string) => [
                            `${value}%`, 
                            name === "percentual" ? "Quantitativa" : "Qualitativa"
                          ]}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="percentual" 
                          name="Quantitativa"
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          activeDot={{ r: 8 }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="qualitativa" 
                          name="Qualitativa"
                          stroke="#8884d8" 
                          strokeWidth={2}
                          activeDot={{ r: 8 }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-base font-medium">Desempenho por Fundamento</h3>
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
                        <span className="text-xs">Quantitativa</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="inline-block w-3 h-3 rounded-full bg-indigo-500"></span>
                        <span className="text-xs">Qualitativa</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    {Object.entries(fundamentos).map(([fundamento, dados]) => {
                      const mediaEquipe = mediasFundamentos.find(f => f.nome === fundamento as Fundamento)?.media || 0;
                      const mediaQualitativaEquipe = mediasFundamentos.find(f => f.nome === fundamento as Fundamento)?.mediaQualitativa || 0;
                      
                      return (
                        <div key={fundamento} className="space-y-4 border-b border-muted pb-4 last:border-0">
                          <div className="flex justify-between items-center">
                            <span className="capitalize font-medium">{fundamento}</span>
                            
                            {dados.avaliacaoQualitativa && dados.avaliacaoQualitativa > 0 && (
                              <Badge variant="outline" className="bg-primary/10 border-primary/30">
                                {dados.avaliacaoQualitativaTexto}
                              </Badge>
                            )}
                          </div>
                          
                          {/* Avaliação quantitativa */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Quantitativo</span>
                              <span className={getColorByPercentage(dados.avaliacaoQuantitativa)}>
                                {dados.avaliacaoQuantitativa.toFixed(1).replace('.', ',')}%
                              </span>
                            </div>
                            <Progress
                              value={dados.avaliacaoQuantitativa}
                              className="h-2.5"
                              indicatorClassName={getBgColorByPercentage(dados.avaliacaoQuantitativa)}
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Total: {dados.totalExecucoes} execuções</span>
                              <span>Média da equipe: {mediaEquipe.toFixed(1).replace('.', ',')}%</span>
                            </div>
                          </div>
                          
                          {/* Avaliação qualitativa, se disponível */}
                          {dados.avaliacaoQualitativa && dados.avaliacaoQualitativa > 0 && (
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Qualitativo</span>
                                <span className={getColorByQualitativeValue(dados.avaliacaoQualitativa)}>
                                  {dados.avaliacaoQualitativa.toFixed(1).replace('.', ',')}%
                                </span>
                              </div>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="relative">
                                      <Progress
                                        value={dados.avaliacaoQualitativa}
                                        className="h-2.5 cursor-help"
                                        indicatorClassName={getBgColorByQualitativeValue(dados.avaliacaoQualitativa)}
                                      />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Avaliação baseada em {dados.totalAvaliacoes} avaliações técnicas</p>
                                    <p className="mt-1">Classificação: {dados.avaliacaoQualitativaTexto}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Total: {dados.totalAvaliacoes} avaliações</span>
                                <span>Média da equipe: {mediaQualitativaEquipe > 0 ? `${mediaQualitativaEquipe.toFixed(1).replace('.', ',')}%` : 'N/A'}</span>
                              </div>
                            </div>
                          )}
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