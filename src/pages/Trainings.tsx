import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Calendar as CalendarIcon, Users, Clock, MapPin, MoreHorizontal, Edit, Trash2, Play } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Training, fetchTrainings, deleteTraining } from '@/services/trainingService';
import { fetchTreinosDosDia } from '@/services/treinosDoDiaService';
import { useToast } from '@/hooks/use-toast';
import { SelectTreinoParaDia } from '@/components/treino-do-dia/SelectTreinoParaDia';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface TrainingsProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const Trainings = ({ className, size = "md" }: TrainingsProps) => {
  const [trainingToDelete, setTrainingToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch trainings
  const {
    data: trainings = [],
    isLoading: isLoadingTrainings,
    isError: isErrorTrainings,
    error: errorTrainings,
  } = useQuery({
    queryKey: ['trainings'],
    queryFn: fetchTrainings,
  });

  // Fetch treinos do dia
  const {
    data: treinosDoDia = [],
    isLoading: isLoadingTreinosDoDia,
  } = useQuery({
    queryKey: ['treinos-do-dia'],
    queryFn: fetchTreinosDosDia,
  });
  
  // Delete training mutation
  const deleteMutation = useMutation({
    mutationFn: deleteTraining,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      toast({
        title: 'Treino excluído',
        description: 'O treino foi removido com sucesso.',
      });
      setTrainingToDelete(null);
    },
    onError: (error) => {
      console.error('Error deleting training:', error);
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o treino. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  // Handle training deletion
  const handleDeleteTraining = () => {
    if (trainingToDelete) {
      deleteMutation.mutate(trainingToDelete);
    }
  };

  // Group trainings by date (month/year)
  const groupedTrainings = trainings.reduce((acc, training) => {
    const date = new Date(training.data);
    const monthYear = format(date, 'MMMM yyyy', { locale: ptBR });
    
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    
    acc[monthYear].push(training);
    return acc;
  }, {} as Record<string, Training[]>);

  // Get active trainings for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayString = today.toISOString().split('T')[0];
  const activeTrainings = treinosDoDia.filter(
    t => t.data === todayString && !t.aplicado
  );

  if (isLoadingTrainings) {
    return (
      <div className="mobile-container flex flex-col items-center justify-center min-h-[70vh]">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground mt-4">Carregando treinos...</p>
      </div>
    );
  }

  if (isErrorTrainings) {
    return (
      <div className="mobile-container py-8">
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg mb-4">
          <p>Erro ao carregar treinos.</p>
          <p className="text-sm">{(errorTrainings as Error)?.message}</p>
        </div>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['trainings'] })}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="mobile-container pb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Treinos</h1>
        <Link to="/montar-treino">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Novo Treino
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="all" className="flex-1">
            Todos
          </TabsTrigger>
          <TabsTrigger value="today" className="flex-1 relative">
            Treino do Dia
            {activeTrainings.length > 0 && (
              <Badge className="ml-1 bg-primary absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]">
                {activeTrainings.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="animate-fade-in">
          {/* All trainings view */}
          {trainings.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-medium mb-1">Nenhum treino encontrado</h2>
              <p className="text-muted-foreground mb-4">
                Comece criando seu primeiro treino.
              </p>
              <Link to="/montar-treino">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Treino
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.keys(groupedTrainings).map((monthYear) => (
                <div key={monthYear}>
                  <h2 className="font-semibold text-lg mb-3 capitalize">{monthYear}</h2>
                  <div className="space-y-3">
                    {groupedTrainings[monthYear].map((training) => (
                      <Card key={training.id} className="overflow-hidden">
                        <CardHeader className="p-4 pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg mb-1">{training.nome}</CardTitle>
                              <CardDescription>
                                {format(new Date(training.data), 'EEEE, dd/MM/yyyy', { locale: ptBR })}
                              </CardDescription>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  <span>Editar</span>
                                </DropdownMenuItem>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => {
                                      e.preventDefault();
                                      setTrainingToDelete(training.id);
                                    }}>
                                      <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                                      <span className="text-destructive">Excluir</span>
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Excluir treino</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Tem certeza que deseja excluir o treino "{training.nome}"? Esta ação não pode ser desfeita.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel onClick={() => setTrainingToDelete(null)}>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={handleDeleteTraining}
                                        className="bg-destructive hover:bg-destructive/90"
                                      >
                                        {deleteMutation.isPending && trainingToDelete === training.id ? (
                                          <LoadingSpinner className="mr-2" />
                                        ) : (
                                          <Trash2 className="h-4 w-4 mr-2" />
                                        )}
                                        Excluir
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                            {training.local && (
                              <div className="flex items-center">
                                <MapPin className="h-3 w-3 mr-2" />
                                <span>{training.local}</span>
                              </div>
                            )}
                            {training.descricao && (
                              <p className="mt-2 text-sm">{training.descricao}</p>
                            )}
                          </div>
                        </CardContent>
                        <CardFooter className="p-2 bg-muted/20 flex justify-end">
                          {/* Add button to set as treino do dia */}
                          <SelectTreinoParaDia
                            treinoId={training.id}
                            treinoNome={training.nome}
                          />
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="today" className="animate-fade-in">
          {/* Today's training view */}
          {isLoadingTreinosDoDia ? (
            <div className="py-8 flex flex-col items-center justify-center">
              <LoadingSpinner />
              <p className="mt-4 text-muted-foreground">Carregando treinos do dia...</p>
            </div>
          ) : activeTrainings.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-medium mb-1">Nenhum treino para hoje</h2>
              <p className="text-muted-foreground mb-4">
                Selecione um treino e defina-o como Treino do Dia.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeTrainings.map((treinoDoDia) => {
                const trainingInfo = trainings.find(t => t.id === treinoDoDia.treino_id);
                if (!trainingInfo) return null;
                
                return (
                  <Card key={treinoDoDia.id} className="overflow-hidden border-primary/60">
                    <CardHeader className="p-4 pb-2">
                      <Badge className="w-fit mb-2">Treino do Dia</Badge>
                      <CardTitle className="text-lg mb-1">{trainingInfo.nome}</CardTitle>
                      <CardDescription>
                        {format(new Date(treinoDoDia.data), 'EEEE, dd/MM/yyyy', { locale: ptBR })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                        {trainingInfo.local && (
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-2" />
                            <span>{trainingInfo.local}</span>
                          </div>
                        )}
                        {trainingInfo.descricao && (
                          <p className="mt-2 text-sm">{trainingInfo.descricao}</p>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="p-2 bg-muted/20">
                      <Link to={`/treino-do-dia/${treinoDoDia.id}`} className="w-full">
                        <Button variant="default" className="w-full">
                          <Play className="h-4 w-4 mr-2" />
                          Iniciar Treino
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Trainings;
