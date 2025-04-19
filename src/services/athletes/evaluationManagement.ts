
import { supabase } from '@/lib/supabase';
import { AthleteEvaluation } from '@/types';

// Interface para filtros de avaliações
interface EvaluationFilters {
  atleta_id?: string;
  exercicio_id?: string;
  fundamento?: string;
  treino_id?: string;
  data_inicio?: string;
  data_fim?: string;
  tecnico_id?: string;
  nota_minima?: number;
  nota_maxima?: number;
}

// Função para buscar avaliações com filtros
export async function getAthletesEvaluations(filters: EvaluationFilters = {}, page = 0, pageSize = 10): Promise<{data: AthleteEvaluation[], count: number}> {
  try {
    // Iniciar a query base
    let query = supabase
      .from('avaliacoes_fundamento')
      .select(`
        *,
        atleta:atleta_id (id, nome, time, posicao),
        exercicio:exercicio_id (id, nome),
        treino:treino_id (id, nome, data)
      `, { count: 'exact' });
    
    // Aplicar filtros
    if (filters.atleta_id) {
      query = query.eq('atleta_id', filters.atleta_id);
    }
    
    if (filters.exercicio_id) {
      query = query.eq('exercicio_id', filters.exercicio_id);
    }
    
    if (filters.fundamento) {
      query = query.eq('fundamento', filters.fundamento);
    }
    
    if (filters.treino_id) {
      query = query.eq('treino_id', filters.treino_id);
    }
    
    if (filters.data_inicio && filters.data_fim) {
      query = query.gte('timestamp', filters.data_inicio)
                   .lte('timestamp', filters.data_fim);
    } else if (filters.data_inicio) {
      query = query.gte('timestamp', filters.data_inicio);
    } else if (filters.data_fim) {
      query = query.lte('timestamp', filters.data_fim);
    }
    
    // Ordenar por mais recente primeiro
    query = query.order('timestamp', { ascending: false })
                 .range(page * pageSize, (page + 1) * pageSize - 1);
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    // Calcular o percentual de acerto para cada avaliação
    const evaluationsWithPercent = data.map(eval => {
      const total = eval.acertos + eval.erros;
      const percentual_acerto = total > 0 ? (eval.acertos / total) * 100 : 0;
      
      return {
        ...eval,
        percentual_acerto
      };
    });
    
    return { 
      data: evaluationsWithPercent as unknown as AthleteEvaluation[], 
      count: count || 0 
    };
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    throw error;
  }
}

// Função para obter os detalhes de uma avaliação específica
export async function getEvaluationById(id: string): Promise<AthleteEvaluation | null> {
  try {
    const { data, error } = await supabase
      .from('avaliacoes_fundamento')
      .select(`
        *,
        atleta:atleta_id (id, nome, time, posicao),
        exercicio:exercicio_id (id, nome),
        treino:treino_id (id, nome, data)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    if (!data) return null;
    
    const total = data.acertos + data.erros;
    const percentual_acerto = total > 0 ? (data.acertos / total) * 100 : 0;
    
    return {
      ...data,
      percentual_acerto
    } as unknown as AthleteEvaluation;
  } catch (error) {
    console.error('Error fetching evaluation details:', error);
    return null;
  }
}

// Função para atualizar uma avaliação
export async function updateEvaluation(
  id: string, 
  data: { acertos?: number; erros?: number; timestamp?: string; tecnico_id?: string },
  tecnico_id: string
): Promise<boolean> {
  try {
    // Primeiro buscar os dados atuais para o histórico
    const { data: currentData } = await supabase
      .from('avaliacoes_fundamento')
      .select('acertos, erros')
      .eq('id', id)
      .single();
    
    if (!currentData) throw new Error('Avaliação não encontrada');
    
    // Registrar a mudança no histórico
    const { error: historyError } = await supabase
      .from('avaliacoes_historico')
      .insert({
        avaliacao_id: id,
        acertos_anterior: currentData.acertos,
        erros_anterior: currentData.erros,
        tecnico_id: tecnico_id,
        data_modificacao: new Date().toISOString()
      });
    
    if (historyError) throw historyError;
    
    // Atualizar os dados da avaliação
    const { error } = await supabase
      .from('avaliacoes_fundamento')
      .update(data)
      .eq('id', id);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error updating evaluation:', error);
    return false;
  }
}

// Função para excluir uma avaliação
export async function deleteEvaluation(id: string, tecnico_id: string): Promise<boolean> {
  try {
    // Registrar a exclusão
    const { error: logError } = await supabase
      .from('exclusoes_log')
      .insert({
        tabela: 'avaliacoes_fundamento',
        registro_id: id,
        usuario_id: tecnico_id,
        data_exclusao: new Date().toISOString()
      });
    
    if (logError) throw logError;
    
    // Excluir a avaliação
    const { error } = await supabase
      .from('avaliacoes_fundamento')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error deleting evaluation:', error);
    return false;
  }
}

// Função para buscar fundamentos disponíveis para filtro
export async function getFundamentos(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('avaliacoes_fundamento')
      .select('fundamento')
      .order('fundamento')
      .limit(100);
    
    if (error) throw error;
    
    // Extrair valores únicos
    const fundamentos = [...new Set(data.map(item => item.fundamento))];
    return fundamentos;
  } catch (error) {
    console.error('Error fetching fundamentos:', error);
    return [];
  }
}

// Função para buscar técnicos para filtro
export async function getTecnicos(): Promise<{id: string, nome: string}[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nome')
      .eq('role', 'coach')
      .order('nome');
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching tecnicos:', error);
    return [];
  }
}
