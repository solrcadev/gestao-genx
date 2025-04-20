import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { toast } from '@/components/ui/use-toast';
import { Check, X, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';

// Utility function to ensure proper string conversion
export const ensureString = (value: string | number): string => {
  if (typeof value === 'number') {
    return value.toString();
  }
  return value;
};

interface ExerciseEvaluationProps {
  exerciseId: string;
  exerciseName: string;
  fundamento: string;
  atletaId: string;
  atletaNome: string;
  treinoId: string;
  onComplete: () => void;
  onCancel: () => void;
}

export function ExerciseEvaluation({
  exerciseId,
  exerciseName,
  fundamento,
  atletaId,
  atletaNome,
  treinoId,
  onComplete,
  onCancel
}: ExerciseEvaluationProps) {
  const [acertos, setAcertos] = useState<number>(0);
  const [erros, setErros] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [percentualAcerto, setPercentualAcerto] = useState<number>(0);

  useEffect(() => {
    const total = acertos + erros;
    if (total > 0) {
      setPercentualAcerto((acertos / total) * 100);
    } else {
      setPercentualAcerto(0);
    }
  }, [acertos, erros]);

  const handleSubmit = async () => {
    if (acertos === 0 && erros === 0) {
      toast({
        title: "Avaliação incompleta",
        description: "Por favor, registre pelo menos uma execução.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const avaliacao = {
        id: uuidv4(),
        atleta_id: atletaId,
        exercicio_id: exerciseId,
        treino_id: treinoId,
        fundamento: fundamento,
        acertos: acertos,
        erros: erros,
        timestamp: new Date().toISOString()
      };

      // Salvar no Supabase
      const { error } = await supabase
        .from('avaliacoes_fundamento')
        .insert([avaliacao]);

      if (error) {
        console.error("Erro ao salvar avaliação:", error);
        
        // Salvar localmente se falhar no Supabase
        const localAvaliacoes = JSON.parse(localStorage.getItem('avaliacoes_fundamento') || '[]');
        localAvaliacoes.push(avaliacao);
        localStorage.setItem('avaliacoes_fundamento', JSON.stringify(localAvaliacoes));
        
        toast({
          title: "Avaliação salva localmente",
          description: "A avaliação foi salva no dispositivo e será sincronizada quando houver conexão.",
        });
      } else {
        toast({
          title: "Avaliação registrada",
          description: `Avaliação de ${fundamento} para ${atletaNome} registrada com sucesso.`,
        });
      }

      onComplete();
    } catch (error) {
      console.error("Erro ao processar avaliação:", error);
      toast({
        title: "Erro ao registrar avaliação",
        description: "Ocorreu um erro ao salvar a avaliação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const incrementAcertos = () => setAcertos(prev => prev + 1);
  const decrementAcertos = () => setAcertos(prev => prev > 0 ? prev - 1 : 0);
  const incrementErros = () => setErros(prev => prev + 1);
  const decrementErros = () => setErros(prev => prev > 0 ? prev - 1 : 0);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-lg font-medium">
          Avaliar {fundamento}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Exercício</p>
          <p className="font-medium">{exerciseName}</p>
        </div>
        
        <div>
          <p className="text-sm text-muted-foreground mb-1">Atleta</p>
          <p className="font-medium">{atletaNome}</p>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="acertos" className="text-base">Acertos</Label>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8" 
                onClick={decrementAcertos}
              >
                <span>-</span>
              </Button>
              <Input 
                id="acertos"
                type="number" 
                value={ensureString(acertos)}
                onChange={(e) => setAcertos(parseInt(e.target.value) || 0)}
                className="w-16 text-center" 
              />
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8" 
                onClick={incrementAcertos}
              >
                <span>+</span>
              </Button>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <Label htmlFor="erros" className="text-base">Erros</Label>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8" 
                onClick={decrementErros}
              >
                <span>-</span>
              </Button>
              <Input 
                id="erros"
                type="number" 
                value={ensureString(erros)}
                onChange={(e) => setErros(parseInt(e.target.value) || 0)}
                className="w-16 text-center" 
              />
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8" 
                onClick={incrementErros}
              >
                <span>+</span>
              </Button>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Percentual de acerto</Label>
            <span className="font-medium">{percentualAcerto.toFixed(1)}%</span>
          </div>
          <Slider
            value={[percentualAcerto]}
            max={100}
            step={1}
            disabled
            className={`${
              percentualAcerto >= 70 ? 'bg-green-100' : 
              percentualAcerto >= 40 ? 'bg-yellow-100' : 
              'bg-red-100'
            }`}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          <X className="mr-2 h-4 w-4" /> Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Check className="mr-2 h-4 w-4" />
          )}
          Salvar
        </Button>
      </CardFooter>
    </Card>
  );
}
