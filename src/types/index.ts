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
  imagem_url?: string;
  user_id?: string;
}

export interface AthletePerformance {
  atleta: {
    id: string;
    nome: string;
    posicao: string;
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

export type Position = 'Levantador' | 'Ponteiro' | 'Central' | 'Oposto' | 'Líbero';
export type Team = 'Masculino' | 'Feminino';
export type Training = {
  id: string;
  name: string;
  date: string;
  location: string;
  status: string;
  exercises: {
    id: string;
    name: string;
    duration: number;
    order: number;
  }[];
};
