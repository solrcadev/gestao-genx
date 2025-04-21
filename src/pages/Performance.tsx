import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart2, Search, X, Users, User, Trophy } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton, CardSkeleton } from '@/components/ui/skeleton';
import { getAthletesPerformance } from '@/services/performanceService';
import { TeamType, AthletePerformance } from '@/types';
import AthletePerformanceDetail from '@/components/performance/AthletePerformanceDetail';
import TeamPerformanceSummary from '@/components/performance/TeamPerformanceSummary';
import TopAthletesSection from '@/components/performance/TopAthletesSection';
import PerformanceAlerts from '@/components/performance/PerformanceAlerts';
import AthleteAnalysis from '@/components/performance/AthleteAnalysis';
import AthleteRanking from '@/components/performance/AthleteRanking';
import RankingFundamentos from '@/components/performance/RankingFundamentos';
import { IndividualView } from '@/components/performance/content/IndividualView';

// Tipo para os fundamentos
type Fundamento = 'saque' | 'recepção' | 'levantamento' | 'ataque' | 'bloqueio' | 'defesa';

// Interface para as médias dos fundamentos
interface FundamentoMedia {
  nome: Fundamento;
  media: number;
  totalExecucoes: number;
}

// Tipo para abas de análise
type AnalysisTab = 'equipe' | 'individual' | 'ranking';

const Performance = () => {
  const [team, setTeam] = useState<TeamType>("Masculino");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AnalysisTab>('equipe');
  const [fundamentoSelecionado, setFundamentoSelecionado] = useState<Fundamento>('saque');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date()
  });

  // Buscar dados de desempenho dos atletas
  const { data: performanceData, isLoading, error, refetch } = useQuery({
    queryKey: ['athletePerformance', team],
    queryFn: async () => {
      try {
        console.log('Iniciando consulta de desempenho');
        const data = await getAthletesPerformance(team);
        console.log(`Dados recuperados: ${data?.length || 0} atletas`);
        setErrorMessage(null);
        return data;
      } catch (error) {
        console.error('Erro na consulta de desempenho:', error);
        if (error instanceof Error) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage('Erro ao buscar dados de desempenho');
        }
        throw error;
      }
    },
  });

  // Filtrar atletas com base na busca
  const filteredAthletes = performanceData?.filter(performance => 
    performance.atleta.nome.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Lidar com a seleção de um atleta
  const handleSelectAthlete = (athleteId: string) => {
    setSelectedAthleteId(athleteId);
    setActiveTab('individual');
  };

  // Encontrar o atleta selecionado
  const selectedAthlete = performanceData?.find(
    performance => performance.atleta.id === selectedAthleteId
  );
  
  // Calcular médias de fundamentos do time
  const mediasFundamentos = (() => {
    if (!performanceData) return [];
    
    const fundamentos: FundamentoMedia[] = [
      { nome: 'saque' as Fundamento, media: 0, totalExecucoes: 0 },
      { nome: 'recepção' as Fundamento, media: 0, totalExecucoes: 0 },
      { nome: 'levantamento' as Fundamento, media: 0, totalExecucoes: 0 },
      { nome: 'ataque' as Fundamento, media: 0, totalExecucoes: 0 },
      { nome: 'bloqueio' as Fundamento, media: 0, totalExecucoes: 0 },
      { nome: 'defesa' as Fundamento, media: 0, totalExecucoes: 0 }
    ];
    
    // Calcular a média de cada fundamento
    fundamentos.forEach(fundamento => {
      let somaPercentuais = 0;
      let somaExecucoes = 0;
      let atletasComFundamento = 0;
      
      performanceData.forEach(performance => {
        const avaliacaoFundamento = performance.avaliacoes.porFundamento[fundamento.nome];
        if (avaliacaoFundamento) {
          somaPercentuais += avaliacaoFundamento.percentualAcerto;
          somaExecucoes += avaliacaoFundamento.total;
          atletasComFundamento++;
        }
      });
      
      fundamento.media = atletasComFundamento > 0 ? somaPercentuais / atletasComFundamento : 0;
      fundamento.totalExecucoes = somaExecucoes;
    });
    
    return fundamentos;
  })();
  
  // Obter top 3 atletas por fundamento selecionado
  const topAtletas = (() => {
    if (!performanceData) return [];
    
    // Filtrar atletas que têm o fundamento selecionado e mais de 5 tentativas
    const atletasPorFundamento = performanceData
      .filter(performance => {
        const fundamento = performance.avaliacoes.porFundamento[fundamentoSelecionado];
        // Verificar se o atleta tem o fundamento e pelo menos 5 tentativas
        return fundamento && fundamento.total >= 5;
      })
      .map(performance => {
        const fundamento = performance.avaliacoes.porFundamento[fundamentoSelecionado];
        // Calcular eficiência corretamente como (acertos / total) * 100
        const eficiencia = (fundamento.acertos / fundamento.total) * 100;
        
        return {
        id: performance.atleta.id,
        nome: performance.atleta.nome,
          percentual: eficiencia,
          totalExecucoes: fundamento.total,
          acertos: fundamento.acertos,
          ultimaData: fundamento.ultimaData || '-'
        };
      })
      // Ordenação com critérios de desempate
      .sort((a, b) => {
        // Primeiro critério: eficiência (percentual)
        if (b.percentual !== a.percentual) {
          return b.percentual - a.percentual;
        }
        // Segundo critério: número de tentativas
        if (b.totalExecucoes !== a.totalExecucoes) {
          return b.totalExecucoes - a.totalExecucoes;
        }
        // Terceiro critério: ordem alfabética por nome
        return a.nome.localeCompare(b.nome);
      })
      .slice(0, 3); // Pegar só os 3 primeiros
      
    return atletasPorFundamento;
  })();
  
  // Obter alertas de baixo desempenho (abaixo de 60%)
  const alertas = (() => {
    if (!performanceData || !mediasFundamentos) return [];
    
    const alertasArray = [];
    
    performanceData.forEach(performance => {
      Object.entries(performance.avaliacoes.porFundamento).forEach(([fundamento, avaliacao]) => {
        const mediaEquipe = mediasFundamentos.find(f => f.nome === fundamento)?.media || 0;
        
        if (avaliacao.percentualAcerto < 60) {
          alertasArray.push({
            atletaId: performance.atleta.id,
            nome: performance.atleta.nome,
            fundamento: fundamento as Fundamento,
            percentual: avaliacao.percentualAcerto,
            mediaEquipe
          });
        }
      });
    });
    
    return alertasArray.slice(0, 5); // Limitando a 5 alertas
  })();
  
  // Renderizar skeletons durante o carregamento
  const renderSkeletons = () => {
    return Array(6).fill(0).map((_, index) => (
      <div key={`skeleton-${index}`} className="w-full">
        <CardSkeleton />
      </div>
    ));
  };

  useEffect(() => {
    console.log('Active tab:', activeTab);
  }, [activeTab]);

  return (
    <div className="mobile-container pb-20">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <BarChart2 className="mr-2 h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Desempenho</h1>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1"
          onClick={() => setActiveTab('ranking')}
        >
          <Trophy className="h-4 w-4" /> 
          <span>Ver Ranking</span>
        </Button>
      </header>
      
      {/* Filtros - Fixos no topo */}
      <div className="sticky top-0 z-10 bg-background pt-2 pb-4 space-y-4 mb-6 shadow-sm">
        <Tabs defaultValue="Masculino" onValueChange={(value) => setTeam(value as TeamType)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="Masculino">Masculino</TabsTrigger>
            <TabsTrigger value="Feminino">Feminino</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar atleta..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
        
        {/* Navegação simplificada */}
        <div className="flex w-full rounded-md border p-1">
          <button
            className={`flex-1 items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${activeTab === 'equipe' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('equipe')}
          >
            <div className="flex items-center justify-center gap-1">
              <Users className="h-4 w-4" /> 
              <span>Equipe</span>
            </div>
          </button>
          <button
            className={`flex-1 items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${activeTab === 'individual' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('individual')}
          >
            <div className="flex items-center justify-center gap-1">
              <User className="h-4 w-4" /> 
              <span>Individual</span>
            </div>
          </button>
          <button
            className={`flex-1 items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${activeTab === 'ranking' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('ranking')}
          >
            <div className="flex items-center justify-center gap-1">
              <Trophy className="h-4 w-4" /> 
              <span>Ranking</span>
            </div>
          </button>
        </div>
      </div>
      
      {/* Mensagem de erro se houver */}
      {errorMessage && (
        <div className="my-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
          <p>{errorMessage}</p>
        </div>
      )}
      
      {/* Mostrar adequadamente com base na aba selecionada */}
      <div className="mt-6">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4">
            {renderSkeletons()}
        </div>
      ) : (
        <>
            {activeTab === 'equipe' && (
              <div className="space-y-6">
                <TeamPerformanceSummary 
                  mediasFundamentos={mediasFundamentos}
                />
              
              <TopAthletesSection
                  topAtletas={topAtletas} 
                fundamentoSelecionado={fundamentoSelecionado}
                setFundamentoSelecionado={setFundamentoSelecionado}
                  onSelectAthlete={(id) => handleSelectAthlete(id)}
              />
              
              <PerformanceAlerts
                alertas={alertas}
                  onSelectAthlete={(id) => handleSelectAthlete(id)}
              />
            </div>
            )}
            
            {activeTab === 'individual' && (
              <IndividualView
                performanceData={performanceData || []}
              selectedAthleteId={selectedAthleteId}
              setSelectedAthleteId={setSelectedAthleteId}
              selectedAthlete={selectedAthlete}
              mediasFundamentos={mediasFundamentos}
              team={team}
              onOpenDetailDrawer={() => setIsDetailOpen(true)}
            />
            )}
            
            {activeTab === 'ranking' && (
              <div className="space-y-6">
                <RankingFundamentos
                  performanceData={performanceData || []} 
              team={team}
            />
              </div>
          )}
        </>
      )}
      </div>
      
      <Drawer open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Detalhes de Desempenho</DrawerTitle>
            <DrawerDescription>
              {selectedAthlete && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">
                    {selectedAthlete.atleta.nome.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{selectedAthlete.atleta.nome}</p>
                    <div className="flex gap-2 items-center text-xs">
                      <Badge variant="outline">{selectedAthlete.atleta.posicao}</Badge>
                      <span className="text-muted-foreground">{selectedAthlete.atleta.time}</span>
                    </div>
                  </div>
                </div>
              )}
            </DrawerDescription>
          </DrawerHeader>
          {selectedAthlete && (
            <AthletePerformanceDetail performance={selectedAthlete} />
          )}
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Fechar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default Performance;
