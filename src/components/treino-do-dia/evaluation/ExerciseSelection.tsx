
import React from "react";
import { Button } from "@/components/ui/button";
import { 
  ClipboardCheck, 
  ClipboardList, 
  TimerIcon, 
  Clock, 
  PlayCircle,
  X
} from "lucide-react";

interface ExerciseSelectionProps {
  exercises: any[];
  onSelect: (exercise: any) => void;
  onClose: () => void;
}

const ExerciseSelection = ({ exercises, onSelect, onClose }: ExerciseSelectionProps) => {
  // Filter completed exercises (they have the concluido flag)
  const completedExercises = exercises.filter(ex => ex.concluido);

  if (completedExercises.length === 0) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-600">
          <ClipboardList className="h-8 w-8" />
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-1">Nenhum exercício concluído</h3>
          <p className="text-muted-foreground text-sm">
            Complete ao menos um exercício para iniciar a avaliação.
          </p>
        </div>
        
        <Button onClick={onClose} variant="outline" className="mt-4">
          <X className="h-4 w-4 mr-2" />
          Fechar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-1">Selecione o exercício</h2>
        <p className="text-sm text-muted-foreground">
          Escolha um exercício concluído para avaliar os atletas
        </p>
      </div>
      
      <div className="space-y-3 overflow-y-auto max-h-[60vh]">
        {completedExercises.map((exercise, index) => (
          <div
            key={exercise.id}
            className="border rounded-md p-4 hover:border-primary transition"
            onClick={() => onSelect(exercise)}
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
                  {exercise.tempo || "?"} min
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
