import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  BarChart2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Drawer, 
  DrawerContent, 
  DrawerDescription, 
  DrawerFooter, 
  DrawerHeader, 
  DrawerTitle 
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { useMediaQuery } from "@/hooks/use-mobile";
import LoadingSpinner from "@/components/LoadingSpinner";
import { fetchTreinoAtual, concluirTreinoDoDia } from "@/services/treinosDoDiaService";
import AthleteAttendance from "@/components/treino-do-dia/AthleteAttendance";
import ExerciseEvaluation from "@/components/treino-do-dia/ExerciseEvaluation";
import SelectTreinoParaDia from "@/components/treino-do-dia/SelectTreinoParaDia";

const TreinoDoDia = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  const [activeTab, setActiveTab] = useState("visao-geral");
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState<number | null>(null);
  const [isExerciseRunning, setIsExerciseRunning] = useState(false);
  const [exerciseTimer, setExerciseTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [isEvaluationOpen, setIsEvaluationOpen] = useState(false);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isSelectTreinoOpen, setIsSelectTreinoOpen] = useState(false);

  // Fetch treino do dia data
  const { 
    data: treinoDoDia, 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: ['treinoDoDia', id],
    queryFn: () => fetchTreinoAtual(id as string),
    enabled: !!id,
  });

  // Mutation to conclude treino
  const concludeTreinoMutation = useMutation({
    mutationFn: () => concluirTreinoDoDia(id as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treinosDoDia'] });
      queryClient.invalidateQueries({ queryKey: ['treinoDoDia', id] });
      toast({
        title: "Treino concluído com sucesso!",
        description: "Todas as informações foram salvas.",
      });
      navigate('/dashboard');
    },
    onError: (error) => {
      toast({
        title: "Erro ao concluir treino",
        description: "Não foi possível concluir o treino. Tente novamente.",
        variant: "destructive",
      });
      console.error("Error concluding treino:", error);
    }
  });

  // Handle exercise timer
  useEffect(() => {
    if (isExerciseRunning) {
      const interval = setInterval(() => {
        setExerciseTimer(prev => prev + 1);
      }, 1000);
      setTimerInterval(interval);
    } else if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }

    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [isExerciseRunning]);

  // Format timer display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle exercise selection
  const handleSelectExercise = (index: number) => {
    if (selectedExerciseIndex === index) {
      setSelectedExerciseIndex(null);
      setIsExerciseRunning(false);
      setExerciseTimer(0);
    } else {
      setSelectedExerciseIndex(index);
      setIsExerciseRunning(false);
      setExerciseTimer(0);
    }
  };

  // Toggle exercise timer
  const toggleExerciseTimer = () => {
    setIsExerciseRunning(!isExerciseRunning);
  };

  // Reset exercise timer
  const resetExerciseTimer = () => {
    setExerciseTimer(0);
    setIsExerciseRunning(false);
  };

  // Open athlete evaluation
  const openEvaluation = (athleteId: string) => {
    setSelectedAthleteId(athleteId);
    setIsEvaluationOpen(true);
  };

  // Handle treino selection
  const handleTreinoSelected = () => {
    setIsSelectTreinoOpen(false);
    refetch();
  };

  // Confirm treino conclusion
  const confirmConcludeTreino = () => {
    setIsConfirmDialogOpen(true);
  };

  // Execute treino conclusion
  const executeConcludeTreino = () => {
    setIsConfirmDialogOpen(false);
    concludeTreinoMutation.mutate();
  };

  // If loading, show spinner
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <LoadingSpinner />
        <p className="mt-4 text-muted-foreground">Carregando treino...</p>
      </div>
    );
  }

  // If error, show error message
  if (error || !treinoDoDia) {
    return (
      <div className="mobile-container">
        <div className="flex flex-col items-center justify-center py-12">
          <XCircle className="h-16 w-16 text-destructive mb-4" />
          <h2 className="text-xl font-semibold">Erro ao carregar treino</h2>
          <p className="mt-2 text-center text-muted-foreground max-w-xs">
            Não foi possível carregar os dados do treino. Verifique sua conexão e tente novamente.
          </p>
          <div className="flex gap-4 mt-6">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <Button onClick={() => refetch()}>Tentar novamente</Button>
          </div>
        </div>
      </div>
    );
  }

  // If no treino for today, show selection
  if (!treinoDoDia.treino) {
    return (
      <div className="mobile-container">
        <div className="flex items-center mb-6">
          <Calendar className="mr-2 h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Treino do Dia</h1>
        </div>
        
        <div className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-16 w-16 text-muted mb-4" />
          <h2 className="text-xl font-semibold">Nenhum treino definido</h2>
          <p className="mt-2 text-center text-muted-foreground max-w-xs">
            Não há um treino definido para hoje. Selecione um treino para aplicar.
          </p>
          <Button className="mt-6" onClick={() => setIsSelectTreinoOpen(true)}>
            Selecionar Treino
          </Button>
        </div>
        
        {/* Drawer for treino selection */}
        <Drawer open={isSelectTreinoOpen} onOpenChange={setIsSelectTreinoOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Selecionar Treino</DrawerTitle>
              <DrawerDescription>
                Escolha um treino para aplicar hoje
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4">
              <SelectTreinoParaDia onSelectTreino={handleTreinoSelected} />
            </div>
            <DrawerFooter>
              <Button variant="outline" onClick={() => setIsSelectTreinoOpen(false)}>
                Cancelar
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    );
  }

  // Main content when treino is loaded
  return (
    <div className="mobile-container pb-20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Calendar className="mr-2 h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Treino do Dia</h1>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Voltar
        </Button>
      </div>
      
      {/* Treino header */}
      <div className="bg-card rounded-lg border p-4 mb-6">
        <h2 className="text-xl font-semibold">{treinoDoDia.treino.nome}</h2>
        <div className="flex flex-wrap gap-y-2 mt-2">
          <div className="flex items-center mr-4">
            <Calendar className="h-4 w-4 text-muted-foreground mr-1" />
            <span className="text-sm">
              {format(new Date(treinoDoDia.data), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </span>
          </div>
          <div className="flex items-center mr-4">
            <MapPin className="h-4 w-4 text-muted-foreground mr-1" />
            <span className="text-sm">{treinoDoDia.treino.local}</span>
          </div>
          <div className="flex items-center">
            <Badge variant={treinoDoDia.aplicado ? "default" : "outline"}>
              {treinoDoDia.aplicado ? "Concluído" : "Em andamento"}
            </Badge>
          </div>
        </div>
        {treinoDoDia.treino.descricao && (
          <p className="text-sm text-muted-foreground mt-2 border-t pt-2">
            {treinoDoDia.treino.descricao}
          </p>
        )}
      </div>
      
      {/* Tabs navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-3 mb-2">
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="presenca">Presença</TabsTrigger>
          <TabsTrigger value="avaliacao">Avaliação</TabsTrigger>
        </TabsList>
        
        {/* Visão Geral Tab */}
        <TabsContent value="visao-geral" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Exercícios ({treinoDoDia.exercicios?.length || 0})</h3>
            {!treinoDoDia.aplicado && (
              <Button 
                variant="default" 
                size="sm"
                onClick={confirmConcludeTreino}
                disabled={concludeTreinoMutation.isPending}
              >
                {concludeTreinoMutation.isPending && (
                  <LoadingSpinner />
                )}
                Concluir Treino
              </Button>
            )}
          </div>
          
          {/* Exercícios list */}
          {treinoDoDia.exercicios && treinoDoDia.exercicios.length > 0 ? (
            <div className="space-y-3">
              {treinoDoDia.exercicios.map((exercicio, index) => (
                <div 
                  key={exercicio.id}
                  className={`border rounded-lg overflow-hidden transition-all ${
                    selectedExerciseIndex === index ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  {/* Exercício header */}
                  <div 
                    className="p-4 cursor-pointer flex justify-between items-center"
                    onClick={() => handleSelectExercise(index)}
                  >
                    <div>
                      <div className="flex items-center">
                        <div className="bg-primary/20 rounded-full w-6 h-6 flex items-center justify-center mr-2">
                          <span className="text-sm font-medium">{exercicio.ordem}</span>
                        </div>
                        <h4 className="font-medium">{exercicio.exercicio.nome}</h4>
                      </div>
                      <div className="flex items-center mt-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{exercicio.exercicio.tempo_estimado} min</span>
                      </div>
                    </div>
                    <ChevronRight className={`h-5 w-5 transition-transform ${
                      selectedExerciseIndex === index ? 'rotate-90' : ''
                    }`} />
                  </div>
                  
                  {/* Exercício expanded content */}
                  {selectedExerciseIndex === index && (
                    <div className="px-4 pb-4 pt-1 border-t">
                      <p className="text-sm mb-3">{exercicio.exercicio.objetivo}</p>
                      
                      {exercicio.observacao && (
                        <div className="bg-muted/30 p-2 rounded text-sm mb-3">
                          <span className="font-medium">Observações: </span>
                          {exercicio.observacao}
                        </div>
                      )}
                      
                      {/* Timer controls */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-mono text-2xl font-semibold">
                          {formatTime(exerciseTimer)}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={toggleExerciseTimer}
                          >
                            {isExerciseRunning ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={resetExerciseTimer}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Evaluation button */}
                      <Button 
                        className="w-full"
                        onClick={() => {
                          document.getElementById('presenca-tab-trigger')?.dispatchEvent(new Event('click'));
                          setActiveTab('presenca');
                        }}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Registrar Presença
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="w-full mt-2"
                        onClick={() => {
                          document.getElementById('avaliacao-tab-trigger')?.dispatchEvent(new Event('click'));
                          setActiveTab('avaliacao');
                        }}
                      >
                        <BarChart2 className="mr-2 h-4 w-4" />
                        Avaliar Atletas
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum exercício definido para este treino.</p>
            </div>
          )}
        </TabsContent>
        
        {/* Presença Tab */}
        <TabsContent value="presenca" id="presenca-tab">
          <AthleteAttendance 
            treinoDoDiaId={treinoDoDia.id} 
            onSaved={() => {
              toast({
                title: "Presenças salvas com sucesso!",
                description: "As presenças foram registradas.",
              });
            }} 
          />
        </TabsContent>
        
        {/* Avaliação Tab */}
        <TabsContent value="avaliacao" id="avaliacao-tab">
          <div className="space-y-4">
            <h3 className="font-medium">Avaliação de Atletas</h3>
            <p className="text-sm text-muted-foreground">
              Selecione um atleta para avaliar seu desempenho nos fundamentos.
            </p>
            
            {/* Lista de atletas presentes */}
            <div className="space-y-2">
              {treinoDoDia.presencas?.filter(p => p.presente).map((presenca) => (
                <div 
                  key={presenca.id}
                  className="border rounded-lg p-3 flex justify-between items-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => openEvaluation(presenca.atleta_id)}
                >
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                      <span className="font-medium">
                        {presenca.atleta?.nome?.substring(0, 2).toUpperCase() || "??"}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{presenca.atleta?.nome}</p>
                      <p className="text-xs text-muted-foreground">{presenca.atleta?.posicao}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              ))}
              
              {!treinoDoDia.presencas || treinoDoDia.presencas.filter(p => p.presente).length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhum atleta presente para avaliar.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setActiveTab('presenca')}
                  >
                    Registrar Presenças
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Evaluation drawer/dialog */}
      {isMobile ? (
        <Drawer open={isEvaluationOpen} onOpenChange={setIsEvaluationOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Avaliação de Atleta</DrawerTitle>
              <DrawerDescription>
                Registre o desempenho nos fundamentos
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4">
              {selectedAthleteId && (
                <ExerciseEvaluation
                  treinoDoDiaId={treinoDoDia.id}
                  exercicioId={treinoDoDia.exercicios?.[selectedExerciseIndex || 0]?.id || ''}
                  atletaId={selectedAthleteId}
                  onSaved={() => {
                    setIsEvaluationOpen(false);
                    toast({
                      title: "Avaliação salva com sucesso!",
                      description: "O desempenho do atleta foi registrado.",
                    });
                  }}
                />
              )}
            </div>
            <DrawerFooter>
              <Button variant="outline" onClick={() => setIsEvaluationOpen(false)}>
                Fechar
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={isEvaluationOpen} onOpenChange={setIsEvaluationOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Avaliação de Atleta</DialogTitle>
              <DialogDescription>
                Registre o desempenho nos fundamentos
              </DialogDescription>
            </DialogHeader>
            {selectedAthleteId && (
              <ExerciseEvaluation
                treinoDoDiaId={treinoDoDia.id}
                exercicioId={treinoDoDia.exercicios?.[selectedExerciseIndex || 0]?.id || ''}
                atletaId={selectedAthleteId}
                onSaved={() => {
                  setIsEvaluationOpen(false);
                  toast({
                    title: "Avaliação salva com sucesso!",
                    description: "O desempenho do atleta foi registrado.",
                  });
                }}
              />
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEvaluationOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Confirmation dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Concluir Treino</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja concluir este treino? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={executeConcludeTreino}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Concluir Treino
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TreinoDoDia;
