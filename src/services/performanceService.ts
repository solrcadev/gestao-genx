
import { AthleteEvaluation, StudentPerformance, HistoricoTreinoPorAtleta } from '@/types';

// Mock function to get student performance
export async function getStudentPerformance(studentId: string): Promise<StudentPerformance> {
  // Mock implementation for demonstration
  return {
    id: '1',
    studentId,
    name: 'Student Name',
    totalTrainings: 20,
    attendedTrainings: 16,
    attendanceRate: 80,
    totalGoals: 10,
    achievedGoals: 6,
    goalsRate: 60,
    frequency: 80,
    evolution: 65,
    completedTrainings: 16,
    recentPerformance: [
      { date: '2023-01-01', score: 75 },
      { date: '2023-01-08', score: 80 },
      { date: '2023-01-15', score: 85 },
      { date: '2023-01-22', score: 82 },
      { date: '2023-01-29', score: 88 }
    ]
  };
}

// Mock function to get training history
export async function getTrainingHistory(studentId: string): Promise<TrainingHistory[]> {
  // Mock implementation for demonstration
  return [
    { id: '1', studentId, date: '2023-01-05', type: 'Físico', duration: 60, status: 'completed' },
    { id: '2', studentId, date: '2023-01-12', type: 'Tático', duration: 75, status: 'completed' },
    { id: '3', studentId, date: '2023-01-19', type: 'Técnico', duration: 90, status: 'missed' },
    { id: '4', studentId, date: '2023-01-26', type: 'Físico', duration: 60, status: 'completed' }
  ];
}

// Mock function to get student goals
export async function getStudentGoals(studentId: string): Promise<Goal[]> {
  // Mock implementation for demonstration
  return [
    { id: '1', studentId, title: 'Melhorar o saque', description: 'Aumentar a precisão do saque em 15%', targetDate: '2023-03-01', status: 'in_progress', progress: 60 },
    { id: '2', studentId, title: 'Aumentar a impulsão', description: 'Aumentar a altura do salto em 10cm', targetDate: '2023-04-01', status: 'achieved', progress: 100 },
    { id: '3', studentId, title: 'Reduzir erros de passe', description: 'Diminuir a quantidade de erros de passe em 20%', targetDate: '2023-05-01', status: 'pending', progress: 20 }
  ];
}

// Define the types
export interface TrainingHistory {
  id: string;
  studentId: string;
  date: string;
  type: string;
  duration: number;
  status: 'completed' | 'missed' | 'partial';
}

export interface Goal {
  id: string;
  studentId: string;
  title: string;
  description: string;
  targetDate: string;
  status: 'achieved' | 'in_progress' | 'pending';
  progress: number;
}

// Interface for fundamentos in HistoricoTreinoPorAtleta
export interface Fundamento {
  fundamento: string;
  acertos: number;
  erros: number;
}

// Mock function to get historical training data per athlete
export async function getHistoricoTreinoPorAtleta(atletaId: string): Promise<HistoricoTreinoPorAtleta[]> {
  // Mock implementation for demonstration
  return [
    {
      treinoId: '1',
      nomeTreino: 'Treino técnico - Saque',
      data: '2023-05-01T10:00:00Z',
      local: 'Quadra Principal',
      presenca: true,
      fundamentos: [
        { fundamento: 'saque', acertos: 18, erros: 2 },
        { fundamento: 'recepção', acertos: 15, erros: 5 }
      ]
    },
    {
      treinoId: '2',
      nomeTreino: 'Treino tático - Rotação',
      data: '2023-05-04T10:00:00Z',
      local: 'Quadra Principal',
      presenca: true,
      fundamentos: [
        { fundamento: 'levantamento', acertos: 22, erros: 3 },
        { fundamento: 'ataque', acertos: 12, erros: 8 }
      ]
    },
    {
      treinoId: '3',
      nomeTreino: 'Treino físico - Resistência',
      data: '2023-05-08T10:00:00Z',
      local: 'Academia',
      presenca: false,
      justificativa: 'Atestado médico'
    },
    {
      treinoId: '4',
      nomeTreino: 'Treino de Conjunto',
      data: '2023-05-12T10:00:00Z',
      local: 'Quadra Auxiliar',
      presenca: true,
      fundamentos: [
        { fundamento: 'bloqueio', acertos: 8, erros: 4 },
        { fundamento: 'defesa', acertos: 14, erros: 6 }
      ]
    }
  ];
}

// Mock function to get athletes performance - used by Performance.tsx
export async function getAthletesPerformance(teamType: string): Promise<AthletePerformance[]> {
  try {
    // In a real implementation, this would fetch data from the database
    // For now, we'll return mock data
    return [
      {
        atleta: {
          id: '1',
          nome: 'João Silva',
          posicao: 'Levantador',
          time: teamType,
          foto_url: null,
          created_at: new Date().toISOString()
        },
        presenca: {
          total: 20,
          presentes: 18,
          percentual: 90
        },
        avaliacoes: {
          total: 15,
          mediaNota: 85,
          porFundamento: {
            'saque': {
              acertos: 45,
              erros: 15,
              total: 60,
              percentualAcerto: 75,
              ultimaData: '2023-05-01'
            },
            'levantamento': {
              acertos: 120,
              erros: 10,
              total: 130,
              percentualAcerto: 92,
              ultimaData: '2023-05-02'
            }
          }
        },
        ultimasAvaliacoes: []
      },
      {
        atleta: {
          id: '2',
          nome: 'Maria Oliveira',
          posicao: 'Ponteiro',
          time: teamType,
          foto_url: null,
          created_at: new Date().toISOString()
        },
        presenca: {
          total: 20,
          presentes: 16,
          percentual: 80
        },
        avaliacoes: {
          total: 12,
          mediaNota: 70,
          porFundamento: {
            'saque': {
              acertos: 30,
              erros: 20,
              total: 50,
              percentualAcerto: 60,
              ultimaData: '2023-05-01'
            },
            'ataque': {
              acertos: 80,
              erros: 30,
              total: 110,
              percentualAcerto: 73,
              ultimaData: '2023-05-02'
            }
          }
        },
        ultimasAvaliacoes: []
      }
    ];
  } catch (error) {
    console.error('Error fetching athletes performance:', error);
    return [];
  }
}
