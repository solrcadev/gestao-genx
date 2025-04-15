
import { supabase } from '@/lib/supabase';
import { format, parse, isAfter, isBefore, subMonths } from 'date-fns';
import { AthletePerformance, TeamType } from '@/types';

// Add this interface if it doesn't exist or update it
export interface StudentPerformance {
  frequency: number;
  evolution: number;
  completedTrainings: number;
  totalTrainings: number;
  achievedGoals: number;
  totalGoals: number;
}

// Performance Data interfaces
export interface PerformanceData {
  id: string;
  athleteId: string;
  date: string;
  score: number;
}

export interface TrainingHistory {
  id: string;
  date: string;
  type: string;
  duration: number;
  status: 'completed' | 'missed' | 'incomplete';
}

// Interface para componente StudentPerformance
export interface TrainingHistoryItem {
  id: string;
  date: string;
  type: string;
  duration: number;
  status: 'completed' | 'missed' | 'incomplete';
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  progress: number;
  status: 'pending' | 'in_progress' | 'achieved';
}

export interface HistoricoTreinoPorAtleta {
  treinoId: string;
  nomeTreino: string;
  data: string;
  local: string;
  presenca: boolean;
  justificativa?: string;
  fundamentos: {
    fundamento: string;
    acertos: number;
    erros: number;
  }[];
}

// Function to get student performance data
export const getStudentPerformance = async (studentId: string): Promise<StudentPerformance> => {
  try {
    // In a real implementation, you would fetch this data from your Supabase database
    // For now, we'll return mock data
    return {
      frequency: 85,
      evolution: 72,
      completedTrainings: 24,
      totalTrainings: 30,
      achievedGoals: 3,
      totalGoals: 5
    };
  } catch (error) {
    console.error('Error fetching student performance:', error);
    throw new Error('Failed to fetch student performance data');
  }
};

// Function to get training history data
export const getTrainingHistory = async (studentId: string): Promise<TrainingHistoryItem[]> => {
  try {
    // Mock data for training history
    return [
      {
        id: '1',
        date: '2024-04-10',
        type: 'Technical',
        duration: 90,
        status: 'completed'
      },
      {
        id: '2',
        date: '2024-04-08',
        type: 'Tactical',
        duration: 120,
        status: 'completed'
      },
      {
        id: '3',
        date: '2024-04-05',
        type: 'Physical',
        duration: 60,
        status: 'missed'
      },
      {
        id: '4',
        date: '2024-04-03',
        type: 'Technical',
        duration: 90,
        status: 'completed'
      },
      {
        id: '5',
        date: '2024-04-01',
        type: 'Match Practice',
        duration: 120,
        status: 'incomplete'
      }
    ];
  } catch (error) {
    console.error('Error fetching training history:', error);
    throw new Error('Failed to fetch training history');
  }
};

// Function to get student goals
export const getStudentGoals = async (studentId: string): Promise<Goal[]> => {
  try {
    // Mock data for goals
    return [
      {
        id: '1',
        title: 'Improve Serving Accuracy',
        description: 'Achieve 80% accuracy in jump serves',
        targetDate: '2024-06-15',
        progress: 65,
        status: 'in_progress'
      },
      {
        id: '2',
        title: 'Increase Vertical Jump',
        description: 'Reach 80cm in vertical jump test',
        targetDate: '2024-07-30',
        progress: 40,
        status: 'in_progress'
      },
      {
        id: '3',
        title: 'Perfect Block Technique',
        description: 'Master timing and hand positioning',
        targetDate: '2024-05-10',
        progress: 90,
        status: 'achieved'
      }
    ];
  } catch (error) {
    console.error('Error fetching student goals:', error);
    throw new Error('Failed to fetch student goals');
  }
};

// Function to get athlete performance data
export const getAthletePerformance = async (athleteId: string): Promise<AthletePerformance> => {
  try {
    // In a real implementation, you would fetch this data from Supabase
    // For now, we'll return mock data
    return {
      atleta: {
        id: athleteId,
        nome: 'Atleta Exemplo',
        posicao: 'Levantador',
        time: 'Masculino',
        idade: 22,
        altura: 1.85,
        created_at: new Date().toISOString(),
        foto_url: null,
      },
      presenca: {
        percentual: 85,
        presentes: 17,
        total: 20
      },
      avaliacoes: {
        total: 60, // Adicionando a propriedade 'total' que faltava
        mediaNota: 75,
        porFundamento: {
          saque: {
            acertos: 42,
            erros: 18,
            percentualAcerto: 70,
            total: 60,
            ultimaData: '2024-04-10'
          },
          recepção: {
            acertos: 56,
            erros: 14,
            percentualAcerto: 80,
            total: 70,
            ultimaData: '2024-04-08'
          },
          levantamento: {
            acertos: 38,
            erros: 12,
            percentualAcerto: 76,
            total: 50,
            ultimaData: '2024-04-05'
          },
          ataque: {
            acertos: 32,
            erros: 18,
            percentualAcerto: 64,
            total: 50,
            ultimaData: '2024-04-03'
          }
        }
      },
      ultimasAvaliacoes: [
        { data: '2024-04-10', treino: 'Técnico', fundamento: 'saque', acertos: 14, erros: 6 },
        { data: '2024-04-08', treino: 'Tático', fundamento: 'recepção', acertos: 16, erros: 4 },
        { data: '2024-04-05', treino: 'Físico', fundamento: 'levantamento', acertos: 12, erros: 8 },
        { data: '2024-04-03', treino: 'Técnico', fundamento: 'ataque', acertos: 18, erros: 2 },
        { data: '2024-04-01', treino: 'Jogo', fundamento: 'defesa', acertos: 10, erros: 10 }
      ]
    };
  } catch (error) {
    console.error('Error fetching athlete performance:', error);
    throw new Error('Failed to fetch athlete performance data');
  }
};

// Function to get athletes performance data
export const getAthletesPerformance = async (team: TeamType): Promise<AthletePerformance[]> => {
  try {
    // Mock data for the team performance
    return [
      {
        atleta: {
          id: '1',
          nome: 'Carlos Silva',
          posicao: 'Levantador',
          time: team,
          idade: 22,
          altura: 1.85,
          created_at: new Date().toISOString(),
          foto_url: null,
        },
        presenca: {
          percentual: 85,
          presentes: 17,
          total: 20
        },
        avaliacoes: {
          total: 70, // Adicionando a propriedade 'total' que faltava
          mediaNota: 75,
          porFundamento: {
            saque: {
              acertos: 42,
              erros: 18,
              percentualAcerto: 70,
              total: 60,
              ultimaData: '2024-04-10'
            },
            recepção: {
              acertos: 56,
              erros: 14,
              percentualAcerto: 80,
              total: 70,
              ultimaData: '2024-04-08'
            }
          }
        },
        ultimasAvaliacoes: []
      },
      {
        atleta: {
          id: '2',
          nome: 'André Martins',
          posicao: 'Ponteiro',
          time: team,
          idade: 24,
          altura: 1.92,
          created_at: new Date().toISOString(),
          foto_url: null,
        },
        presenca: {
          percentual: 90,
          presentes: 18,
          total: 20
        },
        avaliacoes: {
          total: 80, // Adicionando a propriedade 'total' que faltava
          mediaNota: 82,
          porFundamento: {
            ataque: {
              acertos: 62,
              erros: 18,
              percentualAcerto: 77.5,
              total: 80,
              ultimaData: '2024-04-12'
            },
            bloqueio: {
              acertos: 24,
              erros: 16,
              percentualAcerto: 60,
              total: 40,
              ultimaData: '2024-04-12'
            }
          }
        },
        ultimasAvaliacoes: []
      },
      {
        atleta: {
          id: '3',
          nome: 'Lucas Santos',
          posicao: 'Central',
          time: team,
          idade: 25,
          altura: 2.02,
          created_at: new Date().toISOString(),
          foto_url: null,
        },
        presenca: {
          percentual: 95,
          presentes: 19,
          total: 20
        },
        avaliacoes: {
          total: 80, // Adicionando a propriedade 'total' que faltava
          mediaNota: 79,
          porFundamento: {
            bloqueio: {
              acertos: 32,
              erros: 8,
              percentualAcerto: 80,
              total: 40,
              ultimaData: '2024-04-14'
            },
            ataque: {
              acertos: 28,
              erros: 12,
              percentualAcerto: 70,
              total: 40,
              ultimaData: '2024-04-14'
            }
          }
        },
        ultimasAvaliacoes: []
      }
    ];
  } catch (error) {
    console.error('Error fetching athletes performance:', error);
    throw new Error('Failed to fetch athletes performance data');
  }
};

// Function to get treino histórico por atleta
export const getHistoricoTreinoPorAtleta = async (atletaId: string): Promise<HistoricoTreinoPorAtleta[]> => {
  try {
    // Mock data for the athlete's training history
    return [
      {
        treinoId: '1',
        nomeTreino: 'Treino Técnico de Saque',
        data: '10/04/2024',
        local: 'Ginásio Principal',
        presenca: true,
        fundamentos: [
          { fundamento: 'saque', acertos: 15, erros: 5 },
          { fundamento: 'recepção', acertos: 12, erros: 8 }
        ]
      },
      {
        treinoId: '2',
        nomeTreino: 'Treino Tático',
        data: '08/04/2024',
        local: 'Quadra Externa',
        presenca: true,
        fundamentos: [
          { fundamento: 'levantamento', acertos: 22, erros: 6 },
          { fundamento: 'bloqueio', acertos: 10, erros: 10 }
        ]
      },
      {
        treinoId: '3',
        nomeTreino: 'Treino Físico',
        data: '05/04/2024',
        local: 'Academia',
        presenca: false,
        justificativa: 'Consulta médica agendada',
        fundamentos: [] // Adicionando fundamentos vazios para manter a consistência
      },
      {
        treinoId: '4',
        nomeTreino: 'Treino de Jogo',
        data: '03/04/2024',
        local: 'Ginásio Principal',
        presenca: true,
        fundamentos: [
          { fundamento: 'ataque', acertos: 18, erros: 7 },
          { fundamento: 'defesa', acertos: 14, erros: 6 }
        ]
      }
    ];
  } catch (error) {
    console.error('Error fetching athlete training history:', error);
    throw new Error('Failed to fetch athlete training history');
  }
};

// Function to register performance evaluation
export const registrarAvaliacaoDesempenho = async (avaliacaoData: {
  atleta_id: string;
  treino_id: string;
  fundamento: string;
  acertos: number;
  erros: number;
  timestamp: string;
}): Promise<void> => {
  try {
    // In a real implementation, you would save this data to your Supabase database
    console.log('Saving evaluation data:', avaliacaoData);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return success
    return Promise.resolve();
  } catch (error) {
    console.error('Error registering performance evaluation:', error);
    throw new Error('Failed to register performance evaluation');
  }
};
