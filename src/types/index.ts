
export type Team = "Masculino" | "Feminino";

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
  name: string;
  age: number;
  height: number;
  position: string;
  team: Team;
  foto_url: string | null;
}
