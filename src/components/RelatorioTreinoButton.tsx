import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';
import { exportTrainingToPdf } from '@/services/pdfExportService';
import { getTrainingById } from '@/services/trainingService';
import { fetchExerciciosByTrainingId } from '@/services/exercicioService';

interface RelatorioTreinoButtonProps {
  trainingId: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

const RelatorioTreinoButton: React.FC<RelatorioTreinoButtonProps> = ({
  trainingId,
  variant = "outline",
  size = "default",
  className = "",
}) => {
  const { toast } = useToast();
  const user = useSupabaseUser();

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
      className={`flex items-center gap-1 ${className}`}
    >
      <FileText className="h-4 w-4" />
      <span>Exportar Relatório</span>
    </Button>
  );
};

export default RelatorioTreinoButton; 