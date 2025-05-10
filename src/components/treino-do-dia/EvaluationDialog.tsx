import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EvaluationFlow } from "./evaluation/EvaluationFlow";

interface EvaluationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treinoDoDiaId: string;
}

export function EvaluationDialog({ open, onOpenChange, treinoDoDiaId }: EvaluationDialogProps) {
  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Avaliação de Atletas</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <EvaluationFlow 
            treinoDoDiaId={treinoDoDiaId} 
            onClose={handleClose} 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
