
import { AthletePerformance, HistoricoTreinoPorAtleta, TeamType } from '@/types';
import { getAthletePerformance as getAthletePerformanceOrig, getTeamPerformance, getAthletesPerformance } from '@/services/athletes/athletePerformance';
import { getHistoricoTreinoPorAtleta as getHistoricoTreinoPorAtletaOrig } from '@/services/athletes/trainingHistory';
import { registrarAvaliacaoDesempenho as registrarAvaliacaoDesempenhoOrig } from '@/services/athletes/evaluations';

// Export the original functions with fixed signatures
export const getAthletePerformance = async (
  athleteId: string,
  startDate?: Date,
  endDate?: Date
): Promise<AthletePerformance> => {
  const now = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const results = await getAthletePerformanceOrig(
    athleteId,
    startDate || sixMonthsAgo,
    endDate || now
  );
  
  return results[0] || createEmptyAthletePerformance(athleteId);
};

export const getHistoricoTreinoPorAtleta = async (athleteId: string): Promise<HistoricoTreinoPorAtleta[]> => {
  return await getHistoricoTreinoPorAtletaOrig(athleteId);
};

export const registrarAvaliacaoDesempenho = async (data: any) => {
  return await registrarAvaliacaoDesempenhoOrig(data);
};

// For compatibility with PerformanceTab.tsx
export const getStudentPerformance = async (studentId: string): Promise<StudentPerformance> => {
  const athletePerformance = await getAthletePerformance(studentId);
  
  // Map athlete performance to student performance format
  return {
    id: athletePerformance.atleta?.id || studentId,
    name: athletePerformance.atleta?.nome || "Unknown",
    position: athletePerformance.atleta?.posicao || "Unknown",
    frequency: athletePerformance.presenca?.percentual || 0,
    evolution: athletePerformance.avaliacoes?.mediaNota || 0,
    totalTrainings: athletePerformance.presenca?.total || 0,
    completedTrainings: athletePerformance.presenca?.presentes || 0,
    totalGoals: 5, // Default values since this data isn't in AthletePerformance
    achievedGoals: 3, // Default values
    attendance: athletePerformance.presenca?.percentual || 0,
    performanceScore: athletePerformance.avaliacoes?.mediaNota || 0,
    recentActivity: []
  };
};

export const getTrainingHistory = async (studentId: string): Promise<TrainingHistory[]> => {
  const history = await getHistoricoTreinoPorAtleta(studentId);
  
  // Convert to the format expected by PerformanceTab
  return history.map(item => ({
    id: item.id,
    date: item.data,
    type: item.nomeTreino,
    duration: 90, // Default duration in minutes
    status: item.presenca ? 'completed' : 'missed'
  }));
};

export const getStudentGoals = async (studentId: string): Promise<Goal[]> => { 
  // This is a placeholder implementation
  return [
    {
      id: '1',
      title: 'Melhorar saque',
      description: 'Aumentar precisão do saque para 80%',
      deadline: new Date(),
      targetDate: new Date().toISOString(),
      progress: 65,
      status: 'in_progress'
    },
    {
      id: '2',
      title: 'Aperfeiçoar bloqueio',
      description: 'Posicionamento correto em 90% dos bloqueios',
      deadline: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      targetDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
      progress: 40,
      status: 'in_progress'
    }
  ];
};

// Helper function to create empty athlete performance data
function createEmptyAthletePerformance(athleteId: string): AthletePerformance {
  return {
    atleta: {
      id: athleteId,
      nome: 'Unknown',
      posicao: 'Unknown',
      time: 'Masculino',
      idade: 0,
      altura: 0,
      created_at: new Date().toISOString(),
      foto_url: null
    },
    presenca: {
      total: 0,
      presentes: 0,
      percentual: 0
    },
    avaliacoes: {
      total: 0,
      mediaNota: 0,
      porFundamento: {}
    }
  };
}

// Types for backward compatibility
export type PerformanceData = AthletePerformance;
export type TrainingHistory = {
  id: string;
  date: string;
  type: string;
  duration: number;
  status: 'completed' | 'missed' | 'incomplete';
};
export type StudentPerformance = {
  id: string;
  name: string;
  position: string;
  frequency: number;
  evolution: number;
  totalTrainings: number;
  completedTrainings: number;
  totalGoals: number;
  achievedGoals: number;
  attendance: number;
  performanceScore: number;
  recentActivity: Array<{
    date: string;
    type: string;
    details: string;
  }>;
};
export type Goal = {
  id: string;
  title: string;
  description: string;
  deadline: Date;
  targetDate?: string;
  progress: number;
  status?: 'achieved' | 'in_progress' | 'pending';
};

// Export types that were originally in this file
export type { AthletePerformance, HistoricoTreinoPorAtleta };
