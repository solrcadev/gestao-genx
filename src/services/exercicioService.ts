import { supabase } from '@/lib/supabase';

export const fetchExerciciosByTrainingId = async (trainingId: string) => {
  try {
    const { data, error } = await supabase
      .from('treinos_exercicios')
      .select(`
        *,
        exercicio:exercicio_id(*)
      `)
      .eq('treino_id', trainingId)
      .order('ordem', { ascending: true });

    if (error) {
      console.error('Error fetching exercises for training:', error);
      throw new Error('Erro ao buscar exercícios do treino: ' + error.message);
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchExerciciosByTrainingId:', error);
    throw error;
  }
}; 