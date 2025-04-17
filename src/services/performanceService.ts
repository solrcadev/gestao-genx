
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

// Export types that were originally in this file
export type { AthletePerformance, HistoricoTreinoPorAtleta };
