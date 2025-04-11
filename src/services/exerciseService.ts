
import { supabase } from '@/lib/supabase';

export interface Exercise {
  id: string;
  nome: string;
  categoria: string;
  tempo_estimado: number;
  numero_jogadores: number;
  objetivo: string;
  descricao: string;
  video_url?: string;
  imagem_url?: string;
}

export interface ExerciseInput {
  nome: string;
  categoria: string;
  tempo_estimado: number;
  numero_jogadores: number;
  objetivo: string;
  descricao: string;
  video_url?: string;
  imagem_url?: string;
}

export const fetchExercises = async (): Promise<Exercise[]> => {
  const { data, error } = await supabase
    .from('exercicios')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching exercises:', error);
    throw new Error(error.message);
  }

  return data || [];
};

export const fetchExerciseById = async (id: string): Promise<Exercise> => {
  const { data, error } = await supabase
    .from('exercicios')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching exercise with ID ${id}:`, error);
    throw new Error(error.message);
  }

  return data;
};

export const createExercise = async (exercise: ExerciseInput): Promise<Exercise> => {
  const { data, error } = await supabase
    .from('exercicios')
    .insert([exercise])
    .select()
    .single();

  if (error) {
    console.error('Error creating exercise:', error);
    throw new Error(error.message);
  }

  return data;
};

export const updateExercise = async ({ id, ...exercise }: Exercise): Promise<Exercise> => {
  const { data, error } = await supabase
    .from('exercicios')
    .update(exercise)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating exercise with ID ${id}:`, error);
    throw new Error(error.message);
  }

  return data;
};

export const deleteExercise = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('exercicios')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Error deleting exercise with ID ${id}:`, error);
    throw new Error(error.message);
  }
};
