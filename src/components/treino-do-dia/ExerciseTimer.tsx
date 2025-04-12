
import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, SkipForward, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";

export interface ExerciseTimerProps {
  estimatedTime: number;
  onFinish: (elapsedMinutes: number) => void;
  treinoDoDiaId?: string; 
  exerciseData?: any;
  onCancel?: () => void;
}

export function ExerciseTimer({ 
  estimatedTime, 
  onFinish,
  treinoDoDiaId,
  exerciseData,
  onCancel
}: ExerciseTimerProps) {
  const [isRunning, setIsRunning] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [minElapsed, setMinElapsed] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize timer
  useEffect(() => {
    startTimeRef.current = Date.now();
    tick();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  // Calculate timer when isRunning changes
  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now() - elapsedTime;
      tick();
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, [isRunning]);

  // Update minutes elapsed
  useEffect(() => {
    const minutes = Math.floor(elapsedTime / 60000);
    if (minutes !== minElapsed) {
      setMinElapsed(minutes);
    }
  }, [elapsedTime]);

  const tick = () => {
    if (startTimeRef.current === null) return;
    
    const now = Date.now();
    const elapsed = now - startTimeRef.current;
    
    setElapsedTime(elapsed);
    
    animationFrameRef.current = requestAnimationFrame(tick);
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const finishExercise = async () => {
    const finalMinutes = Math.max(1, Math.ceil(elapsedTime / 60000));
    
    if (treinoDoDiaId && exerciseData?.id) {
      try {
        // Update exercise as completed with actual time
        const { error } = await supabase
          .from('treinos_exercicios')
          .update({ 
            concluido: true,
            tempo_real: finalMinutes
          })
          .eq('id', exerciseData.id);
          
        if (error) {
          throw new Error('Erro ao atualizar exercício: ' + error.message);
        }
      } catch (error) {
        console.error('Error updating exercise:', error);
        toast({
          title: 'Erro ao finalizar exercício',
          description: 'Não foi possível marcar o exercício como concluído.',
          variant: 'destructive',
        });
      }
    }
    
    onFinish(finalMinutes);
  };

  // Format time as MM:SS
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Calculate percentage of estimated time
  const getTimePercentage = () => {
    const percentage = (elapsedTime / (estimatedTime * 60 * 1000)) * 100;
    return Math.min(percentage, 100);
  };

  // Get status classname
  const getStatusClass = () => {
    const percentage = getTimePercentage();
    if (percentage < 80) return "text-green-600";
    if (percentage < 100) return "text-amber-500";
    return "text-red-500";
  };

  return (
    <div className="bg-muted/20 rounded-lg p-4 animate-fade-in">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium">Cronômetro</h3>
        <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Meta: {estimatedTime} min
        </Badge>
      </div>

      <div className="flex flex-col items-center justify-center py-2 mb-4">
        <div className={cn("text-3xl font-bold mb-2", getStatusClass())}>
          {formatTime(elapsedTime)}
        </div>
        <Progress value={getTimePercentage()} className="w-full h-1.5" />
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={toggleTimer}
        >
          {isRunning ? (
            <>
              <Pause className="h-4 w-4 mr-2" />
              Pausar
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Continuar
            </>
          )}
        </Button>
        <Button
          className="flex-1"
          onClick={finishExercise}
        >
          <SkipForward className="h-4 w-4 mr-2" />
          Finalizar
        </Button>
        {onCancel && (
          <Button
            variant="ghost"
            onClick={onCancel}
            className="flex-1"
          >
            Cancelar
          </Button>
        )}
      </div>
    </div>
  );
}
