import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Calendar as CalendarIcon, 
  ChevronRight, 
  Users, 
  Clock, 
  MapPin, 
  Check, 
  CheckCircle2, 
  PlayCircle, 
  Pause, 
  SkipForward,
  BarChart3,
  ArrowLeft,
  Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Separator } from "@/components/ui/separator";
import { useNavigate, useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
  SheetFooter
} from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { 
  fetchTreinosDosDia,
  setTreinoParaDia,
  concluirTreinoDoDia,
  fetchTreinoAtual,
  iniciarExercicio,
  concluirExercicio 
} from "@/services/treinosDoDiaService";
import { AthleteAttendance } from "@/components/treino-do-dia/AthleteAttendance";
import { ExerciseEvaluation } from "@/components/treino-do-dia/ExerciseEvaluation";
import { ExerciseTimer } from "@/components/treino-do-dia/ExerciseTimer";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ExerciseEvaluationTabs } from "@/components/treino-do-dia/ExerciseEvaluationTabs";

interface TreinoDoDiaProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const TreinoDoDia = ({ className, size = "md" }: TreinoDoDiaProps) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("exercises");
  const [selectedExerciseId, setSelectedExerciseId] = useState(null);
  const [showAttendanceSheet, setShowAttendanceSheet] = useState(false);
  
  // Fetch treino do dia details
  const { 
    data: treinoDoDia, 
    isLoading, 
    isError, 
    error 
  } = useQuery({
    queryKey: ["treino-do-dia", id],
    queryFn: () => fetchTreinoAtual(id),
    enabled: !!id
  });

  // Mutation to update exercise status
  const iniciarExercicioMutation = useMutation({
    mutationFn: iniciarExercicio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treino-do-dia", id] });
      toast({
        title: "Exercício iniciado",
        description: "O cronômetro foi iniciado para este exercício"
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível iniciar o exercício",
        variant: "destructive"
      });
      console.error("Error initiating exercise:", error);
    }
  });

  // Mutation to conclude exercise
  const concluirExercicioMutation = useMutation({
    mutationFn: concluirExercicio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treino-do-dia", id] });
      toast({
        title: "Exercício concluído",
        description: "O exercício foi marcado como concluído"
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível concluir o exercício",
        variant: "destructive"
      });
      console.error("Error concluding exercise:", error);
    }
  });

  // Mutation to finalize training
  const concluirTreinoMutation = useMutation({
    mutationFn: concluirTreinoDoDia,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treinos-do-dia"] });
      toast({
        title: "Treino concluído",
        description: "O treino foi finalizado com sucesso!"
      });
      navigate("/treinos");
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível concluir o treino",
        variant: "destructive"
      });
      console.error("Error finalizing training:", error);
    }
  });

  // Handle starting an exercise
  const handleStartExercise = (exerciseId) => {
    iniciarExercicioMutation.mutate({ treinoDoDiaId: id, exercicioId: exerciseId });
    setSelectedExerciseId(exerciseId);
  };

  // Handle finishing an exercise
  const handleFinishExercise = (exerciseId, tempoReal) => {
    concluirExercicioMutation.mutate({ 
      treinoDoDiaId: id, 
      exercicioId: exerciseId,
      tempoReal
    });
    setSelectedExerciseId(null);
  };

  // Handle finishing training
  const handleFinishTraining = () => {
    // Check if all exercises are completed
    const allExercisesCompleted = treinoDoDia?.exercicios?.every(ex => ex.concluido);
    
    if (!allExercisesCompleted) {
      toast({
        title: "Atenção",
        description: "Existem exercícios não concluídos. Tem certeza que deseja finalizar o treino?",
        variant: "destructive"
      });
      // We continue anyway, it's just a warning
    }

    concluirTreinoMutation.mutate(id);
  };

  // Calculate progress
  const calculateProgress = () => {
    if (!treinoDoDia?.exercicios?.length) return 0;
    
    const completed = treinoDoDia.exercicios.filter(ex => ex.concluido).length;
    return Math.round((completed / treinoDoDia.exercicios.length) * 100);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="mobile-container flex flex-col items-center justify-center h-[70vh]">
        <LoadingSpinner />
        <p className="text-muted-foreground mt-4">Carregando treino...</p>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="mobile-container flex flex-col items-center justify-center h-[70vh]">
        <p className="text-destructive text-center mb-4">
          Houve um erro ao carregar o treino.
        </p>
        <Button onClick={() => navigate("/treinos")}>Voltar para Treinos</Button>
      </div>
    );
  }

  // If training is already completed
  if (treinoDoDia?.aplicado) {
    return (
      <div className="mobile-container pb-16">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Treino do Dia</h1>
          <Button variant="outline" size="sm" onClick={() => navigate("/treinos")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
        
        <div className="bg-muted/30 p-6 rounded-lg text-center mb-6">
          <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-2" />
          <h2 className="text-xl font-medium mb-2">Treino Concluído</h2>
          <p className="text-muted-foreground">
            Este treino já foi aplicado e concluído.
          </p>
          <Button className="mt-4" onClick={() => navigate("/desempenho")}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Ver Resultados
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container pb-16">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Treino do Dia</h1>
        <Button variant="outline" size="sm" onClick={() => navigate("/treinos")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>

      {/* Training Info */}
      <div className="bg-card border p-4 rounded-lg mb-4">
        <h2 className="text-xl font-medium">{treinoDoDia?.treino?.nome}</h2>
        <div className="flex flex-col gap-1 mt-2 text-sm">
          <div className="flex items-center">
            <CalendarIcon className="h-4 w-4 text-muted-foreground mr-2" />
            <span>{format(new Date(treinoDoDia?.data || new Date()), "PPP", { locale: ptBR })}</span>
          </div>
          <div className="flex items-center">
            <MapPin className="h-4 w-4 text-muted-foreground mr-2" />
            <span>{treinoDoDia?.treino?.local || "Local não especificado"}</span>
          </div>
          {treinoDoDia?.presencas && (
            <div className="flex items-center">
              <Users className="h-4 w-4 text-muted-foreground mr-2" />
              <span>
                {treinoDoDia.presencas.filter(p => p.presente).length}{" "}
                atletas presentes
              </span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between items-center text-xs mb-1">
            <span>Progresso</span>
            <span>{calculateProgress()}%</span>
          </div>
          <Progress value={calculateProgress()} className="h-2" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mb-4">
        <Sheet open={showAttendanceSheet} onOpenChange={setShowAttendanceSheet}>
          <SheetTrigger asChild>
            <Button variant="outline" className="flex-1">
              <Users className="h-4 w-4 mr-2" />
              Presenças
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[90%] rounded-t-xl">
            <SheetHeader>
              <SheetTitle>Registro de Presenças</SheetTitle>
            </SheetHeader>
            <div className="py-4">
              <AthleteAttendance 
                treinoDoDiaId={id} 
                onComplete={() => setShowAttendanceSheet(false)}
              />
            </div>
          </SheetContent>
        </Sheet>

        <Dialog>
          <DialogTrigger asChild>
            <Button 
              variant="default" 
              className="flex-1"
              disabled={concluirTreinoMutation.isPending}
            >
              {concluirTreinoMutation.isPending ? (
                <LoadingSpinner className="mr-2" showText={false} />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Finalizar Treino
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Finalizar Treino do Dia</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja finalizar este treino? 
                {calculateProgress() < 100 && 
                  " Alguns exercícios ainda não foram concluídos."}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" type="button">
                Cancelar
              </Button>
              <Button 
                type="button"
                onClick={handleFinishTraining}
              >
                Confirmar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs for exercises and athletes */}
      <Tabs defaultValue="exercises" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full mb-4">
          <TabsTrigger value="exercises" className="flex-1">
            Exercícios
          </TabsTrigger>
          <TabsTrigger value="athletes" className="flex-1">
            Atletas
          </TabsTrigger>
          <TabsTrigger value="evaluation" className="flex-1">
            Avaliar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="exercises" className="animate-fade-in">
          <div className="space-y-4">
            {treinoDoDia?.exercicios?.map((exercise, index) => (
              <div
                key={exercise.id}
                className={`border rounded-lg p-4 ${
                  exercise.concluido ? "bg-muted/30" : "bg-card"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center">
                      <div className="bg-primary/20 h-6 w-6 rounded-full flex items-center justify-center mr-2">
                        <span className="text-xs font-medium">{index + 1}</span>
                      </div>
                      <h3 className="font-medium">{exercise.exercicio.nome}</h3>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {exercise.exercicio.categoria}
                      </Badge>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {exercise.exercicio.tempo_estimado} min
                      </div>
                      {exercise.concluido && exercise.tempo_real && (
                        <div className="flex items-center text-sm text-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {exercise.tempo_real} min (real)
                        </div>
                      )}
                    </div>

                    {exercise.observacao && (
                      <p className="text-sm text-muted-foreground mt-2 border-l-2 pl-2 border-muted">
                        {exercise.observacao}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {!exercise.concluido ? (
                      <Button
                        size="sm"
                        onClick={() => handleStartExercise(exercise.id)}
                        disabled={iniciarExercicioMutation.isPending}
                      >
                        <PlayCircle className="h-4 w-4 mr-1" />
                        Iniciar
                      </Button>
                    ) : (
                      <Badge className="bg-green-600">
                        <Check className="h-3 w-3 mr-1" />
                        Concluído
                      </Badge>
                    )}

                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setActiveTab("evaluation");
                      }}
                    >
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Avaliar
                    </Button>
                  </div>
                </div>

                {/* Timer for selected exercise */}
                {selectedExerciseId === exercise.id && (
                  <div className="mt-4 border-t pt-4">
                    <ExerciseTimer
                      estimatedTime={exercise.exercicio.tempo_estimado}
                      onFinish={(time) => handleFinishExercise(exercise.id, time)}
                    />
                  </div>
                )}
              </div>
            ))}

            {treinoDoDia?.exercicios?.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Nenhum exercício encontrado para este treino.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="athletes" className="animate-fade-in">
          <AthleteAttendance 
            treinoDoDiaId={id} 
            showHeader={false}
          />
        </TabsContent>

        <TabsContent value="evaluation" className="animate-fade-in">
          <ExerciseEvaluationTabs treinoDoDiaId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TreinoDoDia;
