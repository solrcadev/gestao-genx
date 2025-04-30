import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Save, ClipboardList } from "lucide-react";
import ExerciseSelection from "./ExerciseSelection";
import RealTimeEvaluation from "./RealTimeEvaluation";
import EvaluationSummary from "./EvaluationSummary";
import LoadingSpinner from "@/components/LoadingSpinner";
import { fetchTreinoAtual } from "@/services/treinosDoDiaService";

interface EvaluationFlowProps {
  treinoDoDiaId: string;
  onClose: () => void;
}

type Step = "select-exercise" | "evaluate" | "summary";

export function EvaluationFlow({ treinoDoDiaId, onClose }: EvaluationFlowProps) {
  const [step, setStep] = useState<Step>("select-exercise");
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [evaluationData, setEvaluationData] = useState<{}>({});
  const { toast } = useToast();

  // Fetch exercises for this treino do dia
  const { data: treinoData, isLoading } = useQuery({
    queryKey: ["treino-atual", treinoDoDiaId],
    queryFn: () => fetchTreinoAtual(treinoDoDiaId),
  });

  const handleExerciseSelect = (exercise: any) => {
    setSelectedExercise(exercise);
    setStep("evaluate");
  };

  const handleBackToExercises = () => {
    setStep("select-exercise");
  };

  const handleFinishEvaluation = (evaluationResults: any) => {
    // Apenas para compatibilidade com o componente anterior
    setEvaluationData(evaluationResults);
    setStep("summary");
  };

  const handleEditEvaluation = () => {
    setStep("evaluate");
  };

  const handleSaveComplete = () => {
    toast({
      title: "Avaliação salva",
      description: "A avaliação foi salva com sucesso!",
      duration: 3000,
    });
    onClose();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <LoadingSpinner />
        <p className="mt-4 text-muted-foreground">Carregando treino...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex flex-1 items-center">
          <div
            className={`h-2 flex-1 rounded-full ${
              step === "select-exercise"
                ? "bg-primary"
                : "bg-primary/30"
            }`}
          ></div>
          <div
            className={`h-2 flex-1 rounded-full mx-1 ${
              step === "evaluate" ? "bg-primary" : "bg-primary/30"
            }`}
          ></div>
          <div
            className={`h-2 flex-1 rounded-full ${
              step === "summary" ? "bg-primary" : "bg-primary/30"
            }`}
          ></div>
        </div>
        <div className="ml-4 text-sm text-muted-foreground">
          {step === "select-exercise" && "Passo 1/3"}
          {step === "evaluate" && "Passo 2/3"}
          {step === "summary" && "Passo 3/3"}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {step === "select-exercise" && (
          <ExerciseSelection
            exercises={treinoData?.exercicios || []}
            onSelect={handleExerciseSelect}
            onClose={onClose}
          />
        )}

        {step === "evaluate" && selectedExercise && (
          <RealTimeEvaluation
            exercise={selectedExercise}
            treinoDoDiaId={treinoDoDiaId}
            onBack={handleBackToExercises}
            onComplete={handleFinishEvaluation}
          />
        )}

        {step === "summary" && (
          <EvaluationSummary
            exercise={selectedExercise}
            treinoDoDiaId={treinoDoDiaId}
            evaluationData={{}} // Não utilizamos mais dados binários
            onEdit={handleEditEvaluation}
            onSave={handleSaveComplete}
          />
        )}
      </div>

      {/* Navigation footer */}
      <div className="pt-4 flex items-center justify-between border-t mt-4">
        {step !== "select-exercise" ? (
          <Button
            variant="outline"
            size="sm"
            onClick={
              step === "evaluate"
                ? handleBackToExercises
                : handleEditEvaluation
            }
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {step === "evaluate" ? "Voltar" : "Editar"}
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={onClose}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
        )}

        {step === "evaluate" && (
          <Button
            size="sm"
            onClick={() => setStep("summary")}
          >
            Revisar
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}

        {step === "summary" && (
          <Button
            size="sm"
            onClick={handleSaveComplete}
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>
        )}
      </div>
    </div>
  );
}

export default EvaluationFlow;
