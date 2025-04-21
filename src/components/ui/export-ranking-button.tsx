import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Share2, Loader2, Award } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { format as formatDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import '@/styles/ranking-export-styles.css';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/components/ui/use-toast";

type ExportFormat = 'pdf' | 'png';

interface ExportRankingButtonProps {
  targetRef: React.RefObject<HTMLElement>;
  fileName: string;
  exportTitle?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  includeDate?: boolean;
  showIcon?: boolean;
  text?: string;
  backgroundColor?: string;
  scale?: number;
  onExportStart?: () => void;
  onExportComplete?: () => void;
  format?: ExportFormat;
  includeWatermark?: boolean;
  customLogo?: string;
  withTooltip?: boolean;
  tooltipText?: string;
}

const ExportRankingButton: React.FC<ExportRankingButtonProps> = ({
  targetRef,
  fileName,
  exportTitle,
  variant = 'outline',
  size = 'default',
  includeDate = true,
  showIcon = true,
  text,
  backgroundColor = '#1E3A8A',
  scale = 2,
  onExportStart,
  onExportComplete,
  format = 'pdf',
  includeWatermark = false,
  customLogo,
  withTooltip = true,
  tooltipText
}) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const finalFileName = includeDate 
    ? `${fileName}-${formatDate(new Date(), 'dd-MM-yyyy', { locale: ptBR })}`
    : fileName;
    
  const exportContent = async () => {
    if (!targetRef.current) return;
    
    try {
      setIsLoading(true);
      if (onExportStart) onExportStart();
      
      // Feedback visual de início da exportação
      toast({
        title: format === 'pdf' ? "Preparando PDF" : "Preparando imagem",
        description: "Processando o ranking para exportação...",
        duration: 3000,
      });
      
      // Aplicar temporariamente estilos de exportação
      targetRef.current.classList.add('ranking-export-bg');
      
      // Configurações mais seguras para html2canvas com alta resolução
      const canvas = await html2canvas(targetRef.current, { 
        scale: 4, // Aumentado para 4x para alta resolução
        backgroundColor: backgroundColor,
        logging: false,
        useCORS: true,
        allowTaint: true,
        removeContainer: true,
        imageTimeout: 0,
        foreignObjectRendering: false,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0
      });
      
      // Remover o estilo temporário
      targetRef.current.classList.remove('ranking-export-bg');
      
      const imgData = canvas.toDataURL('image/png', 1.0); // Qualidade máxima
      
      if (format === 'pdf') {
        // Exportar como PDF
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
          compress: false // Evitar compressão para manter a qualidade
        });
        
        // Calcular dimensões mantendo a proporção de maneira mais robusta
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        
        // Usar dimensões apropriadas com margens pequenas para maximizar o conteúdo
        const imgWidth = pageWidth - 10; // margens de 5mm em cada lado
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Centralizar a imagem na página
        const x = 5;
        const y = 5;
        
        // Adicionar título personalizado se fornecido
        if (exportTitle) {
          pdf.setFontSize(16);
          pdf.text(exportTitle, pageWidth / 2, 10, { align: 'center' });
        }
        
        // Adicionar imagem com alta qualidade
        pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight, undefined, 'FAST');
        
        // Adicionar marca d'água se solicitado
        if (includeWatermark) {
          pdf.setTextColor(200, 200, 200);
          pdf.setFontSize(10);
          pdf.text("Gerado por GenX Sports", pageWidth - 10, pageHeight - 10, { align: 'right' });
        }
        
        // Adicionar logo personalizado se fornecido
        if (customLogo) {
          try {
            pdf.addImage(customLogo, 'PNG', 10, pageHeight - 20, 20, 10);
          } catch (error) {
            console.error('Erro ao adicionar logo:', error);
          }
        }
        
        // Salvar o PDF
        pdf.save(`${finalFileName}.pdf`);
        
        // Feedback de sucesso
        toast({
          title: "PDF exportado com sucesso",
          description: `O arquivo ${finalFileName}.pdf foi salvo`,
          duration: 3000,
        });
      } else {
        // Exportar como PNG com alta qualidade
        try {
          // Criar um blob a partir da URL de dados
          const blob = await (await fetch(imgData)).blob();
          
          // Criar um objeto File para compartilhamento
          const file = new File([blob], `${finalFileName}.png`, { type: 'image/png' });
          
          // Verificar se o navegador suporta a API de compartilhamento
          if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: exportTitle || 'Ranking',
              files: [file]
            });
            
            // Feedback de sucesso
            toast({
              title: "Imagem compartilhada",
              description: "A imagem foi compartilhada com sucesso",
              duration: 3000,
            });
          } else {
            // Fallback para download se o compartilhamento não for suportado
            const link = document.createElement('a');
            link.href = imgData;
            link.download = `${finalFileName}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Feedback de sucesso para download
            toast({
              title: "Imagem exportada",
              description: `A imagem ${finalFileName}.png foi salva`,
              duration: 3000,
            });
          }
        } catch (error) {
          console.error('Erro ao compartilhar imagem:', error);
          
          // Feedback de erro
          toast({
            title: "Erro ao compartilhar",
            description: "Não foi possível compartilhar a imagem",
            variant: "destructive",
            duration: 5000,
          });
        }
      }
    } catch (error) {
      console.error(`Erro ao exportar ${format === 'pdf' ? 'PDF' : 'PNG'}:`, error);
      
      // Tentar abordagem alternativa em caso de erro
      console.log('Tentando abordagem alternativa de exportação...');
      
      try {
        // Abordagem alternativa mais simples
        const element = targetRef.current;
        
        // Criar um clone do elemento para preservar o original
        const clone = element.cloneNode(true) as HTMLElement;
        document.body.appendChild(clone);
        
        // Aplicar estilos diretamente ao clone para minimizar problemas de renderização
        clone.style.backgroundColor = backgroundColor;
        clone.style.padding = '20px';
        clone.style.position = 'absolute';
        clone.style.left = '-9999px';
        clone.style.width = '600px';
        
        // Usar renderização mais simples
        const canvas = await html2canvas(clone, {
          scale: 1,
          backgroundColor: backgroundColor,
          allowTaint: true,
          useCORS: true,
          logging: false,
          imageTimeout: 0
        });
        
        // Remover o clone depois de usado
        document.body.removeChild(clone);
        
        const imgData = canvas.toDataURL('image/png');
        
        if (format === 'pdf') {
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(`${finalFileName}.pdf`);
          
          toast({
            title: "PDF exportado com sucesso",
            description: `O arquivo ${finalFileName}.pdf foi salvo (método alternativo)`,
            duration: 3000,
          });
        } else {
          // Fallback para download direto
          const link = document.createElement('a');
          link.href = imgData;
          link.download = `${finalFileName}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          toast({
            title: "Imagem exportada",
            description: `A imagem ${finalFileName}.png foi salva (método alternativo)`,
            duration: 3000,
          });
        }
      } catch (fallbackError) {
        console.error('Erro na abordagem alternativa:', fallbackError);
        
        // Feedback de erro final
        toast({
          title: `Falha ao exportar ${format === 'pdf' ? 'PDF' : 'PNG'}`,
          description: "Todas as tentativas de exportação falharam",
          variant: "destructive",
          duration: 5000,
        });
      }
    } finally {
      setIsLoading(false);
      if (onExportComplete) onExportComplete();
    }
  };

  const buttonContent = (
    <Button
      variant={variant}
      size={size}
      onClick={exportContent}
      disabled={isLoading}
      className="transition-all duration-300 hover:bg-primary/90 hover:shadow-md"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        showIcon && (format === 'pdf' ? (
          <FileDown className="h-4 w-4 mr-2" />
        ) : (
          <Share2 className="h-4 w-4 mr-2" />
        ))
      )}
      {text || (format === 'pdf' ? 'Exportar PDF' : 'Compartilhar')}
    </Button>
  );

  if (withTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {buttonContent}
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText || (format === 'pdf' ? 'Exportar ranking como PDF' : 'Compartilhar ranking como imagem')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return buttonContent;
};

// Componente de botão de ação dupla para exportar e compartilhar
export const RankingExportActions: React.FC<{
  targetRef: React.RefObject<HTMLElement>;
  fileName: string;
  exportTitle?: string;
}> = ({ targetRef, fileName, exportTitle }) => {
  return (
    <div className="flex space-x-2">
      <ExportRankingButton
        targetRef={targetRef}
        fileName={fileName}
        exportTitle={exportTitle}
        format="pdf"
        tooltipText="Exportar ranking como PDF"
      />
      <ExportRankingButton
        targetRef={targetRef}
        fileName={fileName}
        exportTitle={exportTitle}
        format="png"
        tooltipText="Compartilhar ranking como imagem"
      />
    </div>
  );
};

export default ExportRankingButton; 