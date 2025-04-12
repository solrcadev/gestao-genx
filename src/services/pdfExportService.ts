import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Training } from '@/types';

export interface TrainingPdfData {
  training: Training;
  exercises: any[];
  athletes?: any[];
  userName: string;
}

export const exportTrainingToPdf = ({
  training,
  exercises,
  athletes = [],
  userName
}: TrainingPdfData) => {
  // Create a new PDF document in A4 size
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Set up colors
  const primaryColor = '#6E59A5';
  const secondaryColor = '#403E43';
  
  // Set font styles
  doc.setFont('helvetica');
  
  // Add Title
  doc.setFontSize(20);
  doc.setTextColor(primaryColor);
  doc.text(`Treino: ${training.nome}`, 20, 20);
  
  // Add Date and Location
  doc.setFontSize(12);
  doc.setTextColor(secondaryColor);
  const formattedDate = format(new Date(training.data), 'PPP', { locale: ptBR });
  doc.text(`Data: ${formattedDate}`, 20, 30);
  doc.text(`Local: ${training.local}`, 20, 38);
  
  // Add Created By
  doc.text(`Preparado por: ${userName}`, 20, 46);
  
  // Add divider
  doc.setDrawColor(primaryColor);
  doc.line(20, 50, 190, 50);
  
  // Add time information
  doc.setFontSize(10);
  doc.text(`Time: ${training.time || 'Não especificado'}`, 20, 56);
  
  // Verifica se há exercícios e loga para debug
  console.log("Exercícios para PDF:", exercises);
  
  // Calculate total estimated time
  const totalTime = exercises && exercises.length > 0 
    ? exercises.reduce((total, ex) => {
        // Melhorar extração do tempo estimado para capturar todos os possíveis campos
        // Remover referência ao campo tempo que não existe
        // Adiciona verificações para possíveis outros campos de tempo
        const tempo = ex.tempo_estimado || 
                     ex.tempo_planejado ||
                     ex.duracao ||
                     (ex.exercicio && (ex.exercicio.tempo_estimado || ex.exercicio.duracao)) || 
                     0;
        
        console.log(`Exercício ${ex.exercicio?.nome || ex.nome || 'sem nome'} - Tempo: ${tempo}, Campos disponíveis:`, Object.keys(ex));
        return total + Number(tempo);
      }, 0) 
    : 0;
    
  doc.text(`Tempo total estimado: ${totalTime} minutos`, 20, 62);
  
  // Athletes section if available
  if (athletes && athletes.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(primaryColor);
    doc.text('Atletas Participantes', 20, 72);
    
    // Create athlete table data
    const athleteData = athletes.map(athlete => [athlete.nome, athlete.posicao || '']);
    
    autoTable(doc, {
      head: [['Nome', 'Posição']],
      body: athleteData,
      startY: 76,
      theme: 'grid',
      headStyles: {
        fillColor: [110, 89, 165],
        textColor: [255, 255, 255]
      },
      styles: {
        fontSize: 10,
      }
    });
  }
  
  // Exercises section
  const exerciseSectionY = athletes && athletes.length > 0 
    ? (doc as any).lastAutoTable.finalY + 15
    : 76;
  
  doc.setFontSize(14);
  doc.setTextColor(primaryColor);
  doc.text('Exercícios', 20, exerciseSectionY);
  
  // Process each exercise
  let currentY = exerciseSectionY + 10;
  
  // Verificar se exercises está definido e tem elementos
  if (!exercises || exercises.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(secondaryColor);
    doc.text('Nenhum exercício cadastrado para este treino.', 25, currentY);
    currentY += 10;
  } else {
    // Primeiro, adicionar uma tabela resumo com todos os exercícios
    const exerciseTableData = exercises.map((ex, index) => {
      // Encontrar qualquer campo que possa conter a informação de tempo
      const tempoEstimado = ex.tempo_estimado || 
                          ex.tempo_planejado ||
                          ex.duracao ||
                          (ex.exercicio && (ex.exercicio.tempo_estimado || ex.exercicio.duracao)) || 
                          '?';
      
      return [
        (index + 1).toString(),
        ex.exercicio?.nome || ex.nome || 'Exercício',
        ex.exercicio?.categoria || ex.categoria || 'Não especificada',
        tempoEstimado + ' min'
      ];
    });
    
    autoTable(doc, {
      head: [['#', 'Exercício', 'Categoria', 'Duração']],
      body: exerciseTableData,
      startY: currentY,
      theme: 'grid',
      headStyles: {
        fillColor: [110, 89, 165],
        textColor: [255, 255, 255]
      },
      styles: {
        fontSize: 9
      },
      columnStyles: {
        0: {cellWidth: 10},
        3: {cellWidth: 20}
      }
    });
    
    // Atualizar a posição Y após a tabela
    currentY = (doc as any).lastAutoTable.finalY + 20;
    
    // Adicionar título para detalhes dos exercícios
    doc.setFontSize(14);
    doc.setTextColor(primaryColor);
    doc.text('Detalhes dos Exercícios', 20, currentY);
    currentY += 10;
    
    // Depois, mostrar os detalhes de cada exercício
    exercises.forEach((exercise, index) => {
      // Check if we need a new page
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
      
      // Processamento mais seguro dos dados do exercício
      const exercicioNome = exercise.exercicio?.nome || exercise.nome || 'Exercício';
      const exercicioCategoria = exercise.exercicio?.categoria || exercise.categoria || 'Não especificada';
      // Melhorando a captura do tempo do exercício, verificando vários campos possíveis
      const exercicioTempo = exercise.tempo_estimado || 
                           exercise.tempo_planejado ||
                           exercise.duracao ||
                           (exercise.exercicio && (exercise.exercicio.tempo_estimado || exercise.exercicio.duracao)) || 
                           '?';
      const exercicioObjetivo = exercise.exercicio?.objetivo || exercise.objetivo || '';
      const exercicioObservacao = exercise.observacao || '';
      
      // Exercise number and name
      doc.setFontSize(12);
      doc.setTextColor(primaryColor);
      doc.text(`${index + 1}. ${exercicioNome}`, 20, currentY);
      currentY += 8;
      
      // Exercise details
      doc.setFontSize(10);
      doc.setTextColor(secondaryColor);
      
      // Category and time
      doc.text(`Categoria: ${exercicioCategoria}`, 25, currentY);
      doc.text(`Duração: ${exercicioTempo} min`, 120, currentY);
      currentY += 6;
      
      // Objective if available
      if (exercicioObjetivo) {
        doc.text(`Objetivo: ${exercicioObjetivo}`, 25, currentY);
        currentY += 6;
      }
      
      // Observations if available
      if (exercicioObservacao) {
        // Word wrap for observations
        const splitObservation = doc.splitTextToSize(`Observações: ${exercicioObservacao}`, 150);
        doc.text(splitObservation, 25, currentY);
        currentY += (splitObservation.length * 6);
      }
      
      // Add some spacing between exercises
      currentY += 8;
    });
  }
  
  // Add page number at the bottom
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Página ${i} de ${totalPages}`, 
      doc.internal.pageSize.getWidth() / 2, 
      doc.internal.pageSize.getHeight() - 10, 
      { align: 'center' }
    );
  }
  
  // Generate timestamp for the filename
  const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
  const fileName = `treino_${training.nome.replace(/\s+/g, '_')}_${timestamp}.pdf`;
  
  // Save the PDF
  doc.save(fileName);
};
