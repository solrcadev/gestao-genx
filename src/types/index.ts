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
