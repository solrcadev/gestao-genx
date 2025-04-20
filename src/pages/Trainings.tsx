
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Plus, Calendar, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoadingSpinner from '@/components/LoadingSpinner';
import { fetchTrainings } from '@/services/trainingService';
import { Training, Team } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { format, isToday, isFuture, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

const Trainings = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [teamFilter, setTeamFilter] = useState<Team | 'all'>('all');

  const { data: trainings, isLoading, error } = useQuery({
    queryKey: ['trainings'],
    queryFn: fetchTrainings,
  });

  // Filter trainings based on search term, filter type, and team
  const filteredTrainings = trainings
    ? trainings
        .filter(training => {
          const searchMatch = training.nome.toLowerCase().includes(searchTerm.toLowerCase());
          
          let statusMatch = true;
          if (filterType === 'upcoming') {
            statusMatch = training.data && isFuture(new Date(training.data));
          } else if (filterType === 'past') {
            statusMatch = training.data && isPast(new Date(training.data)) && !isToday(new Date(training.data));
          } else if (filterType === 'today') {
            statusMatch = training.data && isToday(new Date(training.data));
          }
          
          const teamMatch = teamFilter === 'all' || training.time === teamFilter;
          
          return searchMatch && statusMatch && teamMatch;
        })
        .sort((a, b) => {
          // Sort by date (descending for past, ascending for upcoming)
          const dateA = a.data ? new Date(a.data) : new Date();
          const dateB = b.data ? new Date(b.data) : new Date();
          return filterType === 'past' ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
        })
    : [];
    
  const handleUpdateTraining = (trainingId: string) => {
    // Logic to update training
    navigate(`/montar-treino?id=${trainingId}`);
  };
  
  const handleDuplicateTraining = (trainingId: string) => {
    // Logic to duplicate training
    navigate(`/montar-treino?duplicate=${trainingId}`);
  };

  const handleSetAsTreinoDosDia = (training: Training) => {
    // Navigate to treino do dia with this training
    navigate(`/treino-do-dia?training=${training.id}`);
  };

  return (
    <div className="mobile-container pb-20">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Dumbbell className="mr-2 h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Treinos</h1>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/treino-do-dia')}>
            <Calendar className="h-4 w-4 mr-2" />
            Treino do Dia
          </Button>
          <Button onClick={() => navigate('/montar-treino')}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Treino
          </Button>
        </div>
      </header>
      
      <div className="space-y-4 mb-6">
        <Input 
          placeholder="Buscar treinos..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-2"
        />
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Tabs defaultValue="all" value={filterType} onValueChange={setFilterType} className="flex-1">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="today">Hoje</TabsTrigger>
              <TabsTrigger value="upcoming">Futuros</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Tabs defaultValue="all" value={teamFilter} onValueChange={(value) => setTeamFilter(value as Team | 'all')} className="flex-1">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="Masculino">Masc</TabsTrigger>
              <TabsTrigger value="Feminino">Fem</TabsTrigger>
              <TabsTrigger value="Misto">Misto</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-0">
                <div className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="text-center p-6">
          <p className="text-destructive mb-4">Erro ao carregar treinos</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
        </div>
      ) : filteredTrainings.length === 0 ? (
        <div className="text-center p-6">
          <p className="text-muted-foreground mb-2">Nenhum treino encontrado</p>
          {searchTerm && <p className="text-sm text-muted-foreground mb-4">Tente outro termo de busca</p>}
          <Button onClick={() => navigate('/montar-treino')}>
            <Plus className="h-4 w-4 mr-2" />
            Criar novo treino
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTrainings.map((training) => {
            const trainingDate = training.data ? new Date(training.data) : null;
            const isTrainingToday = trainingDate && isToday(trainingDate);
            
            return (
              <Card key={training.id} className={isTrainingToday ? "border-primary border-2" : ""}>
                <CardContent className="p-0">
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{training.nome}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                          {trainingDate && (
                            <span>{format(trainingDate, "dd 'de' MMMM", { locale: ptBR })}</span>
                          )}
                          {training.local && (
                            <>
                              <span className="text-xs">•</span>
                              <span>{training.local}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <Badge variant={training.time === 'Masculino' ? 'default' : 
                              training.time === 'Feminino' ? 'secondary' : 'outline'}>
                        {training.time}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleUpdateTraining(training.id)}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      
                      {isTrainingToday ? (
                        <Button 
                          size="sm" 
                          onClick={() => handleSetAsTreinoDosDia(training)}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Definir como Treino do Dia
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDuplicateTraining(training.id)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Duplicar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Trainings;
