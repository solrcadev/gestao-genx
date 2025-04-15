import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Training } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { api } from '@/lib/axios';

import { AttendanceRecord, AttendanceFilters } from './attendanceService';
import { format as formatDate, parse } from 'date-fns';

// Function to generate a PDF from a training
export const generateTrainingPDF = async (trainingId: string) => {
  try {
    // Fetch training data from the API
    const response = await api.get(`/trainings/${trainingId}`);
    const training: Training = response.data;

    // Create a new jsPDF instance
    const doc = new jsPDF();

    // Define title and headers
    const title = 'Detalhes do Treino';
    const headers = [
      ['Campo', 'Valor'],
    ];

    // Prepare data for the table
    const data = [
      ['Nome', training.nome],
      ['Data', format(new Date(training.data), 'dd/MM/yyyy', { locale: ptBR })],
      ['Local', training.local],
      ['Time', training.time],
      ['Descrição', training.descricao || 'Nenhuma']
    ];

    // Add title to the document
    doc.setFontSize(18);
    doc.text(title, 105, 15, { align: 'center' });

    // Add date of generation
    doc.setFontSize(10);
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 105, 22, { align: 'center' });

    // Configure and generate the table
    autoTable(doc, {
      head: headers,
      body: data,
      startY: 30,
      margin: { horizontal: 15 },
      columnStyles: { 0: { fontStyle: 'bold' } }
    });

    // Save the PDF
    doc.save(`treino-${trainingId}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export const generateAttendancePDF = (
  records: AttendanceRecord[],
  filters: AttendanceFilters
) => {
  const doc = new jsPDF();
  const title = 'Relatório de Presenças';
  
  // Add title
  doc.setFontSize(18);
  doc.text(title, 105, 15, { align: 'center' });
  
  // Add date
  doc.setFontSize(10);
  doc.text(
    `Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`,
    105, 
    22, 
    { align: 'center' }
  );
  
  // Add filter information
  doc.setFontSize(11);
  let yPos = 30;
  doc.text('Filtros aplicados:', 14, yPos);
  yPos += 6;
  
  if (filters.athleteName) {
    doc.text(`Atleta: ${filters.athleteName}`, 14, yPos);
    yPos += 5;
  }
  
  if (filters.startDate) {
    doc.text(
      `Data inicial: ${formatDate(filters.startDate, 'dd/MM/yyyy', { locale: ptBR })}`, 
      14, 
      yPos
    );
    yPos += 5;
  }
  
  if (filters.endDate) {
    doc.text(
      `Data final: ${formatDate(filters.endDate, 'dd/MM/yyyy', { locale: ptBR })}`,
      14,
      yPos
    );
    yPos += 5;
  }
  
  if (filters.status && filters.status !== 'all') {
    doc.text(
      `Status: ${filters.status === 'present' ? 'Presentes' : 'Ausentes'}`,
      14,
      yPos
    );
    yPos += 5;
  }
  
  if (filters.team && filters.team !== 'all') {
    doc.text(`Time: ${filters.team}`, 14, yPos);
    yPos += 5;
  }
  
  yPos += 5;
  
  // Add table header
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  // Prepare table data
  const tableColumn = ['Atleta', 'Time', 'Data', 'Treino', 'Status', 'Justificativa'];
  const tableData = records.map(record => [
    record.atleta.nome,
    record.atleta.time,
    formatDate(parse(record.treino.data, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy'),
    record.treino.nome,
    record.presente ? 'Presente' : 'Ausente',
    !record.presente && record.justificativa ? record.justificativa : '-'
  ]);
  
  // Generate table
    autoTable(doc, {
    startY: yPos,
    head: [tableColumn],
    body: tableData,
      theme: 'grid',
      headStyles: {
      fillColor: [83, 83, 83],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
      },
      styles: {
      overflow: 'ellipsize',
      cellWidth: 'wrap'
    },
    columnStyles: {
      0: { cellWidth: 35 }, // Athlete name
      1: { cellWidth: 20 }, // Team
      2: { cellWidth: 20 }, // Date
      3: { cellWidth: 30 }, // Training
      4: { cellWidth: 20 }, // Status
      5: { cellWidth: 'auto' } // Justification
    }
  });
  
  // Add summary
  const totalRecords = records.length;
  const presentRecords = records.filter(r => r.presente).length;
  const absentRecords = records.filter(r => !r.presente).length;
  const justifiedAbsences = records.filter(r => !r.presente && r.justificativa).length;
  
  let finalYPos = (doc as any).lastAutoTable.finalY + 10;
  
  doc.text(`Total de registros: ${totalRecords}`, 14, finalYPos);
  finalYPos += 5;
  doc.text(`Presenças: ${presentRecords} (${Math.round(presentRecords / totalRecords * 100)}%)`, 14, finalYPos);
  finalYPos += 5;
  doc.text(`Faltas: ${absentRecords} (${Math.round(absentRecords / totalRecords * 100)}%)`, 14, finalYPos);
  finalYPos += 5;
  doc.text(`Faltas justificadas: ${justifiedAbsences} (${Math.round(justifiedAbsences / absentRecords * 100)}%)`, 14, finalYPos);
  
  // Save the PDF
  doc.save('relatorio-presencas.pdf');
};

// New function to export training details with exercises to PDF
export const exportTrainingToPdf = ({ training, exercises, userName }: { 
  training: any; 
  exercises: any[]; 
  userName: string;
}) => {
  try {
    // Create a new jsPDF instance
    const doc = new jsPDF();

    // Define title and basic information
    const title = 'Plano de Treino';
    doc.setFontSize(18);
    doc.text(title, 105, 15, { align: 'center' });

    // Add date of generation and user info
    doc.setFontSize(10);
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 105, 22, { align: 'center' });
    doc.text(`Gerado por: ${userName}`, 105, 28, { align: 'center' });

    // Add training details
    doc.setFontSize(14);
    doc.text('Informações do Treino', 14, 38);
    
    doc.setFontSize(11);
    doc.text(`Nome: ${training.nome || 'Não especificado'}`, 14, 46);
    doc.text(`Data: ${formatDate(new Date(training.data), 'dd/MM/yyyy', { locale: ptBR })}`, 14, 52);
    doc.text(`Local: ${training.local || 'Não especificado'}`, 14, 58);
    doc.text(`Time: ${training.time || 'Não especificado'}`, 14, 64);
    
    if (training.descricao) {
      doc.text('Descrição:', 14, 70);
      doc.setFontSize(10);
      doc.text(training.descricao, 14, 76);
    }
    
    // Add exercises table
    doc.setFontSize(14);
    let yPos = training.descricao ? 86 : 70;
    doc.text('Exercícios', 14, yPos);
    yPos += 8;
    
    if (exercises && exercises.length > 0) {
      const headers = [
        ['Ordem', 'Exercício', 'Tempo Est.', 'Fundamentos', 'Observações']
      ];
      
      const data = exercises.map((ex, index) => [
        (index + 1).toString(),
        ex.exercicio?.nome || 'Não especificado',
        ex.tempo_estimado ? `${ex.tempo_estimado} min` : 'N/A',
        ex.exercicio?.fundamentos?.join(', ') || '-',
        ex.observacao || '-'
      ]);
      
      autoTable(doc, {
        head: headers,
        body: data,
        startY: yPos,
        margin: { horizontal: 14 },
        styles: { overflow: 'linebreak' },
        columnStyles: { 
          0: { cellWidth: 15 }, 
          1: { cellWidth: 60 },
          2: { cellWidth: 25 },
          3: { cellWidth: 40 },
          4: { cellWidth: 50 }
        },
        headStyles: { fillColor: [80, 80, 80] }
      });
    } else {
      doc.setFontSize(11);
      doc.text('Nenhum exercício cadastrado para este treino.', 14, yPos);
    }
    
    // Add footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Página ${i} de ${pageCount}`, 105, 290, { align: 'center' });
    }
    
    // Save the PDF
    doc.save(`treino-${training.nome}-${formatDate(new Date(), 'dd-MM-yyyy')}.pdf`);
    
    return true;
  } catch (error) {
    console.error('Erro ao exportar treino para PDF:', error);
    throw error;
  }
};
