<<<<<<< HEAD
import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart2, Search, X, Users, User, Trophy } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
=======

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart2 } from 'lucide-react';
>>>>>>> 3030df7b55e2be586ac00a987a265a96ea22c1aa
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TeamType } from '@/types';
import { getAthletesPerformance } from '@/services/performanceService';
import { PerformanceFilters } from '@/components/performance/filters/PerformanceFilters';
import { PerformanceContent } from '@/components/performance/content/PerformanceContent';
import AthletePerformanceDetail from '@/components/performance/AthletePerformanceDetail';
<<<<<<< HEAD
import TeamPerformanceSummary from '@/components/performance/TeamPerformanceSummary';
import TopAthletesSection from '@/components/performance/TopAthletesSection';
import PerformanceAlerts from '@/components/performance/PerformanceAlerts';
import AthleteAnalysis from '@/components/performance/AthleteAnalysis';
import AthleteRanking from '@/components/performance/AthleteRanking';

// Tipo para os fundamentos
type Fundamento = 'saque' | 'recepção' | 'levantamento' | 'ataque' | 'bloqueio' | 'defesa';

// Interface para as médias dos fundamentos
interface FundamentoMedia {
  nome: Fundamento;
  media: number;
  totalExecucoes: number;
}
=======
>>>>>>> 3030df7b55e2be586ac00a987a265a96ea22c1aa

// Tipo para abas de análise
type AnalysisTab = 'equipe' | 'individual' | 'ranking';

const Performance = () => {
  const [team, setTeam] = useState<TeamType>("Masculino");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
<<<<<<< HEAD
  const [activeTab, setActiveTab] = useState<AnalysisTab>('equipe');
  const [fundamentoSelecionado, setFundamentoSelecionado] = useState<Fundamento>('saque');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
=======
  const [activeTab, setActiveTab] = useState<'equipe' | 'individual' | 'ranking'>('equipe');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date()
  });
>>>>>>> 3030df7b55e2be586ac00a987a265a96ea22c1aa

  const { data: performanceData, isLoading, error, refetch } = useQuery({
    queryKey: ['athletePerformance', team],
    queryFn: async () => {
      try {
        console.log('Iniciando consulta de desempenho');
        const data = await getAthletesPerformance(team);
        console.log(`Dados recuperados: ${data?.length || 0} atletas`);
        return data;
      } catch (error) {
        console.error('Erro na consulta de desempenho:', error);
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Erro ao buscar dados de desempenho');
      }
    },
  });

  // Filtrar atletas com base na busca
  const filteredAthletes = performanceData?.filter(performance => 
    performance.atleta.nome.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Encontrar o atleta selecionado
  const selectedAthlete = performanceData?.find(
    performance => performance.atleta.id === selectedAthleteId
  );

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
      
<<<<<<< HEAD
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
            <AthleteRanking 
              performanceData={performanceData}
              team={team}
            />
          )}
        </>
      )}
=======
      <PerformanceFilters
        team={team}
        setTeam={setTeam}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        dateRange={dateRange}
        setDateRange={setDateRange}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      
      <PerformanceContent
        isLoading={isLoading}
        error={error instanceof Error ? error : null}
        errorMessage={error instanceof Error ? error.message : null}
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
>>>>>>> 3030df7b55e2be586ac00a987a265a96ea22c1aa
      
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
