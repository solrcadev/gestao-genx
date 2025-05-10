import React, { useState } from 'react';
import ExerciseSelection from './ExerciseSelection';
import RealTimeEvaluation from './RealTimeEvaluation';
import EvaluationSummary from './EvaluationSummary';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

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
  const { userRole } = useAuth();
  
  // Verificar se o usuário é técnico
  const isTecnico = userRole === 'tecnico';
  
  // Handle exercise selection
  const handleExerciseSelect = (exercise: any) => {
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
          treinoDoDiaId={treinoDoDiaId}
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
