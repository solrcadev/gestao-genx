
export type Team = "Masculino" | "Feminino";
export type TeamType = "Masculino" | "Feminino";
export type Position = "Levantador" | "Oposto" | "Ponteiro" | "Central" | "Líbero" | "Outro";
export type UserRole = "admin" | "coach" | "athlete";

export interface Profile {
  id: string;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
}

export interface Athlete {
  id: string;
  created_at: string;
  nome: string;
  idade: number;
  altura: number;
  posicao: string;
  time: Team;
  foto_url: string | null;
}

export interface AthletePerformance {
  atleta: Athlete;
  presenca: {
    total: number;
    presentes: number;
    percentual: number;
  };
  avaliacoes: {
    total: number;
    mediaNota: number;
    porFundamento: {
      [fundamento: string]: {
        acertos: number;
        erros: number;
        total: number;
        percentualAcerto: number;
        ultimaData?: string;
      };
    };
  };
  ultimasAvaliacoes?: Array<{
    data: string;
    treino: string;
    fundamento: string;
    acertos: number;
    erros: number;
  }>;
}

export interface RankingItem {
  posicao: number;
  atleta_id: string;
  atleta_nome: string;
  time: TeamType;
  fundamento: string;
  total_acertos: number;
  total_erros: number;
  total_execucoes: number;
  eficiencia: number;
  ranking_score: number;
}

export interface StudentPerformance {
  frequency: number;
  evolution: number;
  completedTrainings: number;
  achievedGoals: number;
  totalTrainings: number;
  totalGoals: number;
}

export interface AthleteEvaluation {
  id: string;
  atleta_id: string;
  exercicio_id: string;
  treino_id: string;
  fundamento: string;
  acertos: number;
  erros: number;
  timestamp: string;
  percentual_acerto?: number;
  atleta?: {
    id: string;
    nome: string;
    time: string;
    posicao: string;
  };
  exercicio?: {
    id: string;
    nome: string;
  };
  treino?: {
    id: string;
    nome: string;
    data: string;
  };
}

export interface Training {
  id: string;
  nome: string;
  data: string;
  local: string;
  status: string;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
  user_id: string;
}
