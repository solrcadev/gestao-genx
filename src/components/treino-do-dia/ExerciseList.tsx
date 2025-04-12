
import React, { useState, useEffect } from "react";
import { fetchTreinoAtual } from "@/services/treinosDoDiaService";
import LoadingSpinner from "../LoadingSpinner";
import { Clipboard, Play, Clock, CheckCircle2, BarChart3 } from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "../ui/use-toast";
import { ExerciseTimer } from "./ExerciseTimer";
import { ExerciseEvaluationTabs } from "./ExerciseEvaluationTabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { EvaluationDialog } from "./EvaluationDialog";

interface ExerciseListProps {
  treinoDoDiaId: string;
}

const ExerciseList = ({ treinoDoDiaId }: ExerciseListProps) => {
  const [loading, setLoading] = useState(true);
  const [exercicios, setExercicios] = useState([]);
  const [activeExercise, setActiveExercise] = useState(null);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isEvaluationOpen, setIsEvaluationOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    loadExercicios();
  }, [treinoDoDiaId]);

  const loadExercicios = async () => {
    try {
      setLoading(true);
      const treinoAtual = await fetchTreinoAtual(treinoDoDiaId);
      setExercicios(treinoAtual.exercicios || []);
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
  
  const openEvaluation = () => {
    setIsEvaluationOpen(true);
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
      />
    );
  }
  
  // Check if there are completed exercises
  const hasCompletedExercises = exercicios.some(ex => ex.concluido);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-lg flex items-center">
          <Clipboard className="h-5 w-5 mr-2" /> Exercícios
        </h2>
        
        {hasCompletedExercises && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={openEvaluation}
            className="flex items-center gap-1"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Avaliar</span>
          </Button>
        )}
      </div>

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
                  {exercicio.tempo || "?"} min
                </div>
                
                {exercicio.observacao && (
                  <p className="text-sm mt-2">{exercicio.observacao}</p>
                )}
              </div>

              {exercicio.concluido ? (
                <div className="flex items-center text-green-500">
                  <CheckCircle2 className="h-5 w-5 mr-1" />
                  <span className="text-sm font-medium">Concluído</span>
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

          {exercicio.concluido && (
            <div className="border-t p-4">
              <ExerciseEvaluationTabs
                treinoDoDiaId={treinoDoDiaId}
                exerciseId={exercicio.exercicio_id}
                exerciseName={exercicio.exercicio?.nome || "Exercício"}
              />
            </div>
          )}
        </div>
      ))}
      
      <EvaluationDialog 
        open={isEvaluationOpen} 
        onOpenChange={setIsEvaluationOpen} 
        treinoDoDiaId={treinoDoDiaId} 
      />
    </div>
  );
};

export default ExerciseList;
