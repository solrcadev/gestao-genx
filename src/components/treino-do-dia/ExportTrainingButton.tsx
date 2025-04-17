import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { exportTrainingToPdf } from '@/services/pdfExportService';
import { getTrainingById } from '@/services/trainingService';
import { getTreinoDoDia, getExerciciosTreinoDoDia } from '@/services/treinosDoDiaService';
import { useAuth } from '@/contexts/AuthContext';

interface ExportTrainingButtonProps {
  trainingId: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  isTreinoDoDia?: boolean;
}

export const ExportTrainingButton: React.FC<ExportTrainingButtonProps> = ({
  trainingId,
  variant = "outline",
  size = "sm",
  className = "",
  isTreinoDoDia = false
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const userName = user?.email || "Usuário";
  
  const handleExportPdf = async () => {
    try {
      let trainingData;
      let exercisesData = [];
      
      if (isTreinoDoDia) {
        // Get training from treino do dia
        const treinoDoDia = await getTreinoDoDia(new Date());
        if (!treinoDoDia) {
          throw new Error("Treino do dia não encontrado");
        }
        trainingData = treinoDoDia.treino;
        
        // Buscar os exercícios usando a nova função
        exercisesData = await getExerciciosTreinoDoDia(treinoDoDia.id);
        console.log("Exercícios do treino do dia para exportação:", exercisesData);
        
        // Verificar se os exercícios têm os dados de tempo
        if (exercisesData && exercisesData.length > 0) {
          exercisesData = exercisesData.map(ex => {
            // Verificar os campos disponíveis no objeto
            console.log(`Processando exercício ${ex.exercicio?.nome || 'sem nome'}`, ex);
            
            // Garantir que tempo_estimado esteja presente
            if (!ex.tempo_estimado) {
              // Tentar encontrar qualquer campo que possa conter a duração
              if (ex.exercicio?.tempo_estimado) {
                ex.tempo_estimado = ex.exercicio.tempo_estimado;
              } else if (ex.tempo_planejado) {
                ex.tempo_estimado = ex.tempo_planejado;
              } else if (ex.duracao) {
                ex.tempo_estimado = ex.duracao;
              } else if (ex.exercicio?.duracao) {
                ex.tempo_estimado = ex.exercicio.duracao;
              }
            }
            return ex;
          });
        }
      } else {
        // Get training directly
        const training = await getTrainingById(trainingId);
        if (!training) {
          throw new Error("Treino não encontrado");
        }
        trainingData = training;
        exercisesData = training.treinos_exercicios || [];
        
        // Verificar se os exercícios têm os dados de tempo
        if (exercisesData && exercisesData.length > 0) {
          exercisesData = exercisesData.map(ex => {
            // Verificar os campos disponíveis no objeto
            console.log(`Processando exercício ${ex.exercicio?.nome || 'sem nome'}`, ex);
            
            // Garantir que tempo_estimado esteja presente
            if (!ex.tempo_estimado) {
              // Tentar encontrar qualquer campo que possa conter a duração
              if (ex.exercicio?.tempo_estimado) {
                ex.tempo_estimado = ex.exercicio.tempo_estimado;
              } else if (ex.tempo_planejado) {
                ex.tempo_estimado = ex.tempo_planejado;
              } else if (ex.duracao) {
                ex.tempo_estimado = ex.duracao;
              } else if (ex.exercicio?.duracao) {
                ex.tempo_estimado = ex.exercicio.duracao;
              }
            }
            return ex;
          });
        }
      }
      
      // Export to PDF
      exportTrainingToPdf({
        training: trainingData,
        exercises: exercisesData,
        userName
      });
      
      toast({
        title: "PDF gerado com sucesso!",
        description: "O arquivo foi baixado para o seu dispositivo.",
      });
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Não foi possível criar o arquivo PDF. Por favor, tente novamente.",
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
      <span>Exportar PDF</span>
    </Button>
  );
};
