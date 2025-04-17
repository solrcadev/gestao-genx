import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart2, Search, X, Users, User, Medal } from 'lucide-react';
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
import Rankings from '@/components/performance/Rankings';

// Tipo para os fundamentos
type Fundamento = 'saque' | 'recepção' | 'levantamento' | 'ataque' | 'bloqueio' | 'defesa';

// Interface para as médias dos fundamentos
interface FundamentoMedia {
  nome: Fundamento;
  media: number;
  totalExecucoes: number;
}

const Performance = () => {
  const [team, setTeam] = useState<TeamType>("Masculino");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'equipe' | 'individual' | 'ranking'>('equipe');
  const [fundamentoSelecionado, setFundamentoSelecionado] = useState<Fundamento>('saque');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
  const mediasFundamentos = useMemo(() => {
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
  }, [performanceData]);
  
  // Obter top 3 atletas por fundamento selecionado
  const topAtletas = useMemo(() => {
    if (!performanceData) return [];
    
    const atletasPorFundamento = performanceData
      .filter(performance => performance.avaliacoes.porFundamento[fundamentoSelecionado])
      .map(performance => ({
        id: performance.atleta.id,
        nome: performance.atleta.nome,
        percentual: performance.avaliacoes.porFundamento[fundamentoSelecionado].percentualAcerto,
        totalExecucoes: performance.avaliacoes.porFundamento[fundamentoSelecionado].total,
        ultimaData: performance.avaliacoes.porFundamento[fundamentoSelecionado].ultimaData || '-'
      }))
      .sort((a, b) => b.percentual - a.percentual)
      .slice(0, 3);
      
    return atletasPorFundamento;
  }, [performanceData, fundamentoSelecionado]);
  
  // Obter alertas de baixo desempenho (abaixo de 60%)
  const alertas = useMemo(() => {
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
  }, [performanceData, mediasFundamentos]);
  
  // Renderizar skeletons durante o carregamento
  const renderSkeletons = () => {
    return Array(6).fill(0).map((_, index) => (
      <div key={`skeleton-${index}`} className="w-full">
        <CardSkeleton />
      </div>
    ));
  };

  return (
    <div className="mobile-container pb-20">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <BarChart2 className="mr-2 h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Desempenho</h1>
        </div>
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
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'equipe' | 'individual' | 'ranking')} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="equipe" className="flex items-center gap-2">
              <Users className="h-4 w-4" /> Equipe
            </TabsTrigger>
            <TabsTrigger value="individual" className="flex items-center gap-2">
              <User className="h-4 w-4" /> Individual
            </TabsTrigger>
            <TabsTrigger value="ranking" className="flex items-center gap-2">
              <Medal className="h-4 w-4" /> Ranking
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Conteúdo principal */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {renderSkeletons()}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-destructive">Erro ao carregar dados de desempenho</p>
          {errorMessage && (
            <p className="text-sm text-muted-foreground mt-2 mb-4 text-center">
              {errorMessage}
            </p>
          )}
          <div className="space-y-4">
            <Button onClick={() => refetch()} variant="outline" className="mt-2">
              Tentar novamente
            </Button>
          </div>
        </div>
      ) : (!performanceData || performanceData.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-muted-foreground">Não há dados de desempenho disponíveis para este time</p>
          <p className="text-sm text-muted-foreground mt-2 mb-4">
            Adicione atletas e registre avaliações para visualizar o desempenho.
          </p>
        </div>
      ) : (
        <>
          {activeTab === 'equipe' ? (
            <div className="space-y-8">
              {/* Resumo da Equipe */}
              <TeamPerformanceSummary mediasFundamentos={mediasFundamentos} />
              
              {/* Destaques */}
              <TopAthletesSection
                fundamentoSelecionado={fundamentoSelecionado}
                setFundamentoSelecionado={setFundamentoSelecionado}
                topAtletas={topAtletas}
                onSelectAthlete={handleSelectAthlete}
              />
              
              {/* Alertas */}
              <PerformanceAlerts
                alertas={alertas}
                onSelectAthlete={handleSelectAthlete}
              />
            </div>
          ) : activeTab === 'individual' ? (
            <AthleteAnalysis
              performanceData={performanceData}
              selectedAthleteId={selectedAthleteId}
              setSelectedAthleteId={setSelectedAthleteId}
              selectedAthlete={selectedAthlete}
              mediasFundamentos={mediasFundamentos}
              team={team}
              onOpenDetailDrawer={() => setIsDetailOpen(true)}
            />
          ) : (
            <Rankings />
          )}
        </>
      )}
      
      {/* Drawer para detalhes do atleta */}
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
