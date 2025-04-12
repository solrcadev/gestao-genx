
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
  
  // Calculate total estimated time
  const totalTime = exercises.reduce((total, ex) => total + (ex.tempo_estimado || 0), 0);
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
  
  exercises.forEach((exercise, index) => {
    // Check if we need a new page
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }
    
    // Exercise number and name
    doc.setFontSize(12);
    doc.setTextColor(primaryColor);
    doc.text(`${index + 1}. ${exercise.exercicio?.nome || exercise.nome || 'Exercício'}`, 20, currentY);
    currentY += 8;
    
    // Exercise details
    doc.setFontSize(10);
    doc.setTextColor(secondaryColor);
    
    // Category and time
    doc.text(`Categoria: ${exercise.exercicio?.categoria || exercise.categoria || 'Não especificada'}`, 25, currentY);
    doc.text(`Duração: ${exercise.tempo || exercise.tempo_estimado || '?'} min`, 120, currentY);
    currentY += 6;
    
    // Objective if available
    if (exercise.exercicio?.objetivo || exercise.objetivo) {
      doc.text(`Objetivo: ${exercise.exercicio?.objetivo || exercise.objetivo}`, 25, currentY);
      currentY += 6;
    }
    
    // Observations if available
    if (exercise.observacao) {
      // Word wrap for observations
      const splitObservation = doc.splitTextToSize(`Observações: ${exercise.observacao}`, 150);
      doc.text(splitObservation, 25, currentY);
      currentY += (splitObservation.length * 6);
    }
    
    // Add some spacing between exercises
    currentY += 8;
  });
  
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
