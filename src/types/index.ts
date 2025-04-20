
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
  frequency?: number;
  evolution?: number;
  completedTrainings?: number;
}

export interface AthleteEvaluation {
  id: string;
  atleta_id: string;
  athlete_id?: string; // Para compatibilidade com códigos existentes
  evaluation_date: string;
  evaluator_id: string;
  fundamentos: {
    fundamento: string;
    nota: number;
    observacoes?: string;
    acertos?: number;
    erros?: number;
  }[];
  observacoes_gerais?: string;
  historico_edicoes: {
    data: string;
    usuario_id: string;
    nome_usuario?: string;
    tecnico?: string;
    acertos_anterior?: number;
    erros_anterior?: number;
  }[];
  timestamp?: string;
  acertos?: number;
  erros?: number;
  percentual_acerto?: number;
  atleta?: {
    id: string;
    nome: string;
    time: string;
    posicao: string;
  };
  fundamento?: string;
  exercicio?: {
    id: string;
    nome: string;
  };
  treino?: {
    id: string;
    nome: string;
    data: string;
  };
  exercicio_id?: string;
  treino_id?: string;
}

export interface Training {
  id: string;
  nome: string;
  data?: string;
  descricao?: string;
  time?: TeamType | string;
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

// Added missing types
export type TeamType = 'Masculino' | 'Feminino' | 'Misto';

export type Position = 'Levantador' | 'Oposto' | 'Ponteiro' | 'Central' | 'Líbero' | 'Outro';

export type Team = 'Masculino' | 'Feminino' | 'Misto';

export type UserRole = 'admin' | 'coach' | 'assistant' | 'athlete' | 'parent' | 'guest';

export interface Athlete {
  id: string;
  nome: string;
  idade: number;
  altura: number;
  posicao: Position;
  time: Team;
  foto_url?: string | null;
  email?: string;
  telefone?: string;
  data_nascimento?: string;
  endereco?: string;
  responsavel?: string;
  responsavel_telefone?: string;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Profile {
  id: string;
  role: UserRole;
  nome?: string;
  email?: string;
  foto_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AthletePerformance {
  atleta: {
    id: string;
    nome: string;
    posicao: string;
    time?: string;
    foto_url?: string;
    created_at?: string;
  };
  presenca: {
    total: number;
    presentes: number;
    percentual: number;
  };
  avaliacoes: {
    total: number;
    mediaNota: number;
    porFundamento: {
      [key: string]: {
        total: number;
        acertos: number;
        erros: number;
        percentualAcerto: number;
        ultimaData?: string;
      };
    };
  };
  ultimasAvaliacoes?: {
    data: string;
    fundamento: string;
    acertos: number;
    erros: number;
    treino?: string;
    ultimaData?: string;
  }[];
}

export interface RankingItem {
  posicao: number;
  atleta_id: string;
  atleta_nome: string;
  fundamento: string;
  time: TeamType;
  eficiencia: number;
  total_execucoes: number;
  ranking_score: number;
  primeira_avaliacao: string;
  ultima_avaliacao: string;
}

export interface HistoricoTreinoPorAtleta {
  treinoId: string;
  nomeTreino: string;
  data: string;
  local: string;
  presenca: boolean;
  justificativa?: string;
  fundamentos?: {
    fundamento: string;
    acertos: number;
    erros: number;
  }[];
}
