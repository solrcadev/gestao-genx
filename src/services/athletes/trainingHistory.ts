
import { supabase } from '@/lib/supabase';

export async function getTrainingHistory(studentId: string) {
  try {
    const { data, error } = await supabase
      .from('treinos')
      .select('id, nome, data, local')
      .eq('user_id', studentId)
      .order('data', { ascending: false });

    if (error) throw error;

    return data?.map(treino => ({
      id: treino.id,
      nome: treino.nome,
      data: treino.data,
      local: treino.local
    })) || [];

  } catch (error) {
    console.error('Error fetching training history:', error);
    return [];
  }
}
