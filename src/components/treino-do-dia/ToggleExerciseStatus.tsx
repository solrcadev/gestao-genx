
import React, { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Check, X, AlertCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";

interface ToggleExerciseStatusProps {
  exerciseId: string;
  isCompleted: boolean;
  onStatusChange: (completed: boolean) => Promise<void>;
}

const ToggleExerciseStatus = ({
  exerciseId,
  isCompleted,
  onStatusChange,
}: ToggleExerciseStatusProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async (checked: boolean) => {
    if (!checked) {
      setIsOpen(true);
      return;
    }

    try {
      setIsLoading(true);
      await onStatusChange(true);
      toast({
        title: "Exercício marcado como concluído",
        description: "O status foi atualizado com sucesso.",
      });
    } catch (error) {
      console.error("Error updating exercise status:", error);
      toast({
        title: "Erro ao atualizar status",
        description: "Não foi possível atualizar o status do exercício.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmUncheck = async () => {
    try {
      setIsLoading(true);
      await onStatusChange(false);
      toast({
        title: "Exercício desmarcado",
        description: "O exercício foi desmarcado como concluído.",
      });
    } catch (error) {
      console.error("Error updating exercise status:", error);
      toast({
        title: "Erro ao atualizar status",
        description: "Não foi possível atualizar o status do exercício.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <>
      <div className="flex items-center space-x-2">
        <Switch
          id={`exercise-status-${exerciseId}`}
          checked={isCompleted}
          onCheckedChange={handleToggle}
          disabled={isLoading}
          className="data-[state=checked]:bg-green-500"
        />
        <span className="text-sm flex items-center">
          {isCompleted ? (
            <Check className="h-4 w-4 text-green-500 mr-1" />
          ) : (
            <X className="h-4 w-4 text-muted-foreground mr-1" />
          )}
          {isCompleted ? "Concluído" : "Pendente"}
        </span>
      </div>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
              Desmarcar exercício?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desmarcar este exercício como não concluído?
              As avaliações realizadas serão mantidas mas ficarão ocultas até o
              exercício ser marcado como concluído novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmUncheck}
              disabled={isLoading}
              className="bg-amber-500 hover:bg-amber-600"
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ToggleExerciseStatus;
