import React, { useState, useEffect, useCallback } from "react";
import { concluirExercicio } from "@/services/treinosDoDiaService";
import { Button } from "../ui/button";
import { toast } from "../ui/use-toast";
import { Clock, Play, Pause, Check, X, BarChart3 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { cn } from "@/lib/utils";
import { RealTimeEvaluation } from "./evaluation/RealTimeEvaluation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import ErrorBoundary from "@/components/ErrorBoundary";

interface ExerciseTimerProps {
  exerciseData: any;
  treinoDoDiaId: string;
  onFinish: () => void;
  onCancel: () => void;
  estimatedTime: number;
}

export const ExerciseTimer: React.FC<ExerciseTimerProps> = ({
  exerciseData,
  treinoDoDiaId,
  onFinish,
  onCancel,
  estimatedTime = 10,
}) => {
  const [isRunning, setIsRunning] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const [activeTab, setActiveTab] = useState<"timer" | "evaluation">("timer");
  const [evaluationData, setEvaluationData] = useState({});

  // Time display formatting
  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Timer management
  useEffect(() => {
    let intervalId: number;

    if (isRunning) {
      intervalId = window.setInterval(() => {
        setElapsedTime((prevTime) => prevTime + 1);
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRunning]);

  // Toggle timer
  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  // Finish exercise handler
  const handleFinishExercise = async () => {
    try {
      await concluirExercicio({
        treinoDoDiaId,
        exercicioId: exerciseData.id,
        tempoReal: elapsedTime,
      });

      toast({
        title: "Exercício concluído",
        description: `Tempo registrado: ${formatTime(elapsedTime)}`,
      });

      onFinish();
    } catch (error) {
      console.error("Error concluding exercise:", error);
      toast({
        title: "Erro",
        description: "Não foi possível concluir o exercício.",
        variant: "destructive",
      });
    }
  };

  // Handle evaluation data update
  const handleEvaluationUpdate = (data) => {
    console.log("Dados de avaliação atualizados:", data);
    setEvaluationData(data);
    
    // Também podemos salvar no localStorage como backup
    try {
      localStorage.setItem(`evaluation_backup_${treinoDoDiaId}_${exerciseData.id}`, JSON.stringify(data));
    } catch (e) {
      console.warn("Não foi possível fazer backup da avaliação:", e);
    }
  };

  // Tentar carregar dados salvos do localStorage ao iniciar
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(`evaluation_backup_${treinoDoDiaId}_${exerciseData.id}`);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        if (parsedData && Object.keys(parsedData).length > 0) {
          console.log("Carregando dados de avaliação do backup:", parsedData);
          setEvaluationData(parsedData);
        }
      }
    } catch (e) {
      console.warn("Erro ao carregar backup de avaliação:", e);
    }
  }, [treinoDoDiaId, exerciseData.id]);

  // Calculate progress percentage for the timer bar
  const progressPercentage = Math.min((elapsedTime / (estimatedTime * 60)) * 100, 100);

  return (
    <div className="flex flex-col h-full">
      <Tabs value={activeTab} onValueChange={(tab) => setActiveTab(tab as "timer" | "evaluation")} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="timer">
            <Clock className="h-4 w-4 mr-2" /> Cronômetro
          </TabsTrigger>
          <TabsTrigger value="evaluation">
            <BarChart3 className="h-4 w-4 mr-2" /> Avaliação
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="timer" className="mt-4">
          <div className="space-y-4">
            {/* Exercise name and timer */}
            <div className="bg-muted/30 p-6 text-center rounded-lg">
              <h3 className="font-medium mb-1 text-lg">
                {exerciseData.exercicio?.nome || "Exercício"}
              </h3>
              <div className="text-4xl font-bold tabular-nums">
                {formatTime(elapsedTime)}
              </div>
              <div className="mt-3 bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Início</span>
                <span>
                  {estimatedTime} min ({formatTime(estimatedTime * 60)})
                </span>
              </div>
            </div>

            {/* Timer controls */}
            <div className="flex justify-center gap-2">
              <Button onClick={toggleTimer} size="lg" variant="secondary">
                {isRunning ? <Pause /> : <Play />}
                <span className="ml-2">{isRunning ? "Pausar" : "Continuar"}</span>
              </Button>
              <Button
                onClick={() => setShowConfirmFinish(true)}
                size="lg"
                variant="default"
              >
                <Check className="mr-2" />
                Finalizar
              </Button>
            </div>

            {/* Cancel button */}
            <div className="mt-8 text-center">
              <Button variant="ghost" onClick={onCancel} className="text-muted-foreground">
                <X className="mr-2 h-4 w-4" /> Cancelar
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="evaluation" className="mt-4">
          <ErrorBoundary fallback={
            <div className="p-6 text-center">
              <p className="text-muted-foreground mb-4">
                Ocorreu um erro ao carregar a avaliação.
              </p>
              <Button onClick={() => setActiveTab("timer")} variant="outline">
                Voltar ao cronômetro
              </Button>
            </div>
          }>
            <RealTimeEvaluation
              exercise={exerciseData}
              treinoDoDiaId={treinoDoDiaId}
              onComplete={handleEvaluationUpdate}
              onBack={() => setActiveTab("timer")}
              initialData={evaluationData}
            />
          </ErrorBoundary>
        </TabsContent>
      </Tabs>

      {/* Confirmation dialog */}
      <Dialog open={showConfirmFinish} onOpenChange={setShowConfirmFinish}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar exercício?</DialogTitle>
          </DialogHeader>
          <p>
            Tempo registrado: <span className="font-medium">{formatTime(elapsedTime)}</span>
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowConfirmFinish(false)}>
              Cancelar
            </Button>
            <Button onClick={handleFinishExercise}>Confirmar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
