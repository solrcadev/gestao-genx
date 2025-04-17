
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { exportTrainingToPdf } from '@/services/pdfExportService';
import { getTrainingById } from '@/services/trainingService';
import { fetchExerciciosByTrainingId } from '@/services/exercicioService';

interface ExportTrainingButtonProps {
  trainingId: string;
  isTreinoDoDia?: boolean;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export const ExportTrainingButton: React.FC<ExportTrainingButtonProps> = ({
  trainingId,
  isTreinoDoDia = false,
  variant = "outline",
  size = "default",
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile } = useProfile();
  
  // Only coaches and trainers can generate reports
  const canGenerateReport = profile?.role === 'coach' || profile?.role === 'trainer';
  
  if (!canGenerateReport) return null;
  
  const handleExportPdf = async () => {
    if (!trainingId) {
      toast({
        title: "Erro",
        description: "ID do treino não fornecido",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Gerando relatório",
        description: "Por favor, aguarde...",
      });

      // Buscar dados detalhados do treino
      const training = await getTrainingById(trainingId);
      
      if (!training) {
        toast({
          title: "Erro",
          description: "Treino não encontrado",
          variant: "destructive",
        });
        return;
      }

      // Buscar exercícios do treino
      const exercises = await fetchExerciciosByTrainingId(trainingId);

      // Exportar para PDF
      await exportTrainingToPdf({
        training,
        exercises,
        userName: user?.email || "usuário"
      });
      
      toast({
        title: "Sucesso",
        description: "Relatório gerado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o relatório",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExportPdf}
      className="flex items-center gap-1"
    >
      <FileText className="h-4 w-4" />
      <span>Exportar Relatório</span>
    </Button>
  );
};
