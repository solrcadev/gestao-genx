export interface StudentPerformance {
  id: string;
  studentId: string;
  name?: string;
  totalTrainings: number;
  attendedTrainings: number;
  attendanceRate: number;
  totalGoals: number;
  achievedGoals: number;
  goalsRate: number;
  recentPerformance?: {
    date: string;
    score: number;
  }[];
}

export interface AthleteEvaluation {
  id: string;
  athlete_id: string;
  evaluation_date: string;
  evaluator_id: string;
  fundamentos: {
    fundamento: string;
    nota: number;
    observacoes?: string;
  }[];
  observacoes_gerais?: string;
  historico_edicoes: {
    data: string;
    usuario_id: string;
    nome_usuario?: string;
  }[];
}

export interface Training {
  id: string;
  nome: string;
  data?: string;
  descricao?: string;
  time?: 'Masculino' | 'Feminino' | 'Misto' | string;
  local?: string;
  exercicios: {
    id: string;
    exercicio_id: string;
    nome: string;
    descricao?: string;
    series?: number;
    repeticoes?: number;
    duracao?: number;
    objetivos?: string[];
    imagem_url?: string;
  }[];
  created_at: string;
  updated_at?: string;
}
