
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart2, Search, X, Users, User, Trophy } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TeamType } from '@/types';
import { getAthletesPerformance } from '@/services/performanceService';
import { PerformanceFilters } from '@/components/performance/filters/PerformanceFilters';
import { PerformanceContent } from '@/components/performance/content/PerformanceContent';
import AthletePerformanceDetail from '@/components/performance/AthletePerformanceDetail';

// Tipo para abas de análise
type AnalysisTab = 'equipe' | 'individual' | 'ranking';

const Performance = () => {
  const [team, setTeam] = useState<TeamType>("Masculino");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AnalysisTab>('equipe');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date()
  });

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
