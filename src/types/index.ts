
export type Team = "Masculino" | "Feminino";

export type TeamType = "Masculino" | "Feminino";

export type Position = 
  | "Levantador" 
  | "Oposto" 
  | "Ponteiro" 
  | "Central" 
  | "Líbero"
  | "Outro";

export interface Athlete {
  id: string;
  created_at: string;
  nome: string;  // Changed from 'name' to 'nome' to match DB schema
  idade: number; // Changed from 'age' to 'idade' to match DB schema
  altura: number; // Changed from 'height' to 'altura' to match DB schema
  posicao: string; // Changed from 'position' to 'posicao' to match DB schema
  time: Team;     // Changed from 'team' to 'time' to match DB schema
  foto_url: string | null;
}

// Interface para agregação de dados de desempenho
export interface AthletePerformance {
  atleta: Athlete;
  presenca: {
    total: number;
    presente: number;
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
        taxa: number;
      };
    };
  };
  ultimasAvaliacoes: Array<{
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
