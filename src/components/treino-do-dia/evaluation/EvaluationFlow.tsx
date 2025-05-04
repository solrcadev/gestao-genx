
import React, { useState } from 'react';
import ExerciseSelection from './ExerciseSelection';
import RealTimeEvaluation from './RealTimeEvaluation';
import EvaluationSummary from './EvaluationSummary';
import { useAuth } from '@/hooks/useAuth';

interface EvaluationFlowProps {
  treinoDoDiaId: string;
  onClose?: () => void;
}

export function EvaluationFlow({ treinoDoDiaId, onClose }: EvaluationFlowProps) {
  const [step, setStep] = useState(1);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [evaluationData, setEvaluationData] = useState<any>({});
  const { profile } = useAuth();
  
  // Verificar se o usuário é técnico
  const isTecnico = profile?.funcao === 'tecnico';
  
  // Handle exercise selection
  const handleExerciseSelect = (exercise: any) => {
    setSelectedExercise(exercise);
    setStep(2);
  };
  
  // Handle back from evaluation
  const handleBackFromEvaluation = () => {
    setStep(1);
  };
  
  // Handle evaluation completion
  const handleEvaluationComplete = (data: any) => {
    setEvaluationData(data);
    setStep(3);
  };
  
  // Handle evaluation edit
  const handleEvaluationEdit = () => {
    setStep(2);
  };
  
  // Handle save and close
  const handleSaveAndClose = () => {
    if (onClose) {
      onClose();
    }
  };
  
  // Render based on current step
  const renderStep = () => {
    switch (step) {
      case 1: // Exercise selection
        return (
          <ExerciseSelection
            onExerciseSelect={handleExerciseSelect}
          />
        );
      case 2: // Real-time evaluation
        return (
          <RealTimeEvaluation 
            exercise={selectedExercise}
            treinoDoDiaId={treinoDoDiaId}
            onBack={handleBackFromEvaluation}
            onComplete={handleEvaluationComplete}
            isMonitor={!isTecnico}
          />
        );
      case 3: // Evaluation summary
        return (
          <EvaluationSummary
            exercise={selectedExercise}
            evaluationData={evaluationData}
            onEdit={handleEvaluationEdit}
            onSave={handleSaveAndClose}
            isMonitor={!isTecnico}
            needsApproval={!isTecnico}
          />
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="h-full flex flex-col overflow-auto">
      {renderStep()}
    </div>
  );
}
