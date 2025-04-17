
import { AthletePerformance, HistoricoTreinoPorAtleta, Goal } from '@/types';

// Interfaces for StudentPerformance.tsx
export interface TrainingHistoryItem {
  id: string;
  date: string;
  type: string;
  duration: number;
  status: 'completed' | 'incomplete';
}

export function adaptAthleteToStudentPerformance(performance: AthletePerformance) {
  return {
    id: performance.atleta?.id || '',
    name: performance.atleta?.nome || '',
    position: performance.atleta?.posicao || '',
    attendance: performance.presenca?.percentual || 0,
    performanceScore: performance.avaliacoes?.mediaNota || 0,
    totalTrainings: performance.presenca?.total || 0,
    completedTrainings: performance.presenca?.presentes || 0,
    totalGoals: 5, // Placeholder
    achievedGoals: 3, // Placeholder
    recentActivity: [],
  };
}

export function adaptTrainingHistory(history: HistoricoTreinoPorAtleta[]): TrainingHistoryItem[] {
  return history.map(item => ({
    id: item.id || '',
    date: item.data || '',
    type: item.nomeTreino || '',
    duration: 90, // Default duration
    status: item.presenca ? 'completed' : 'incomplete'
  }));
}

export function createMockGoals(): Goal[] {
  return [
    {
      id: '1',
      title: 'Melhorar Saque',
      description: 'Aumentar precisão do saque para 80%',
      deadline: new Date(),
      progress: 65,
      status: 'in_progress'
    },
    {
      id: '2',
      title: 'Aperfeiçoar Bloqueio',
      description: 'Posicionamento correto em 90% dos bloqueios',
      deadline: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      progress: 40,
      status: 'in_progress'
    }
  ];
}
