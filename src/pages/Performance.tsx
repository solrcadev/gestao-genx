
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart2, Search, X, Users, User, Trophy, Sliders } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { getAthletesPerformance } from '@/services/performanceService';
import { TeamType, AthletePerformance } from '@/types';
import { Link } from 'react-router-dom';
import AthletePerformanceDetail from '@/components/performance/AthletePerformanceDetail';
import { PerformanceContent } from '@/components/performance/content/PerformanceContent';
import { useProfile } from '@/hooks/useProfile';
import PerformanceAlerts from '@/components/performance/PerformanceAlerts';
import AthleteAnalysis from '@/components/performance/AthleteAnalysis';
import AthleteRanking from '@/components/performance/AthleteRanking';
import TeamPerformanceSummary from '@/components/performance/TeamPerformanceSummary';
import TopAthletesSection from '@/components/performance/TopAthletesSection';

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
  
  const { profile } = useProfile();
  const isAdmin = profile?.role === 'admin';
  const isCoach = profile?.role === 'coach';
  const canManageEvaluations = isAdmin || isCoach;

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
    
    const atletasPorFundamento = performanceData
      .filter(performance => {
        const fundamento = performance.avaliacoes.porFundamento[fundamentoSelecionado];
        return fundamento !== undefined;
      })
      .map(performance => {
        const fundamento = performance.avaliacoes.porFundamento[fundamentoSelecionado];
        return {
          id: performance.atleta.id,
          nome: performance.atleta.nome,
          percentual: fundamento ? fundamento.percentualAcerto : 0,
          totalExecucoes: fundamento ? fundamento.total : 0,
          ultimaData: fundamento && fundamento.ultimaData ? fundamento.ultimaData : '-'
        };
      })
      .sort((a, b) => b.percentual - a.percentual)
      .slice(0, 3);
      
    return atletasPorFundamento;
  })();
  
  // Obter alertas de baixo desempenho (abaixo de 60%)
  const alertas = (() => {
    if (!performanceData || !mediasFundamentos) return [];
    
    const alertasArray = [];
    
    performanceData.forEach(performance => {
      Object.entries(performance.avaliacoes.porFundamento).forEach(([fundamento, avaliacao]) => {
        if (avaliacao && typeof avaliacao === 'object' && 'percentualAcerto' in avaliacao) {
          const mediaEquipe = mediasFundamentos.find(f => f.nome === fundamento as Fundamento)?.media || 0;
          
          if (avaliacao.percentualAcerto < 60) {
            alertasArray.push({
              atletaId: performance.atleta.id,
              nome: performance.atleta.nome,
              fundamento: fundamento as Fundamento,
              percentual: avaliacao.percentualAcerto,
              mediaEquipe
            });
          }
        }
      });
    });
    
    return alertasArray.slice(0, 5); // Limitando a 5 alertas
  })();

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
        
        <div className="flex gap-2">
          {canManageEvaluations && (
            <Link to="/gerenciar-avaliacoes">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
              >
                <Sliders className="h-4 w-4" /> 
                <span>Gerenciar Avaliações</span>
              </Button>
            </Link>
          )}
        </div>
      </header>
      
      {/* Main Tab Selector */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AnalysisTab)} className="mb-6">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="equipe" className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            <span>Equipe</span>
          </TabsTrigger>
          <TabsTrigger value="individual" className="flex items-center">
            <User className="h-4 w-4 mr-2" />
            <span>Individual</span>
          </TabsTrigger>
          <TabsTrigger value="ranking" className="flex items-center">
            <Trophy className="h-4 w-4 mr-2" />
            <span>Ranking</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      <PerformanceContent
        isLoading={isLoading}
        error={error}
        errorMessage={errorMessage}
        refetch={refetch}
        performanceData={filteredAthletes}
        activeTab={activeTab}
        team={team}
        dateRange={dateRange}
        selectedAthleteId={selectedAthleteId}
        setSelectedAthleteId={setSelectedAthleteId}
        selectedAthlete={selectedAthlete}
        isDetailOpen={isDetailOpen}
        setIsDetailOpen={setIsDetailOpen}
      />
      
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
