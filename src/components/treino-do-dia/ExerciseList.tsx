import React, { useState, useEffect } from "react";
import { fetchTreinoAtual } from "@/services/treinosDoDiaService";
import LoadingSpinner from "../LoadingSpinner";
import { Clipboard, Play, Clock, CheckCircle2, BarChart3, AlertTriangle } from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "@/hooks/use-toast";
import { ExerciseTimer } from "./ExerciseTimer";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/lib/supabase";
import ToggleExerciseStatus from "./ToggleExerciseStatus";
import ExercisePerformanceData from "./ExercisePerformanceData";

interface ExerciseListProps {
  treinoDoDiaId: string;
}

const ExerciseList = ({ treinoDoDiaId }: ExerciseListProps) => {
  const [loading, setLoading] = useState(true);
  const [exercicios, setExercicios] = useState([]);
  const [activeExercise, setActiveExercise] = useState(null);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [exerciciosComAvaliacao, setExerciciosComAvaliacao] = useState({});
  const isMobile = useIsMobile();

  useEffect(() => {
    loadExercicios();
  }, [treinoDoDiaId]);

  const loadExercicios = async () => {
    try {
      setLoading(true);
      const treinoAtual = await fetchTreinoAtual(treinoDoDiaId);
      
      // Verificar quais exercícios já têm avaliações
      const exerciciosIds = (treinoAtual.exercicios || []).map(ex => ex.id);
      
      if (exerciciosIds.length > 0) {
        const { data: avaliacoes } = await supabase
          .from('avaliacoes_fundamento')
          .select('exercicio_id')
          .in('exercicio_id', exerciciosIds);
        
        // Criar um mapa de exercícios com avaliações
        const exerciciosAvaliadosMap = {};
        (avaliacoes || []).forEach(av => {
          exerciciosAvaliadosMap[av.exercicio_id] = true;
        });
        
        setExerciciosComAvaliacao(exerciciosAvaliadosMap);
      }
      
      // Adicionar propriedade hasEvaluations para cada exercício
      const exerciciosProcessados = (treinoAtual.exercicios || []).map(exercicio => ({
        ...exercicio,
        hasEvaluations: exerciciosComAvaliacao[exercicio.id] || false
      }));
      
      setExercicios(exerciciosProcessados);
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

  const handleToggleStatus = async (exerciseId: string, completed: boolean) => {
    try {
      // Se estiver desmarcando, verificar primeiro se tem avaliações
      if (!completed) {
        const { data: avaliacoes, error } = await supabase
          .from('avaliacoes_fundamento')
          .select('id')
          .eq('exercicio_id', exerciseId);
        
        const temAvaliacoes = avaliacoes && avaliacoes.length > 0;
        
        // Atualizar o estado local para exibir a mensagem
        if (temAvaliacoes) {
          setExerciciosComAvaliacao(prev => ({
            ...prev,
            [exerciseId]: true
          }));
          
          // Exibir toast de aviso para informar sobre as avaliações
          toast({
            title: "Avaliações preservadas",
            description: "Os dados de avaliação serão mantidos e estarão disponíveis quando o exercício for marcado como concluído novamente.",
            duration: 5000,
          });
        }
      }
      
      // Atualizar o status do exercício no banco de dados
      const { error } = await supabase
        .from('treinos_exercicios')
        .update({ concluido: completed })
        .eq('id', exerciseId);

      if (error) throw error;
      
      // Atualizar a lista de exercícios localmente
      setExercicios(prev => prev.map(ex => {
        if (ex.id === exerciseId) {
          return {
            ...ex,
            concluido: completed,
            hasEvaluations: exerciciosComAvaliacao[exerciseId] || false
          };
        }
        return ex;
      }));
      
      // Exibir toast de confirmação
      toast({
        title: completed ? "Exercício concluído" : "Exercício desmarcado",
        description: "O status do exercício foi atualizado com sucesso.",
        duration: 3000,
      });
      
    } catch (error) {
      console.error("Error toggling exercise status:", error);
      
      // Exibir toast de erro
      toast({
        title: "Erro ao atualizar status",
        description: "Não foi possível atualizar o status do exercício. Tente novamente.",
        variant: "destructive",
        duration: 5000,
      });
      
      throw error;
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
        estimatedTime={activeExercise.tempo || 10}
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
                    {exercicio.tempo || "?"} min
                  </div>
                  
                  {exercicio.observacao && (
                    <p className="text-sm mt-2">{exercicio.observacao}</p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <ToggleExerciseStatus
                    exerciseId={exercicio.id}
                    isCompleted={exercicio.concluido}
                    onStatusChange={(completed) => handleToggleStatus(exercicio.id, completed)}
                  />
                  
                  {!exercicio.concluido && (
                    <Button
                      size="sm"
                      onClick={() => handleStartExercise(exercicio)}
                    >
                      <Play className="h-4 w-4 mr-1" /> Iniciar
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Exibir dados de desempenho apenas quando concluído */}
              {exercicio.concluido ? (
                <ExercisePerformanceData 
                  exerciseId={exercicio.id} 
                  treinoDoDiaId={treinoDoDiaId} 
                />
              ) : exercicio.hasEvaluations || exerciciosComAvaliacao[exercicio.id] ? (
                <div className="mt-3 p-2 bg-amber-50 text-amber-700 rounded-md text-sm flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1 flex-shrink-0" /> 
                  <span>Existem dados de avaliação salvos que serão exibidos quando o exercício for marcado como concluído.</span>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExerciseList;
