import { supabase } from '@/lib/supabase';

interface AvaliacaoData {
  atleta_id?: string;
  exercicio_id?: string;
  treino_id: string;
  fundamento: string;
  acertos: number;
  erros: number;
  timestamp: string;
  precisaAprovacao?: boolean;
  monitor_id?: string;
}

export async function registrarAvaliacaoDesempenho(data: AvaliacaoData) {
  try {
    // Validate that either atleta_id or exercicio_id is provided
    if (!data.atleta_id && !data.exercicio_id) {
      throw new Error('Avaliação precisa ter um atleta_id ou exercicio_id');
    }

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

export async function getAvaliacoesParaAprovar() {
  try {
    const { data, error } = await supabase
      .from('avaliacoes_fundamento')
      .select(`
        id,
        atleta_id,
        treino_id,
        fundamento,
        acertos,
        erros,
        timestamp,
        precisaAprovacao,
        monitor_id,
        atleta:atleta_id(nome, time, posicao),
        monitor:monitor_id(nome, email)
      `)
      .eq('precisaAprovacao', true);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching evaluations for approval:', error);
    throw error;
  }
}

export async function aprovarAvaliacao(avaliacaoId: string) {
  try {
    const { error } = await supabase
      .from('avaliacoes_fundamento')
      .update({ precisaAprovacao: false })
      .eq('id', avaliacaoId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error approving evaluation:', error);
    throw error;
  }
}

export async function rejeitarAvaliacao(avaliacaoId: string) {
  try {
    const { error } = await supabase
      .from('avaliacoes_fundamento')
      .delete()
      .eq('id', avaliacaoId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error rejecting evaluation:', error);
    throw error;
  }
}
