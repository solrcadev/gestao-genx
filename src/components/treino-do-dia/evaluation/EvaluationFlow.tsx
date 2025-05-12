import React, { useState, useEffect } from 'react';
import ExerciseSelection from './ExerciseSelection';
import RealTimeEvaluation from './RealTimeEvaluation';
import EvaluationSummary from './EvaluationSummary';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { obterDetalhesDoTreinoAtual } from '@/services/avaliacaoQualitativaService';
import { toast } from '@/components/ui/use-toast';

interface EvaluationFlowProps {
  treinoDoDiaId: string;
  onClose?: () => void;
}

enum EvaluationStage {
  SELECT_EXERCISE,
  EVALUATE,
  SUMMARY
}

export function EvaluationFlow({ treinoDoDiaId, onClose }: EvaluationFlowProps) {
  const [stage, setStage] = useState<EvaluationStage>(EvaluationStage.SELECT_EXERCISE);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [evaluationData, setEvaluationData] = useState<any>({});
  const [isValidatingTreino, setIsValidatingTreino] = useState<boolean>(true);
  const [treinoDetails, setTreinoDetails] = useState<{
    treino_id: string;
    nome_treino: string;
    existe: boolean;
  } | null>(null);
  const { userRole } = useAuth();
  
  // Verificar se o usuário é técnico
  const isTecnico = userRole === 'tecnico';

  // Validar o treino_id logo ao iniciar o componente
  useEffect(() => {
    const validarTreino = async () => {
      if (!treinoDoDiaId) {
        toast({
          title: "Erro",
          description: "ID do treino não fornecido",
          variant: "destructive"
        });
        setIsValidatingTreino(false);
        return;
      }

      try {
        setIsValidatingTreino(true);
        console.log("[EvaluationFlow] Validando treinoDoDiaId:", treinoDoDiaId);
        
        const detalhes = await obterDetalhesDoTreinoAtual(treinoDoDiaId);
        setTreinoDetails(detalhes);
        
        if (!detalhes.existe) {
          console.error("[EvaluationFlow] Treino não encontrado:", treinoDoDiaId);
          toast({
            title: "Aviso",
            description: "O treino não foi encontrado no banco de dados. Alguns recursos podem não funcionar corretamente.",
            variant: "destructive",
            duration: 6000
          });
        } else {
          console.log("[EvaluationFlow] Treino validado com sucesso:", detalhes);
        }
      } catch (error) {
        console.error("[EvaluationFlow] Erro ao validar treino:", error);
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao validar o treino",
          variant: "destructive"
        });
      } finally {
        setIsValidatingTreino(false);
      }
    };
    
    validarTreino();
  }, [treinoDoDiaId]);
  
  // Handle exercise selection
  const handleExerciseSelect = (exercise: any) => {
    if (!exercise || !exercise.id) {
      toast({
        title: "Erro",
        description: "Exercício inválido selecionado",
        variant: "destructive"
      });
      return;
    }
    
    console.log("[EvaluationFlow] Exercício selecionado:", {
      id: exercise.id,
      nome: exercise.exercicio?.nome || "Sem nome",
      treino_id: exercise.treino_id
    });
    
    setSelectedExercise(exercise);
    setStage(EvaluationStage.EVALUATE);
  };
  
  // Handle evaluation complete
  const handleEvaluationComplete = (data: any) => {
    setEvaluationData(data);
    setStage(EvaluationStage.SUMMARY);
  };
  
  // Handle back button
  const handleBack = () => {
    if (stage === EvaluationStage.EVALUATE) {
      setStage(EvaluationStage.SELECT_EXERCISE);
    } else if (stage === EvaluationStage.SUMMARY) {
      setStage(EvaluationStage.EVALUATE);
    }
  };
  
  // Handle summary complete
  const handleSummaryComplete = () => {
    if (onClose) {
      onClose();
    }
  };

  // Handle global back button for exercise selection
  const handleMainBack = () => {
    if (onClose) {
      onClose();
    }
  };

  // Mostrar loading enquanto valida o treino
  if (isValidatingTreino) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Validando treino...</p>
      </div>
    );
  }

  // Mostrar erro se o treino não for válido
  if (treinoDetails && !treinoDetails.existe && stage === EvaluationStage.SELECT_EXERCISE) {
    return (
      <div className="p-6 bg-red-50 border border-red-100 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800">Treino não encontrado</h3>
            <p className="text-sm text-red-600 mt-1">
              O treino com ID "{treinoDoDiaId}" não foi encontrado no banco de dados.
            </p>
            <Button onClick={handleMainBack} variant="outline" className="mt-3">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {stage === EvaluationStage.SELECT_EXERCISE && (
        <>
          {onClose && (
            <div className="flex items-center mb-4">
              <Button variant="ghost" size="icon" onClick={handleMainBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h2 className="text-xl font-semibold ml-2">Avaliação</h2>
            </div>
          )}
          <ExerciseSelection 
            treinoId={treinoDoDiaId}
            onExerciseSelect={handleExerciseSelect}
            onClose={onClose}
          />
        </>
      )}
      
      {stage === EvaluationStage.EVALUATE && selectedExercise && (
        <RealTimeEvaluation
          exercise={selectedExercise}
          treinoDoDiaId={treinoDetails?.existe ? treinoDetails.treino_id : treinoDoDiaId}
          onBack={handleBack}
          onComplete={handleEvaluationComplete}
          isMonitor={!isTecnico}
        />
      )}
      
      {stage === EvaluationStage.SUMMARY && (
        <EvaluationSummary
          exercise={selectedExercise}
          evaluationData={evaluationData}
          onEdit={() => setStage(EvaluationStage.EVALUATE)}
          onSave={handleSummaryComplete}
          isMonitor={!isTecnico}
          needsApproval={!isTecnico}
        />
      )}
    </div>
  );
}
