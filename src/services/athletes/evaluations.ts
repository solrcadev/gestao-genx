
import { supabase } from '@/lib/supabase';

interface AvaliacaoData {
  atleta_id: string;
  treino_id: string;
  fundamento: string;
  acertos: number;
  erros: number;
  timestamp: string;
}

export async function registrarAvaliacaoDesempenho(data: AvaliacaoData) {
  try {
    const { error } = await supabase
      .from('avaliacoes_fundamento')
      .insert([data]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error registering evaluation:', error);
    throw error;
  }
}
