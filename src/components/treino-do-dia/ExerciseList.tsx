import React, { useState, useEffect } from "react";
import { fetchTreinoAtual, desmarcarExercicio } from "@/services/treinosDoDiaService";
import LoadingSpinner from "../LoadingSpinner";
import { Clipboard, Play, Clock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "../ui/use-toast";
import { ExerciseTimer } from "./ExerciseTimer";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";

interface ExerciseListProps {
  treinoDoDiaId: string;
}

const ExerciseList = ({ treinoDoDiaId }: ExerciseListProps) => {
  const [loading, setLoading] = useState(true);
  const [exercicios, setExercicios] = useState([]);
  const [activeExercise, setActiveExercise] = useState(null);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [unmarkDialogOpen, setUnmarkDialogOpen] = useState(false);
  const [exercicioToUnmark, setExercicioToUnmark] = useState(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    loadExercicios();
  }, [treinoDoDiaId]);

  const loadExercicios = async () => {
    try {
      setLoading(true);
      console.log("Loading exercises for treinoDoDiaId:", treinoDoDiaId);
      const treinoAtual = await fetchTreinoAtual(treinoDoDiaId);
      console.log("Fetched treino atual data:", treinoAtual);
      setExercicios(treinoAtual.exercicios || []);
      console.log("Set exercicios state with:", treinoAtual.exercicios || []);
    } catch (error) {
      console.error("Error loading exercises:", error);
      toast({
        title: "Erro ao carregar exercícios",
        description: "Não foi possível carregar a lista de exercícios.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartExercise = (exercicio) => {
    setActiveExercise(exercicio);
    setIsTimerActive(true);
  };

  const handleCompleteExercise = () => {
    setIsTimerActive(false);
    loadExercicios(); // Refresh the list to show the updated status
  };

  const handleCancelExercise = () => {
    setIsTimerActive(false);
    setActiveExercise(null);
  };

  const handleOpenUnmarkDialog = (exercicio) => {
    setExercicioToUnmark(exercicio);
    setUnmarkDialogOpen(true);
  };

  const handleUnmarkExercise = async () => {
    if (!exercicioToUnmark) return;
    
    try {
      await desmarcarExercicio({ exercicioId: exercicioToUnmark.id });
      toast({
        title: "Exercício desmarcado",
        description: "O exercício foi desmarcado com sucesso.",
      });
      setUnmarkDialogOpen(false);
      loadExercicios(); // Recarregar a lista para atualizar o status
    } catch (error) {
      console.error("Erro ao desmarcar exercício:", error);
      toast({
        title: "Erro",
        description: "Não foi possível desmarcar o exercício.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (exercicios.length === 0) {
    return (
      <div className="text-center py-8 bg-muted/10 rounded-lg">
        <Clipboard className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
        <p className="text-muted-foreground">
          Nenhum exercício para este treino
        </p>
      </div>
    );
  }

  if (isTimerActive && activeExercise) {
    return (
      <ExerciseTimer
        exerciseData={activeExercise}
        treinoDoDiaId={treinoDoDiaId}
        onFinish={handleCompleteExercise}
        onCancel={handleCancelExercise}
        estimatedTime={activeExercise.exercicio?.tempo_estimado || 10}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-lg flex items-center">
          <Clipboard className="h-5 w-5 mr-2" /> Exercícios
        </h2>
      </div>

      <div className="mobile-list overflow-container space-y-3 pb-20">
        {exercicios.map((exercicio, index) => (
          <div
            key={exercicio.id}
            className={`border rounded-lg ${
              exercicio.concluido ? "bg-muted/20" : "bg-card"
            }`}
          >
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center mb-1">
                    <span className="text-sm bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      #{index + 1}
                    </span>
                    <h3 className="font-medium ml-2">
                      {exercicio.exercicio?.nome || "Exercício"}
                    </h3>
                  </div>
                  
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-1" />
                    {exercicio.exercicio?.tempo_estimado || "?"} min
                    {exercicio.concluido && exercicio.tempo_real && (
                      <span className="ml-2 text-green-600">
                        • Tempo real: {Math.floor(exercicio.tempo_real / 60)}:{(exercicio.tempo_real % 60).toString().padStart(2, '0')}
                      </span>
                    )}
                  </div>
                  
                  {exercicio.observacao && (
                    <p className="text-sm mt-2">{exercicio.observacao}</p>
                  )}
                </div>

                {exercicio.concluido ? (
                  <div className="flex items-center gap-2">
                  <div className="flex items-center text-green-500">
                    <CheckCircle2 className="h-5 w-5 mr-1" />
                    <span className="text-sm font-medium">Concluído</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenUnmarkDialog(exercicio)}
                      className="text-red-500 border-red-200 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-1" /> Desmarcar
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleStartExercise(exercicio)}
                  >
                    <Play className="h-4 w-4 mr-1" /> Iniciar
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Diálogo de confirmação para desmarcar exercício */}
      <Dialog open={unmarkDialogOpen} onOpenChange={setUnmarkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Desmarcar exercício concluído?
            </DialogTitle>
            <DialogDescription>
              Esta ação removerá o status de "concluído" do exercício 
              {exercicioToUnmark?.exercicio?.nome && (
                <span className="font-medium"> "{exercicioToUnmark.exercicio.nome}"</span>
              )}.
              <div className="mt-2 border-l-4 border-yellow-200 pl-3 py-1 bg-yellow-50 text-yellow-800 rounded">
                Isso pode afetar métricas e relatórios de desempenho associados a este exercício.
              </div>
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="flex sm:justify-between gap-3">
            <Button
              variant="ghost"
              onClick={() => setUnmarkDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleUnmarkExercise}
            >
              Sim, desmarcar exercício
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExerciseList;
