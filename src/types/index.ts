export type TeamType = "Masculino" | "Feminino";

export interface Athlete {
  id: string;
  nome: string;
  posicao: string;
  time?: TeamType;
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
