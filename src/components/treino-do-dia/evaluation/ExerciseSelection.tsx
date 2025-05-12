import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  ClipboardCheck, 
  ClipboardList, 
  Clock, 
  PlayCircle,
  X,
  Loader2
} from "lucide-react";
import { getExerciciosTreinoDoDia } from "@/services/treinosDoDiaService";
import { supabase } from "@/lib/supabase";

interface ExerciseSelectionProps {
  treinoId: string;
  onExerciseSelect: (exercise: any) => void;
  onClose?: () => void;
}

const ExerciseSelection = ({ treinoId, onExerciseSelect, onClose }: ExerciseSelectionProps) => {
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadExercises() {
      try {
        setLoading(true);
        console.log("[ExerciseSelection] Carregando exercícios para o treino:", treinoId);
        
        const data = await getExerciciosTreinoDoDia(treinoId);
        
        if (!data || data.length === 0) {
          console.log("[ExerciseSelection] Nenhum exercício encontrado para o treino:", treinoId);
          setExercises([]);
          return;
        }
        
        console.log("[ExerciseSelection] Exercícios carregados:", data.length);
        
        // Validar cada exercício antes de incluí-lo na lista
        const exerciciosValidados = await Promise.all(
          data.map(async (exercicio) => {
            if (!exercicio.id) {
              console.warn("[ExerciseSelection] Exercício sem ID encontrado:", exercicio);
              return null;
            }
            
            // Verificar se o exercício existe no banco de dados
            if (exercicio.exercicio && exercicio.exercicio.id) {
              try {
                const { data: validacao, error: erroValidacao } = await supabase
                  .from('exercicios')
                  .select('id')
                  .eq('id', exercicio.exercicio.id)
                  .maybeSingle();
                
                if (erroValidacao) {
                  console.warn("[ExerciseSelection] Erro ao validar exercício:", erroValidacao);
                } else if (!validacao) {
                  console.warn("[ExerciseSelection] Exercício não encontrado no banco:", exercicio.exercicio.id);
                  return { ...exercicio, validado: false };
                } else {
                  return { ...exercicio, validado: true };
                }
              } catch (err) {
                console.error("[ExerciseSelection] Exceção ao validar exercício:", err);
              }
            }
            
            return exercicio;
          })
        );
        
        // Filtrar exercícios nulos (que falharam na validação)
        const exerciciosValidos = exerciciosValidados.filter(Boolean);
        console.log("[ExerciseSelection] Exercícios válidos após validação:", exerciciosValidos.length);
        
        setExercises(exerciciosValidos);
      } catch (err) {
        console.error("[ExerciseSelection] Erro ao carregar exercícios para avaliação:", err);
        setError("Não foi possível carregar os exercícios para este treino.");
      } finally {
        setLoading(false);
      }
    }

    loadExercises();
  }, [treinoId]);

  const handleSelectExercise = (exercise: any) => {
    console.log("[ExerciseSelection] Exercício selecionado para avaliação:", {
      id: exercise.id,
      nome: exercise.exercicio?.nome || "Sem nome",
      validado: exercise.validado
    });
    
    // Se o exercício foi validado ou não tem a propriedade validado (para compatibilidade)
    if (exercise.validado !== false) {
      onExerciseSelect(exercise);
    } else {
      console.warn("[ExerciseSelection] Tentativa de selecionar exercício inválido:", exercise);
      // Permitir a seleção mesmo assim, pois o EvaluationFlow tem validação adicional
      onExerciseSelect(exercise);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Carregando exercícios...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600">
          <X className="h-8 w-8" />
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-1">Erro ao carregar exercícios</h3>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
        
        {onClose && (
          <Button onClick={onClose} variant="outline" className="mt-4">
            <X className="h-4 w-4 mr-2" />
            Fechar
          </Button>
        )}
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-600">
          <ClipboardList className="h-8 w-8" />
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-1">Nenhum exercício disponível</h3>
          <p className="text-muted-foreground text-sm">
            Não há exercícios disponíveis para este treino.
          </p>
        </div>
        
        {onClose && (
          <Button onClick={onClose} variant="outline" className="mt-4">
            <X className="h-4 w-4 mr-2" />
            Fechar
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-1">Selecione o exercício</h2>
        <p className="text-sm text-muted-foreground">
          Escolha um exercício para avaliar os atletas durante ou após sua execução
        </p>
      </div>
      
      <div className="space-y-3 overflow-y-auto max-h-[60vh]">
        {exercises.map((exercise, index) => (
          <div
            key={exercise.id}
            className={`border rounded-md p-4 hover:border-primary transition cursor-pointer ${
              exercise.validado === false ? 'border-yellow-300 bg-yellow-50' : ''
            }`}
            onClick={() => handleSelectExercise(exercise)}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center mb-1">
                  <span className="text-xs font-medium bg-muted px-2 py-0.5 rounded-full">
                    #{index + 1}
                  </span>
                  <h3 className="font-medium ml-2">
                    {exercise.exercicio?.nome || "Exercício"}
                  </h3>
                </div>
                
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  {exercise.exercicio?.tempo_estimado || "?"} min
                  {exercise.concluido && (
                    <span className="ml-2 text-green-500 flex items-center">
                      <ClipboardCheck className="h-3 w-3 mr-1" />
                      Concluído
                    </span>
                  )}
                </div>
              </div>
              
              <Button
                size="sm"
                variant="outline"
                className="border-green-500/30 bg-green-500/10 hover:bg-green-500/20 text-green-600"
              >
                <PlayCircle className="h-4 w-4 mr-1" />
                Avaliar
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExerciseSelection;
