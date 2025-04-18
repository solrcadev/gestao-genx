import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, Search, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetchPresencasAtletas, salvarAvaliacaoExercicio } from "@/services/treinosDoDiaService";
import { cn } from "@/lib/utils";
import LoadingSpinner from "@/components/LoadingSpinner";

interface RealTimeEvaluationProps {
  exercise: any;
  treinoDoDiaId: string;
  initialData?: any;
  onBack: () => void;
  onComplete: (results: any) => void;
}

// Fundamentos predefinidos (poderia vir do banco de dados)
const DEFAULT_FUNDAMENTOS = ["Saque", "Recepção", "Levantamento", "Ataque", "Bloqueio", "Defesa"];

export const RealTimeEvaluation = ({ 
  exercise, 
  treinoDoDiaId,
  initialData = {},
  onBack,
  onComplete
}: RealTimeEvaluationProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [fundamentos, setFundamentos] = useState<string[]>(DEFAULT_FUNDAMENTOS);
  const [activeFundamento, setActiveFundamento] = useState<string>(DEFAULT_FUNDAMENTOS[0]);
  const [evaluationData, setEvaluationData] = useState<{
    [atletaId: string]: {
      [fundamento: string]: { acertos: number; erros: number };
    };
  }>(initialData);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const { toast } = useToast();

  // Fetch athletes with attendance status
  const { data: athletesWithAttendance = [], isLoading: isLoadingAthletes } = useQuery({
    queryKey: ["athletes-attendance", treinoDoDiaId],
    queryFn: () => fetchPresencasAtletas(treinoDoDiaId),
  });

  // Mutation for saving evaluations
  const saveEvaluationMutation = useMutation({
    mutationFn: salvarAvaliacaoExercicio,
    onSuccess: () => {
      toast({
        title: "Avaliação salva",
        description: "A avaliação foi registrada com sucesso!",
        duration: 1500
      });
    },
    onError: (error) => {
      console.error("Error saving evaluation:", error);
      toast({
        title: "Erro ao salvar avaliação",
        description: "Não foi possível salvar a avaliação.",
        variant: "destructive"
      });
    }
  });

  // Initialize data structure for each athlete if coming from initialData
  useEffect(() => {
    // Evitar inicialização repetida para prevenir loops infinitos
    if (isInitialized) {
      return;
    }
    
    if (Object.keys(initialData).length > 0) {
      console.log("Inicializando dados de avaliação a partir do initialData");
      setEvaluationData(initialData);
      setIsInitialized(true);
    } else if (athletesWithAttendance.length > 0) {
      console.log("Inicializando dados de avaliação para atletas presentes");
      const presentAthletes = athletesWithAttendance.filter(a => a.presente).map(a => a.atleta.id);
      
      // Initialize empty evaluation data for all present athletes
      const initialEvalData = presentAthletes.reduce((acc, atletaId) => {
        acc[atletaId] = fundamentos.reduce((fundAcc, fundamento) => {
          fundAcc[fundamento] = { acertos: 0, erros: 0 };
          return fundAcc;
        }, {} as { [fundamento: string]: { acertos: number; erros: number } });
        return acc;
      }, {} as { [atletaId: string]: { [fundamento: string]: { acertos: number; erros: number } } });
      
      setEvaluationData(initialEvalData);
      setIsInitialized(true);
    }
  }, [athletesWithAttendance, fundamentos, initialData, isInitialized]);

  // Handle score updates
  const handleUpdateScore = (atletaId: string, isAcerto: boolean) => {
    // Armazenar valores anteriores para caso de erro
    const prevAthleteData = evaluationData[atletaId] || {};
    const prevFundamentoData = prevAthleteData[activeFundamento] || { acertos: 0, erros: 0 };
    
    // Calcular novos valores
    const newAcertos = isAcerto 
      ? prevFundamentoData.acertos + 1 
      : prevFundamentoData.acertos;
    
    const newErros = isAcerto 
      ? prevFundamentoData.erros 
      : prevFundamentoData.erros + 1;
      
    // Criar objeto de atualização
    const updatedFundamentoData = {
      acertos: newAcertos,
      erros: newErros
    };
    
    // Primeiro atualizamos o estado local para feedback imediato ao usuário
    setEvaluationData(prev => {
      const athleteData = prev[atletaId] || {};
      
      return {
        ...prev,
        [atletaId]: {
          ...athleteData,
          [activeFundamento]: updatedFundamentoData
        }
      };
    });
    
    // Em seguida, fazemos a mutação para o banco de dados
    console.log(`Enviando avaliação para o servidor: ${atletaId}, ${activeFundamento}, acertos=${newAcertos}, erros=${newErros}`);
    
    saveEvaluationMutation.mutate({
      treinoDoDiaId,
      exercicioId: exercise.id,
      atletaId,
      fundamento: activeFundamento,
      acertos: newAcertos,
      erros: newErros
    }, {
      onSuccess: () => {
        // Confirmação visual de que a ação foi bem-sucedida
        toast({
          title: "Avaliação registrada",
          description: isAcerto ? "Acerto registrado com sucesso" : "Erro registrado com sucesso",
          duration: 1000
        });
      },
      onError: (error) => {
        // Se ocorrer erro, revertemos o estado local para o valor original
        toast({
          title: "Erro ao salvar avaliação",
          description: `Não foi possível registrar a avaliação. ${error.message || ''}`,
          variant: "destructive"
        });
        
        // Revertendo o estado para os valores anteriores
        setEvaluationData(prev => {
          const athleteData = prev[atletaId] || {};
          return {
            ...prev,
            [atletaId]: {
              ...athleteData,
              [activeFundamento]: prevFundamentoData
            }
          };
        });
      }
    });
  };

  const handleResetScore = (atletaId: string) => {
    // Armazenar valores anteriores para caso de erro
    const prevAthleteData = evaluationData[atletaId] || {};
    const prevFundamentoData = prevAthleteData[activeFundamento] || { acertos: 0, erros: 0 };
    
    // Primeiro atualizamos o estado local para feedback imediato
    setEvaluationData(prev => {
      const athleteData = prev[atletaId] || {};
      
      const updatedData = {
        ...prev,
        [atletaId]: {
          ...athleteData,
          [activeFundamento]: { acertos: 0, erros: 0 }
        }
      };
      
      return updatedData;
    });
    
    // Reset in database
    saveEvaluationMutation.mutate({
      treinoDoDiaId,
      exercicioId: exercise.id,
      atletaId,
      fundamento: activeFundamento,
      acertos: 0,
      erros: 0
    }, {
      onSuccess: () => {
        toast({
          title: "Contagem zerada",
          description: "Os valores foram redefinidos com sucesso",
          duration: 1000
        });
      },
      onError: (error) => {
        toast({
          title: "Erro ao redefinir contagem",
          description: `Não foi possível zerar os valores. ${error.message || ''}`,
          variant: "destructive"
        });
        
        // Se ocorrer erro, revertemos ao estado anterior
        setEvaluationData(prev => {
          const athleteData = prev[atletaId] || {};
          return {
            ...prev,
            [atletaId]: {
              ...athleteData,
              [activeFundamento]: prevFundamentoData
            }
          };
        });
      }
    });
  };

  const handleComplete = () => {
    // Deliver the final evaluation data to parent component
    onComplete(evaluationData);
  };

  // Calculate totals for the active fundamento
  const getTotalsForActiveFundamento = () => {
    let acertoTotal = 0;
    let erroTotal = 0;
    
    Object.values(evaluationData).forEach(athlete => {
      const fundData = athlete[activeFundamento];
      if (fundData) {
        acertoTotal += fundData.acertos;
        erroTotal += fundData.erros;
      }
    });
    
    return { acertos: acertoTotal, erros: erroTotal };
  };

  // Filter and sort athletes
  const filteredAthletes = athletesWithAttendance
    .filter(a => a.presente && a.atleta.nome.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => a.atleta.nome.localeCompare(b.atleta.nome));
    
  if (isLoadingAthletes) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <LoadingSpinner />
        <p className="mt-4 text-muted-foreground">Carregando atletas...</p>
      </div>
    );
  }

  const totals = getTotalsForActiveFundamento();
  const totalExecucoes = totals.acertos + totals.erros;
  const percentAcerto = totalExecucoes > 0 ? Math.round((totals.acertos / totalExecucoes) * 100) : 0;

  return (
    <div className="flex flex-col h-full">
      <div>
        <h2 className="text-lg font-semibold">
          {exercise.exercicio?.nome || "Exercício"}
        </h2>
        <p className="text-sm text-muted-foreground mb-3">
          Avaliação em tempo real
        </p>
      </div>
      
      {/* Fundamentos tabs */}
      <div className="overflow-x-auto pb-2">
        <div className="flex space-x-2 w-max">
          {fundamentos.map((fundamento) => (
            <Button
              key={fundamento}
              variant={activeFundamento === fundamento ? "default" : "outline"}
              size="sm"
              className={cn(
                "rounded-full px-3 py-1", 
                activeFundamento === fundamento 
                  ? "bg-primary" 
                  : "bg-background"
              )}
              onClick={() => setActiveFundamento(fundamento)}
            >
              {fundamento}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="bg-muted/30 rounded-md p-3 my-3 flex items-center justify-between">
        <div className="text-sm">
          <p className="font-medium">{activeFundamento}</p>
          <p className="text-xs text-muted-foreground">
            {totalExecucoes} execuções totais
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-4 w-4 mr-1" />
              <span className="font-medium">{totals.acertos}</span>
            </div>
            <span className="text-xs text-muted-foreground">Acertos</span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="flex items-center text-red-600">
              <XCircle className="h-4 w-4 mr-1" />
              <span className="font-medium">{totals.erros}</span>
            </div>
            <span className="text-xs text-muted-foreground">Erros</span>
          </div>
          
          <div className="flex flex-col items-center">
            <span className="font-medium">{percentAcerto}%</span>
            <span className="text-xs text-muted-foreground">Eficiência</span>
          </div>
        </div>
      </div>
      
      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar atleta..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Athletes list */}
      <div className="space-y-3 flex-1 overflow-y-auto pb-4">
        {filteredAthletes.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            Nenhum atleta encontrado
          </div>
        ) : (
          filteredAthletes.map(({ atleta }) => {
            const stats = evaluationData[atleta.id]?.[activeFundamento] || { acertos: 0, erros: 0 };
            const total = stats.acertos + stats.erros;
            const percentAcertos = total > 0 ? Math.round((stats.acertos / total) * 100) : 0;
            
            return (
              <div 
                key={atleta.id} 
                className="border rounded-lg p-3 flex items-center justify-between bg-background"
              >
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src={atleta.imagem_url} alt={atleta.nome} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {atleta.nome.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <p className="font-medium">{atleta.nome}</p>
                    <div className="text-xs text-muted-foreground flex">
                      <span>{atleta.posicao}</span>
                      {total > 0 && (
                        <span className="ml-2 font-medium">
                          {percentAcertos}% eficiência ({stats.acertos}/{total})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {total > 0 && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
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
                  
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-10 w-10 rounded-full bg-green-500/10 hover:bg-green-500/20 text-green-500"
                    onClick={() => handleUpdateScore(atleta.id, true)}
                  >
                    <CheckCircle className="h-5 w-5" />
                  </Button>
                  
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-10 w-10 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500"
                    onClick={() => handleUpdateScore(atleta.id, false)}
                  >
                    <XCircle className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Button 
        className="mt-4"
        onClick={onBack}
      >
        Voltar ao cronômetro
      </Button>
    </div>
  );
};

export default RealTimeEvaluation;
