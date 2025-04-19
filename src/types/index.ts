
export type Team = "Masculino" | "Feminino";

export type TeamType = "Masculino" | "Feminino";

export type Position = 
  | "Levantador" 
  | "Oposto" 
  | "Ponteiro" 
  | "Central" 
  | "Líbero"
  | "Outro";

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
  nome: string;  // Changed from 'name' to 'nome' to match DB schema
  idade: number; // Changed from 'age' to 'idade' to match DB schema
  altura: number; // Changed from 'height' to 'altura' to match DB schema
  posicao: string; // Changed from 'position' to 'posicao' to match DB schema
  time: Team;     // Changed from 'team' to 'time' to match DB schema
  foto_url: string | null;
  email?: string;
  telefone?: string;
  observacoes?: string;
}

// Interface para agregação de dados de desempenho
export interface AthletePerformance {
  atleta: Athlete;
  presenca: {
    total: number;
    presentes: number; // Alterado de 'presente' para 'presentes' para refletir o plural
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
        percentualAcerto: number; // Adicionado para compatibilidade
        ultimaData?: string; // Data da última avaliação
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

// Training interface to address issues
export interface Training {
  id: string;
  nome: string;
  data: string | Date;
  local: string;
  descricao?: string;
  time: TeamType;
  created_at?: string;
  updated_at?: string;
  status?: string;
}

// Interface para avaliações de atletas
export interface AthleteEvaluation {
  id: string;
  atleta_id: string;
  atleta?: {
    nome: string;
    time: TeamType;
    posicao: string;
  };
  exercicio_id: string;
  exercicio?: {
    nome: string;
    fundamento: string;
  };
  treino_id: string;
  treino?: {
    nome: string;
    data: string | Date;
  };
  fundamento: string;
  acertos: number;
  erros: number;
  percentual_acerto?: number;
  timestamp: string;
  created_at: string;
  tecnico_id?: string;
  tecnico?: {
    nome: string;
  };
  historico_edicoes?: Array<{
    data: string;
    tecnico: string;
    acertos_anterior: number;
    erros_anterior: number;
  }>;
}

// Interface for student performance
export interface StudentPerformance {
  frequency: number;
  evolution: number;
  completedTrainings: number;
  totalTrainings: number;
  achievedGoals: number;
  totalGoals: number;
}
