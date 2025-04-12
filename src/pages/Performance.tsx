
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart2, Search, Filter, X, ChevronRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/LoadingSpinner';
import AthletePerformanceCard from '@/components/performance/AthletePerformanceCard';
import AthletePerformanceDetail from '@/components/performance/AthletePerformanceDetail';
import { getAthletesPerformance, getAthletePerformance } from '@/services/performanceService';
import { TeamType, AthletePerformance } from '@/types';

const Performance = () => {
  const [team, setTeam] = useState<TeamType>("Masculino");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Buscar dados de desempenho dos atletas
  const { data: performanceData, isLoading, error, refetch } = useQuery({
    queryKey: ['athletePerformance', team],
    queryFn: () => getAthletesPerformance(team),
  });

  // Filtrar atletas com base na busca
  const filteredAthletes = performanceData?.filter(performance => 
    performance.atleta.nome.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Lidar com a seleção de um atleta
  const handleSelectAthlete = (athleteId: string) => {
    setSelectedAthleteId(athleteId);
    setIsDetailOpen(true);
  };

  // Encontrar o atleta selecionado
  const selectedAthlete = performanceData?.find(
    performance => performance.atleta.id === selectedAthleteId
  );

  return (
    <div className="mobile-container pb-20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <BarChart2 className="mr-2 h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Desempenho</h1>
        </div>
      </div>
      
      {/* Filtros */}
      <div className="space-y-4 mb-6">
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
      </div>
      
      {/* Conteúdo principal */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground mt-4">Carregando dados de desempenho...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-destructive">Erro ao carregar dados de desempenho</p>
          <Button onClick={() => refetch()} variant="outline" className="mt-2">
            Tentar novamente
          </Button>
        </div>
      ) : filteredAthletes && filteredAthletes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAthletes.map((performance) => (
            <AthletePerformanceCard 
              key={performance.atleta.id}
              performance={performance}
              onClick={() => handleSelectAthlete(performance.atleta.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BarChart2 className="h-16 w-16 text-muted mb-4" />
          {searchQuery ? (
            <>
              <h3 className="text-xl font-semibold">Nenhum atleta encontrado</h3>
              <p className="text-muted-foreground mt-2">
                Não há atletas correspondentes à sua busca "{searchQuery}"
              </p>
            </>
          ) : (
            <>
              <h3 className="text-xl font-semibold">Sem dados de desempenho</h3>
              <p className="text-muted-foreground mt-2">
                Ainda não há dados de desempenho registrados para atletas do time {team}.
              </p>
            </>
          )}
        </div>
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
