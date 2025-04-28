import { TrendingUp, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { buscarAvaliacoesQualitativas, AvaliacaoQualitativa } from '@/services/rankingQualitativoService';
import { TeamType } from '@/types';

// Tipo para os fundamentos
type Fundamento = 'saque' | 'recepção' | 'levantamento' | 'ataque' | 'bloqueio' | 'defesa';

// Interface para as médias dos fundamentos
interface FundamentoMedia {
  nome: Fundamento;
  media: number;
  totalExecucoes: number;
  mediaQualitativa?: number; // Nova propriedade para média qualitativa
  totalAvaliacoesQualitativas?: number; // Nova propriedade para total de avaliações qualitativas
}

interface TeamPerformanceSummaryProps {
  mediasFundamentos: FundamentoMedia[];
  team?: TeamType; // Adicionado para buscar avaliações qualitativas
}

const TeamPerformanceSummary = ({ mediasFundamentos, team = "Masculino" }: TeamPerformanceSummaryProps) => {
  const [avaliacoesQualitativas, setAvaliacoesQualitativas] = useState<AvaliacaoQualitativa[]>([]);
  const [isLoadingQualitativas, setIsLoadingQualitativas] = useState(false);
  const [fundamentosComDadosQualitativos, setFundamentosComDadosQualitativos] = useState<FundamentoMedia[]>([]);
  
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
  
  // Carregar avaliações qualitativas ao iniciar
  useEffect(() => {
    const loadQualitativeData = async () => {
      setIsLoadingQualitativas(true);
      try {
        // Buscar todas as avaliações qualitativas para o time
        const avaliacoes = await buscarAvaliacoesQualitativas(team);
        setAvaliacoesQualitativas(avaliacoes);
        
        // Processar os dados por fundamento
        const fundamentos = [...mediasFundamentos];
        
        // Agrupar dados por fundamento
        const dadosPorFundamento: Record<string, { soma: number, total: number, avaliacoes: number }> = {};
        
        avaliacoes.forEach(av => {
          const fundamento = av.fundamento.toLowerCase();
          if (!dadosPorFundamento[fundamento]) {
            dadosPorFundamento[fundamento] = { soma: 0, total: 0, avaliacoes: 0 };
          }
          
          dadosPorFundamento[fundamento].soma += av.nota_percentual;
          dadosPorFundamento[fundamento].total++;
          dadosPorFundamento[fundamento].avaliacoes += av.total_avaliacoes;
        });
        
        // Atualizar mediasFundamentos com os dados qualitativos
        fundamentos.forEach(fund => {
          const normalizadoFundamento = fund.nome === 'passe' as Fundamento ? ['passe', 'recepção'] : [fund.nome];
          
          // Procurar em todos os nomes normalizados
          normalizadoFundamento.forEach(nomeFund => {
            if (dadosPorFundamento[nomeFund]) {
              // Se encontrou dados, calcula a média
              const media = dadosPorFundamento[nomeFund].total > 0 
                ? dadosPorFundamento[nomeFund].soma / dadosPorFundamento[nomeFund].total 
                : 0;
              
              fund.mediaQualitativa = media;
              fund.totalAvaliacoesQualitativas = dadosPorFundamento[nomeFund].avaliacoes;
            }
          });
        });
        
        setFundamentosComDadosQualitativos(fundamentos);
      } catch (error) {
        console.error('Erro ao carregar avaliações qualitativas:', error);
      } finally {
        setIsLoadingQualitativas(false);
      }
    };
    
    loadQualitativeData();
  }, [mediasFundamentos, team]);
  
  // Dados a exibir (originais ou atualizados com qualitativo)
  const dadosExibicao = fundamentosComDadosQualitativos.length > 0 
    ? fundamentosComDadosQualitativos
    : mediasFundamentos;

  return (
    <section>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" /> Desempenho por Fundamento
        </h2>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                <Info className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Sobre os dados</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div className="space-y-2">
                <p className="font-medium">Dois tipos de avaliação:</p>
                <p><span className="text-green-500 font-medium">■</span> <strong>Quantitativa:</strong> Taxa de acerto das execuções (acertos ÷ total)</p>
                <p><span className="text-indigo-500 font-medium">■</span> <strong>Qualitativa:</strong> Avaliação técnica dos treinadores</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {dadosExibicao.map((fundamento) => (
          <Card key={fundamento.nome} className="overflow-hidden">
            <CardHeader className="p-4 pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base capitalize">{fundamento.nome}</CardTitle>
                {fundamento.mediaQualitativa && fundamento.mediaQualitativa > 0 && (
                  <Badge variant="outline" className="text-xs bg-primary/10 border-primary/30">
                    {fundamento.totalAvaliacoesQualitativas} aval. qualitativas
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="mt-2 space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                      Quantitativa
                    </span>
                    <span className={`font-semibold ${getColorByPercentage(fundamento.media)}`}>
                      {fundamento.media.toFixed(1).replace('.', ',')}%
                    </span>
                  </div>
                  <Progress
                    value={fundamento.media}
                    className="h-2.5 mb-1"
                    indicatorClassName={getBgColorByPercentage(fundamento.media)}
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Total de execuções: {fundamento.totalExecucoes}
                  </div>
                </div>
                
                {/* Exibir dados qualitativos se disponíveis */}
                {fundamento.mediaQualitativa && fundamento.mediaQualitativa > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm flex items-center gap-1">
                        <span className="inline-block w-2 h-2 rounded-full bg-indigo-500"></span>
                        Qualitativa
                      </span>
                      <span className={`font-semibold ${getColorByQualitativeValue(fundamento.mediaQualitativa)}`}>
                        {fundamento.mediaQualitativa.toFixed(1).replace('.', ',')}%
                      </span>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <Progress
                              value={fundamento.mediaQualitativa}
                              className="h-2.5 mb-1 cursor-help"
                              indicatorClassName={getBgColorByQualitativeValue(fundamento.mediaQualitativa)}
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Avaliação técnica baseada nos critérios dos treinadores</p>
                          <p className="mt-1">Considera fatores como qualidade técnica, decisões táticas e eficiência</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {isLoadingQualitativas && (
        <p className="text-sm text-muted-foreground mt-2 text-center">
          Carregando avaliações qualitativas...
        </p>
      )}
    </section>
  );
};

export default TeamPerformanceSummary; 