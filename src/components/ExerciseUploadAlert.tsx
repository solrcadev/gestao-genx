import React, { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { BucketCreationGuide } from "./BucketCreationGuide";

interface ExerciseUploadAlertProps {
  open: boolean;
  onClose: () => void;
  onContinue: () => void;
  onCancel: () => void;
  error: string;
}

export function ExerciseUploadAlert({
  open,
  onClose,
  onContinue,
  onCancel,
  error
}: ExerciseUploadAlertProps) {
  const [showGuide, setShowGuide] = useState(false);
  const isBucketNotFoundError = error?.includes("Bucket not found") || error?.toLowerCase().includes("bucket");

  return (
    <>
      <AlertDialog open={open} onOpenChange={onClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Erro no upload da imagem</AlertDialogTitle>
            <AlertDialogDescription>
              {error || "Não foi possível fazer upload da imagem."}
              
              {isBucketNotFoundError && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-sm font-medium mb-2">
                    Parece que o bucket 'exercises-images' não existe no seu projeto Supabase.
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Este bucket é necessário para armazenar as imagens dos exercícios.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-1"
                    onClick={() => setShowGuide(true)}
                  >
                    Ver como criar o bucket
                  </Button>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onCancel}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onContinue}>
              Continuar sem imagem
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <BucketCreationGuide 
        open={showGuide} 
        onClose={() => setShowGuide(false)} 
      />
    </>
  );
} 