
// Re-export all functions from the performance service modules
export * from './athletes/athletePerformance';
export * from './athletes/athleteStats';
export * from './athletes/trainingHistory';
export * from './athletes/evaluations';

// Additional re-exports for types that were previously imported from this file
export type HistoricoTreinoPorAtleta = {
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
};

export type TrainingHistory = {
  id: string;
  date: string;
  type: string;
  duration: number;
  status: 'completed' | 'missed' | 'partial';
};

export type Goal = {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  progress: number;
  status: 'achieved' | 'in_progress' | 'pending';
};

export type StudentPerformance = {
  id: string;
  name: string;
  position: string; // Changed from Position type to string
  team: string; // Changed from Team type to string
  frequency: number;
  evolution: number;
  completedTrainings: number;
  totalTrainings: number;
  achievedGoals: number;
  totalGoals: number;
};

// Re-export mock functions that might be used elsewhere
export const getStudentPerformance = (studentId: string): StudentPerformance => {
  return {
    id: studentId,
    name: "Estudante",
    position: "Ponteiro",
    team: "Masculino",
    frequency: 85,
    evolution: 70,
    completedTrainings: 24,
    totalTrainings: 30,
    achievedGoals: 3,
    totalGoals: 5
  };
};

export const getStudentGoals = (studentId: string): Goal[] => {
  return [
    {
      id: "1",
      title: "Melhorar saque",
      description: "Atingir 80% de precisão nos saques",
      targetDate: new Date().toISOString(),
      progress: 65,
      status: 'in_progress'
    },
    {
      id: "2",
      title: "Aumentar resistência",
      description: "Completar treinos físicos sem fadigar",
      targetDate: new Date().toISOString(),
      progress: 80,
      status: 'in_progress'
    }
  ];
};

export type TrainingHistoryItem = {
  id: string;
  date: string;
  type: string;
  duration: number;
  status: 'completed' | 'missed' | 'partial';
};

export const getTrainingHistory = (studentId: string): TrainingHistoryItem[] => {
  return [
    {
      id: "1",
      date: new Date().toISOString(),
      type: "Técnico",
      duration: 90,
      status: "completed"
    },
    {
      id: "2",
      date: new Date(Date.now() - 86400000).toISOString(),
      type: "Físico",
      duration: 60,
      status: "completed"
    }
  ];
};
