
export type TeamType = "Masculino" | "Feminino";
export type UserRole = "coach" | "athlete";

export interface Profile {
  id: string;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
}

export interface Athlete {
  id: string;
  nome: string;
  posicao: string;
  time: TeamType;
  idade: number;
  altura: number;
  email?: string;
  telefone?: string;
  observacoes?: string;
  imagem_url?: string; // This is the correct field name in the database
  foto_url?: string;   // Adding this alias for backward compatibility
  user_id?: string;
}

export interface AthletePerformance {
  atleta: {
    id: string;
    nome: string;
    posicao: string;
    time?: TeamType;  // Added this field
    idade?: number;   // Added this field
    altura?: number;  // Added this field
    foto_url?: string; // Added for backward compatibility
    imagem_url?: string; // Added actual field name
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
      [fundamento: string]: {
        acertos: number;
        erros: number;
        total: number;
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
  }[];
}

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

export type Position = 'Levantador' | 'Ponteiro' | 'Central' | 'Oposto' | 'Líbero' | 'Outro';
export type Team = 'Masculino' | 'Feminino';
export type Training = {
  id: string;
  name?: string;
  date?: string;
  location?: string;
  status: string;
  nome?: string;   // Added for compatibility
  data?: string;   // Added for compatibility
  local?: string;  // Added for compatibility
  time?: TeamType; // Added for compatibility
  descricao?: string; // Added for compatibility
  exercises: {
    id: string;
    name: string;
    duration: number;
    order: number;
  }[];
}

// Add histórico treino type
export type HistoricoTreino = {
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
