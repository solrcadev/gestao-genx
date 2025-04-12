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

interface PhotoUploadAlertProps {
  open: boolean;
  onClose: () => void;
  onContinue: () => void;
  onCancel: () => void;
  error: string;
}

export function PhotoUploadAlert({
  open,
  onClose,
  onContinue,
  onCancel,
  error
}: PhotoUploadAlertProps) {
  const [showGuide, setShowGuide] = useState(false);
  const isBucketNotFoundError = error?.includes("Bucket not found") || error?.toLowerCase().includes("bucket");

  return (
    <>
      <AlertDialog open={open} onOpenChange={onClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Erro no upload da foto</AlertDialogTitle>
            <AlertDialogDescription>
              {error || "Não foi possível fazer upload da foto."}
              
              {isBucketNotFoundError && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-sm font-medium mb-2">
                    Parece que o bucket 'avatars' não existe no seu projeto Supabase.
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
              Continuar sem foto
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