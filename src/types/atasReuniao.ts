// Tipos para Atas de Reunião

// Define a estrutura de um tópico discutido
export interface TopicoDaAta {
  id?: string;
  descricao: string;
}

// Define a estrutura de uma decisão tomada
export interface DecisaoDaAta {
  id?: string;
  descricao: string;
  responsavel?: string;
}

// Define a estrutura principal da ata de reunião
export interface AtaReuniao {
  id?: string;
  titulo: string;
  data: string | Date;
  participantes: string[];
  topicos: TopicoDaAta[];
  decisoes: DecisaoDaAta[];
  observacoes?: string;
  responsavelRegistro?: string;
  created_at?: string;
  updated_at?: string;
}

// Interface para visualização resumida de atas na listagem
export interface AtaReuniaoResumida {
  id: string;
  titulo: string;
  data: string;
  participantes: string[];
  quantidadeTopicos: number;
  quantidadeDecisoes: number;
}

// Interface para os filtros de busca de atas
export interface FiltroAtasReuniao {
  titulo?: string;
  dataInicio?: string;
  dataFim?: string;
  participante?: string;
}

export interface ResumoAtas {
  totalAtas: number;
  totalParticipantes: number;
  totalTopicos: number;
  totalDecisoes: number;
}

// Para futuras implementações (comentados):
/*
export interface TarefaDeAta {
  id?: string;
  descricao: string;
  responsavel: string;
  prazo: string | Date;
  concluida: boolean;
  ata_id: string;
}

export interface NotificacaoAta {
  id?: string;
  ata_id: string;
  usuario_id: string;
  lida: boolean;
  tipo: 'nova_ata' | 'tarefa_atribuida' | 'prazo_decisao';
  created_at?: string;
}
*/ 