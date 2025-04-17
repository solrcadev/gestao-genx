
import { AthletePerformance, HistoricoTreinoPorAtleta, TeamType } from '@/types';
import { getAthletePerformance, getTeamPerformance, getAthletesPerformance } from '@/services/athletes/athletePerformance';
import { getHistoricoTreinoPorAtleta } from '@/services/athletes/trainingHistory';

// Re-export everything to maintain backward compatibility
export {
  getAthletePerformance,
  getTeamPerformance,
  getAthletesPerformance,
  getHistoricoTreinoPorAtleta
};

// For compatibility with PerformanceTab.tsx
export const getStudentPerformance = getAthletePerformance;
export const getTrainingHistory = getHistoricoTreinoPorAtleta;
export const getStudentGoals = async (studentId: string) => { 
  // This is a placeholder implementation
  return [];
};
export const registrarAvaliacaoDesempenho = async (data: any) => {
  // This is a placeholder implementation
  console.log('Registrando avaliação de desempenho:', data);
  return true;
};

// Types for backward compatibility
export type PerformanceData = AthletePerformance;
export type TrainingHistory = HistoricoTreinoPorAtleta;
export type StudentPerformance = AthletePerformance;
export type Goal = {
  id: string;
  title: string;
  description: string;
  deadline: Date;
  progress: number;
};

// Export types that were originally in this file
export type { AthletePerformance, HistoricoTreinoPorAtleta };
