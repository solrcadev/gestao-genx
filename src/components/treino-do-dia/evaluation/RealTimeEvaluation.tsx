import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, MinusCircle, RotateCcw, ArrowLeft, Save } from 'lucide-react';
import { registrarAvaliacaoDesempenho } from '@/services/athletes/evaluations';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface RealTimeEvaluationProps {
  exercise: any;
  treinoDoDiaId: string;
  onBack: () => void;
  onComplete: (data: any) => void;
  isMonitor?: boolean;
}

export default function RealTimeEvaluation({ 
  exercise, 
  treinoDoDiaId, 
  onBack, 
  onComplete,
  isMonitor = false
}: RealTimeEvaluationProps) {
  const [acertos, setAcertos] = useState(0);
  const [erros, setErros] = useState(0);
  const [selectedFundamento, setSelectedFundamento] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fundamentos] = useState([
    'Saque',
    'Recepção',
    'Levantamento',
    'Ataque',
    'Bloqueio',
    'Defesa'
  ]);
  const { user, userRole } = useAuth();

  // Reset counters
  const handleReset = () => {
    setAcertos(0);
    setErros(0);
  };

  // Handle completion of evaluation
  const handleComplete = async () => {
    if (!selectedFundamento) {
      toast({
        title: "Selecione um fundamento",
        description: "Você precisa selecionar um fundamento para registrar a avaliação.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const evaluationData = {
        atleta_id: exercise.atleta_id || '',
        treino_id: treinoDoDiaId,
        fundamento: selectedFundamento,
        acertos,
        erros,
        timestamp: new Date().toISOString(),
        precisaAprovacao: isMonitor, // Se for monitor, precisa de aprovação
        monitor_id: isMonitor ? user?.id : undefined // Se for monitor, registra quem fez a avaliação
      };

      // Registrar avaliação
      await registrarAvaliacaoDesempenho(evaluationData);

      toast({
        title: isMonitor ? "Avaliação enviada para aprovação" : "Avaliação registrada",
        description: isMonitor 
          ? "Um técnico precisa aprovar esta avaliação para que ela seja contabilizada." 
          : "Avaliação registrada com sucesso!",
      });

      onComplete(evaluationData);
    } catch (error) {
      console.error("Error completing evaluation:", error);
      toast({
        title: "Erro ao registrar avaliação",
        description: "Ocorreu um erro ao salvar a avaliação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with back button */}
      <div className="flex items-center mb-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-semibold ml-2">
          {exercise?.nome || "Avaliação em Tempo Real"}
        </h2>
      </div>

      {/* Fundamento selection */}
      <div className="mb-6">
        <label className="text-sm font-medium block mb-2">Selecione o fundamento:</label>
        <div className="grid grid-cols-2 gap-2">
          {fundamentos.map((fundamento) => (
            <Button
              key={fundamento}
              variant={selectedFundamento === fundamento ? "default" : "outline"}
              onClick={() => setSelectedFundamento(fundamento)}
              className="justify-start"
            >
              {fundamento}
            </Button>
          ))}
        </div>
      </div>

      {/* Counter display */}
      <div className="flex flex-row justify-between items-center bg-card p-4 rounded-lg shadow-sm mb-6">
        <div className="text-center flex-1">
          <span className="block text-sm font-medium text-muted-foreground mb-1">Acertos</span>
          <span className="text-4xl font-bold text-green-500">{acertos}</span>
        </div>
        <div className="h-12 w-px bg-border mx-2"></div>
        <div className="text-center flex-1">
          <span className="block text-sm font-medium text-muted-foreground mb-1">Erros</span>
          <span className="text-4xl font-bold text-red-500">{erros}</span>
        </div>
        <div className="h-12 w-px bg-border mx-2"></div>
        <div className="text-center flex-1">
          <span className="block text-sm font-medium text-muted-foreground mb-1">Total</span>
          <span className="text-4xl font-bold">{acertos + erros}</span>
        </div>
      </div>

      {/* Counter buttons */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Button 
          variant="outline" 
          size="lg" 
          className="h-20 text-green-500 border-green-200 bg-green-50 hover:bg-green-100"
          onClick={() => setAcertos(prev => prev + 1)}
        >
          <PlusCircle className="mr-2 h-6 w-6" />
          <span className="text-lg">Acerto</span>
        </Button>
        <Button 
          variant="outline" 
          size="lg" 
          className="h-20 text-red-500 border-red-200 bg-red-50 hover:bg-red-100"
          onClick={() => setErros(prev => prev + 1)}
        >
          <MinusCircle className="mr-2 h-6 w-6" />
          <span className="text-lg">Erro</span>
        </Button>
      </div>

      {/* Reset and complete buttons */}
      <div className="flex flex-col gap-3 mt-auto">
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Reiniciar contadores
        </Button>
        <Button onClick={handleComplete} disabled={isSubmitting}>
          <Save className="mr-2 h-4 w-4" />
          {isSubmitting ? "Salvando..." : "Concluir Avaliação"}
        </Button>
        
        {isMonitor && (
          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-700">
              <strong>Nota:</strong> Como monitor, suas avaliações serão enviadas para aprovação por um técnico antes de serem contabilizadas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
