import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { RapidExerciseEvaluation } from "./RapidExerciseEvaluation";
import LoadingSpinner from "@/components/LoadingSpinner";
import { FileBarChart, BarChart3 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ExerciseEvaluationTabsProps {
  treinoDoDiaId: string;
  className?: string;
}

export function ExerciseEvaluationTabs({
  treinoDoDiaId,
  className,
}: ExerciseEvaluationTabsProps) {
  const [activeTab, setActiveTab] = useState<string>("");

  // Fetch exercises for this treino do dia
  const { data: exercicios = [], isLoading: isLoadingExercicios } = useQuery({
    queryKey: ["exercises", treinoDoDiaId],
    queryFn: async () => {
      // First, get the treino_id from treino_do_dia
      const { data: treinoDoDia, error: treinoDoDiaError } = await supabase
        .from("treinos_do_dia")
        .select("treino_id")
        .eq("id", treinoDoDiaId)
        .single();

      if (treinoDoDiaError) {
        console.error("Error fetching treino do dia:", treinoDoDiaError);
        throw new Error(treinoDoDiaError.message);
      }

      // Then, get the exercises for this treino
      const { data: exerciciosData, error: exerciciosError } = await supabase
        .from("treinos_exercicios")
        .select(`
          id,
          treino_id,
          exercicio_id,
          ordem,
          observacao,
          exercicio:exercicio_id (
            id, 
            nome, 
            categoria,
            descricao
          )
        `)
        .eq("treino_id", treinoDoDia.treino_id)
        .order("ordem", { ascending: true });

      if (exerciciosError) {
        console.error("Error fetching exercises:", exerciciosError);
        throw new Error(exerciciosError.message);
      }

      return exerciciosData || [];
    },
    enabled: !!treinoDoDiaId,
  });

  // Set active tab when exercises are loaded
  React.useEffect(() => {
    if (exercicios.length > 0 && !activeTab) {
      // Verifica se exercicio_id existe no primeiro elemento
      if (exercicios[0] && exercicios[0].exercicio_id) {
        setActiveTab(exercicios[0].exercicio_id);
      }
    }
  }, [exercicios, activeTab]);

  if (isLoadingExercicios) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <LoadingSpinner />
        <p className="mt-4 text-muted-foreground">Carregando exercícios...</p>
      </div>
    );
  }

  if (exercicios.length === 0) {
    return (
      <div className="text-center py-6">
        <FileBarChart className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
        <p>Nenhum exercício encontrado para este treino.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Verifique se os exercícios foram adicionados corretamente.
        </p>
      </div>
    );
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className={className}
    >
      <TabsList className="grid grid-flow-col auto-cols-fr mb-4 overflow-x-auto max-w-full">
        {exercicios.map((exercicio: any) => (
          <TabsTrigger
            key={exercicio.exercicio_id}
            value={exercicio.exercicio_id}
            className="truncate"
          >
            {exercicio.exercicio?.nome || "Exercício"}
          </TabsTrigger>
        ))}
      </TabsList>

      {exercicios.map((exercicio: any) => (
        <TabsContent
          key={exercicio.exercicio_id}
          value={exercicio.exercicio_id}
          className="mt-2"
        >
          <RapidExerciseEvaluation
            treinoDoDiaId={treinoDoDiaId}
            exerciseId={exercicio.exercicio_id}
            exerciseName={exercicio.exercicio?.nome || "Exercício"}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
} 