import React, { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { debounce } from "lodash";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  CheckCircle,
  XCircle,
  Filter,
  FileBarChart,
  BarChart3,
  CheckCircle2
} from "lucide-react";
import {
  fetchPresencasAtletas,
  salvarAvaliacaoExercicio
} from "@/services/treinosDoDiaService";
import { supabase } from "@/lib/supabase";

interface RapidExerciseEvaluationProps {
  exerciseId: string;
  treinoDoDiaId: string;
  exerciseName: string;
  className?: string;
}

const FUNDAMENTOS = [
  "Saque",
  "Recepção",
  "Levantamento",
  "Ataque",
  "Bloqueio",
  "Defesa"
];

// Função para buscar avaliações do localStorage
const getEvaluationsFromLocalStorage = (treinoId: string | null, exerciseId: string, fundamento: string) => {
  try {
    const localEvaluations = JSON.parse(localStorage.getItem('avaliacoes_fundamento') || '[]');
    return localEvaluations.filter((evaluation: any) => {
      return (
        (!treinoId || evaluation.treino_id === treinoId) && 
        evaluation.exercicio_id === exerciseId && 
        evaluation.fundamento === fundamento
      );
    });
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return [];
  }
};

export function RapidExerciseEvaluation({
  exerciseId,
  treinoDoDiaId,
  exerciseName,
  className,
}: RapidExerciseEvaluationProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFundamento, setSelectedFundamento] = useState(FUNDAMENTOS[0]);
  const [avaliations, setAvaliations] = useState<{ [key: string]: { acertos: number; erros: number } }>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch athletes with attendance
  const { data: athletesWithAttendance = [], isLoading: isLoadingAthletes } = useQuery({
    queryKey: ["athletes-attendance", treinoDoDiaId],
    queryFn: () => fetchPresencasAtletas(treinoDoDiaId),
  });

  // Fetch existing evaluations
  const { data: existingEvaluations = [], isLoading: isLoadingEvaluations } = useQuery({
    queryKey: ["evaluations", treinoDoDiaId, exerciseId, selectedFundamento],
    queryFn: async () => {
      try {
        // First, get the corresponding treino id
        const { data: treinoDoDia, error: treinoError } = await supabase
          .from('treinos_do_dia')
          .select('treino_id')
          .eq('id', treinoDoDiaId)
          .single();

        if (treinoError) {
          console.error('Error fetching treino do dia for evaluation:', treinoError);
          throw new Error(treinoError.message);
        }

        const { data, error } = await supabase
          .from('avaliacoes_fundamento')
          .select('*')
          .eq('treino_id', treinoDoDia.treino_id)
          .eq('exercicio_id', exerciseId)
          .eq('fundamento', selectedFundamento);

        if (error) {
          // Se ocorrer erro (provavelmente RLS), buscar do localStorage
          console.warn('Error fetching evaluations from Supabase, falling back to localStorage:', error);
          return getEvaluationsFromLocalStorage(treinoDoDia.treino_id, exerciseId, selectedFundamento);
        }

        // Mesclar dados do Supabase com os do localStorage
        const localData = getEvaluationsFromLocalStorage(treinoDoDia.treino_id, exerciseId, selectedFundamento);
        const supabaseIds = new Set(data.map((item: any) => item.id));
        
        // Adicionar apenas os dados do localStorage que não existem no Supabase
        const mergedData = [
          ...data,
          ...localData.filter((item: any) => !supabaseIds.has(item.id))
        ];
        
        return mergedData || [];
      } catch (error) {
        console.error('Error in fetchEvaluations:', error);
        // Fallback para localStorage
        return getEvaluationsFromLocalStorage(null, exerciseId, selectedFundamento);
      }
    },
    enabled: !!treinoDoDiaId && !!exerciseId && !!selectedFundamento,
  });

  // Initialize avaliations state with existing evaluations
  useEffect(() => {
    if (existingEvaluations?.length) {
      const evaluationsMap = existingEvaluations.reduce((acc, evaluation) => {
        acc[evaluation.atleta_id] = {
          acertos: evaluation.acertos,
          erros: evaluation.erros
        };
        return acc;
      }, {} as { [key: string]: { acertos: number; erros: number } });
      
      setAvaliations(evaluationsMap);
    }
  }, [existingEvaluations]);

  // Filter athletes based on search and presence
  const presentAthletes = athletesWithAttendance
    .filter(a => a.presente)
    .filter(a => 
      a.atleta.nome.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => a.atleta.nome.localeCompare(b.atleta.nome));

  // Mutations for saving evaluation
  const saveEvaluationMutation = useMutation({
    mutationFn: salvarAvaliacaoExercicio,
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["evaluations", treinoDoDiaId, exerciseId, selectedFundamento] 
      });
      toast({
        title: "Avaliação atualizada",
        description: "A avaliação foi registrada com sucesso!",
        duration: 2000
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar avaliação",
        description: "Não foi possível salvar a avaliação. Tente novamente.",
        variant: "destructive"
      });
      console.error("Error saving evaluation:", error);
    }
  });

  // Debounced save function
  const debouncedSave = useCallback(
    debounce((atletaId: string, acertos: number, erros: number) => {
      saveEvaluationMutation.mutate({
        treinoDoDiaId,
        exercicioId: exerciseId,
        atletaId,
        fundamento: selectedFundamento,
        acertos,
        erros
      });
    }, 1000),
    [treinoDoDiaId, exerciseId, selectedFundamento, saveEvaluationMutation]
  );

  // Handle score updates
  const handleScoreUpdate = (atletaId: string, isAcerto: boolean) => {
    const currentScore = avaliations[atletaId] || { acertos: 0, erros: 0 };
    
    const updatedScore = isAcerto
      ? { ...currentScore, acertos: currentScore.acertos + 1 }
      : { ...currentScore, erros: currentScore.erros + 1 };
    
    setAvaliations(prev => ({
      ...prev,
      [atletaId]: updatedScore
    }));
    
    debouncedSave(atletaId, updatedScore.acertos, updatedScore.erros);
  };

  // Handle reset score
  const handleResetScore = (atletaId: string) => {
    setAvaliations(prev => ({
      ...prev,
      [atletaId]: { acertos: 0, erros: 0 }
    }));
    
    debouncedSave(atletaId, 0, 0);
  };

  // Loading state
  if (isLoadingAthletes || isLoadingEvaluations) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <LoadingSpinner />
        <p className="mt-4 text-muted-foreground">Carregando avaliações...</p>
      </div>
    );
  }

  // Check if no athletes are present
  if (presentAthletes.length === 0) {
    return (
      <div className="text-center py-6">
        <FileBarChart className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
        <p>Nenhum atleta marcado como presente.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Registre a presença dos atletas primeiro.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Badge variant="outline" className="mb-2">{exerciseName}</Badge>
          <h3 className="text-md font-semibold">{presentAthletes.length} atletas presentes</h3>
        </div>
        
        <Select value={selectedFundamento} onValueChange={setSelectedFundamento}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Selecione o fundamento" />
          </SelectTrigger>
          <SelectContent>
            {FUNDAMENTOS.map(fundamento => (
              <SelectItem key={fundamento} value={fundamento}>{fundamento}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar atleta..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Statistics summary */}
      <div className="flex gap-3 items-center justify-center bg-muted/50 p-2 rounded-lg">
        <div className="flex gap-1 items-center">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Fundamento: {selectedFundamento}</span>
        </div>
        <div className="flex gap-1 items-center">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span className="text-sm">
            {Object.values(avaliations).reduce((sum, val) => sum + val.acertos, 0)} acertos
          </span>
        </div>
        <div className="flex gap-1 items-center">
          <XCircle className="h-4 w-4 text-red-500" />
          <span className="text-sm">
            {Object.values(avaliations).reduce((sum, val) => sum + val.erros, 0)} erros
          </span>
        </div>
      </div>

      {/* Athletes grid */}
      <div className="grid gap-2 pb-4">
        {presentAthletes.map(({ atleta }) => {
          const stats = avaliations[atleta.id] || { acertos: 0, erros: 0 };
          const total = stats.acertos + stats.erros;
          const acertoPercent = total > 0 ? Math.round((stats.acertos / total) * 100) : 0;
          
          return (
            <div
              key={atleta.id}
              className="flex items-center justify-between p-3 border rounded-lg bg-background"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{atleta.nome}</p>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span>{atleta.posicao}</span>
                  {total > 0 && (
                    <span className="text-xs font-medium">
                      ({acertoPercent}% eficiência)
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 ml-2">
                <div className="flex flex-col items-center bg-muted rounded px-2 py-1">
                  <span className="text-xs text-muted-foreground">Acertos</span>
                  <span className="font-bold text-green-500">{stats.acertos}</span>
                </div>
                
                <div className="flex flex-col items-center bg-muted rounded px-2 py-1">
                  <span className="text-xs text-muted-foreground">Erros</span>
                  <span className="font-bold text-red-500">{stats.erros}</span>
                </div>
                
                <div className="flex flex-col gap-1 ml-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-full bg-green-500/10 hover:bg-green-500/20 text-green-500"
                    onClick={() => handleScoreUpdate(atleta.id, true)}
                  >
                    <CheckCircle className="h-5 w-5" />
                  </Button>
                  
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500"
                    onClick={() => handleScoreUpdate(atleta.id, false)}
                  >
                    <XCircle className="h-5 w-5" />
                  </Button>
                </div>
                
                {total > 0 && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    onClick={() => handleResetScore(atleta.id)}
                    title="Limpar contagem"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <path d="M3 12h18"></path>
                    </svg>
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 