
export type Team = "Masculino" | "Feminino";

export type TeamType = "Masculino" | "Feminino";

export type Position = 
  | "Levantador" 
  | "Oposto" 
  | "Ponteiro" 
  | "Central" 
  | "Líbero"
  | "Outro";

export type UserRole = 'admin' | 'coach' | 'trainer' | 'athlete' | 'user';

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
  imagem_url?: string | null;
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

// Interface for StudentPerformance to fix PerformanceTab errors
export interface StudentPerformance {
  id: string;
  name: string;
  position: string;
  totalTrainings: number;
  totalGoals: number;
  attendance: number;
  performanceScore: number;
  recentActivity: {
    date: string;
    type: string;
    details: string;
  }[];
}

// Interface for export training button
export interface ExportTrainingButtonProps {
  trainingId: string;
  isTreinoDoDia?: boolean;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

// Interface for PageTitle component
export interface PageTitleProps {
  title?: string;
  children?: React.ReactNode;
}

// Interface for historical training data
export interface HistoricoTreinoPorAtleta {
  id: string; 
  treinoId: string;
  nomeTreino: string;
  data: string;
  local: string;
  presenca: boolean;
  justificativa?: string | null;
  treino_id?: string | null;
  treino_do_dia_id?: string | null;
  fundamentos: Array<{
    fundamento: string;
    acertos: number;
    erros: number;
  }>;
  // For compatibility with PerformanceTab 
  date?: string;
  type?: string;
  duration?: number;
  status?: 'completed' | 'missed' | 'partial';
}

// Adding missing Goal interface for PerformanceTab
export interface Goal {
  id: string;
  title: string;
  description: string;
  deadline: Date;
  targetDate?: string;
  progress: number;
  status?: 'achieved' | 'in_progress' | 'pending';
}

