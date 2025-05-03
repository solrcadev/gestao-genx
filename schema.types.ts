
export interface Athlete {
  id: string;
  nome: string;
  posicao: string;
  time: TeamType;
  idade: number;
  altura: number;
  foto_url?: string | null;
  imagem_url?: string | null;
  created_at?: string;
  updated_at?: string;
  email?: string | null;
  telefone?: string | null;
  access_status?: string;
  user_id?: string | null;
}

export type TeamType = 'Masculino' | 'Feminino';

export interface Profile {
  id: string;
  user_id?: string;
  atleta_id?: string;
  status: string;
  funcao: string;
  role?: string;
}

export interface AthletePerformance {
  atleta: {
    id: string;
    nome: string;
    posicao: string;
    time: TeamType;
    foto_url: string | null;
    created_at: string;
    idade: number;
    altura: number;
    email: string | null;
    access_status?: string;
  };
  presenca: {
    total: number;
    presentes: number;
    percentual: number;
  };
  avaliacoes: {
    total: number;
    mediaNota: number;
    porFundamento: Record<string, {
      percentualAcerto: number;
      total: number;
      acertos: number;
      erros: number;
      ultimaData?: string;
    }>;
  };
  ultimasAvaliacoes?: Array<{
    data: string;
    treino: string;
    fundamento: string;
    acertos: number;
    erros: number;
  }>;
}

export interface TopAtleta {
  id: string;
  nome: string;
  percentual: number;
  totalExecucoes: number;
  posicao: string;
  time: TeamType;
  pontuacao: number;
  foto_url?: string | null;
}

export interface PerformanceData {
  frequency: number;
  evolution: number;
  completedTrainings: number;
  totalTrainings: number;
  goalsAchieved: number;
  totalGoals: number;
}

export interface TrainingHistory {
  id: string;
  date: string;
  type: string;
  duration: number;
  status: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  progress: number;
  status: 'achieved' | 'in_progress' | 'pending';
}

export interface HistoricoTreinoPorAtleta {
  treinoId: string;
  nomeTreino: string;
  data: string;
  local: string;
  presenca: boolean;
  justificativa?: string;
  fundamentos: {
    fundamento: string;
    pontuacao: number;
    totalEventos: number;
    acertos: number;
    erros: number;
  }[];
}

// Interface para o tipo de histórico de treino usado internamente no componente
export interface HistoricoTreino {
  id: string;
  nome: string;
  data: string;
  dataFormatada: string;
  avaliacoes: {
    fundamento: string;
    acertos: number;
    erros: number;
    eficiencia: number;
  }[];
  eficienciaGeral?: number;
  treinoId: string;
  nomeTreino: string;
  local: string;
  presenca: boolean;
  justificativa?: string;
  fundamentos: {
    fundamento: string;
    pontuacao: number;
    totalEventos: number;
    acertos: number;
    erros: number;
  }[];
}

export interface ResumoAtas {
  totalAtas: number;
  atasRecentes: Array<{
    id: string;
    titulo: string;
    data: string;
    participantes: string[];
  }>;
  ultimaReuniaoData: string;
  mediaParticipantesReuniao: number;
  mediaTopicosReuniao: number;
  slice?: () => ResumoAtas['atasRecentes'];
}

export interface TopicoDaAta {
  id: string;
  descricao: string;
  responsavel: string;
  status: string;
  titulo?: string;
}

export interface DecisaoDaAta {
  id: string;
  descricao: string;
  responsavel: string;
  prazo: string;
  titulo?: string;
}

export interface AtaReuniao {
  id: string;
  titulo: string;
  data: string;
  participantes: string[];
  topicos: TopicoDaAta[];
  decisoes: DecisaoDaAta[];
}

export interface RankingFundamentosProps {
  performanceData: AthletePerformance[];
  team: TeamType;
}
