import { supabase } from '@/lib/supabase';

interface AvaliacaoInput {
  treino_do_dia_id: string;
  atleta_id: string;
  fundamento_id: string;
  acertos: number;
  erros: number;
}

export async function salvarAvaliacao(avaliacao: AvaliacaoInput) {
  try {
    // Primeiro, verificar se já existe uma avaliação para esta combinação
    const { data: avaliacaoExistente, error: buscaError } = await supabase
      .from('avaliacoes_fundamento')
      .select('*')
      .eq('treino_do_dia_id', avaliacao.treino_do_dia_id)
      .eq('atleta_id', avaliacao.atleta_id)
      .eq('fundamento_id', avaliacao.fundamento_id)
      .single();

    if (buscaError && buscaError.code !== 'PGRST116') {
      console.error('Erro ao buscar avaliação existente:', buscaError);
      throw buscaError;
    }

    if (avaliacaoExistente) {
      // Se existir, fazer UPDATE
      const { error: updateError } = await supabase
        .from('avaliacoes_fundamento')
        .update({
          acertos: avaliacao.acertos,
          erros: avaliacao.erros,
          updated_at: new Date().toISOString()
        })
        .eq('id', avaliacaoExistente.id);

      if (updateError) {
        console.error('Erro ao atualizar avaliação:', updateError);
        throw updateError;
      }

      console.log('Avaliação atualizada com sucesso');
      return { success: true, operation: 'update' };
    } else {
      // Se não existir, fazer INSERT
      const { error: insertError } = await supabase
        .from('avaliacoes_fundamento')
        .insert([{
          ...avaliacao,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (insertError) {
        console.error('Erro ao inserir avaliação:', insertError);
        throw insertError;
      }

      console.log('Avaliação inserida com sucesso');
      return { success: true, operation: 'insert' };
    }
  } catch (error) {
    console.error('Erro ao salvar avaliação:', error);
    throw error;
  }
}

export async function sincronizarAvaliacoesLocais() {
  try {
    // Buscar avaliações pendentes do localStorage
    const avaliacoesPendentes = JSON.parse(localStorage.getItem('avaliacoes_pendentes') || '[]');

    if (avaliacoesPendentes.length === 0) {
      console.log('Nenhuma avaliação pendente para sincronizar');
      return;
    }

    console.log(`Iniciando sincronização de ${avaliacoesPendentes.length} avaliações pendentes`);

    // Processar cada avaliação pendente
    for (const avaliacao of avaliacoesPendentes) {
      try {
        await salvarAvaliacao(avaliacao);
        console.log(`Avaliação sincronizada: ${avaliacao.atleta_id} - ${avaliacao.fundamento_id}`);
      } catch (error) {
        console.error(`Erro ao sincronizar avaliação: ${avaliacao.atleta_id} - ${avaliacao.fundamento_id}`, error);
        // Continuar com as próximas avaliações mesmo se uma falhar
      }
    }

    // Limpar avaliações sincronizadas do localStorage
    localStorage.removeItem('avaliacoes_pendentes');
    console.log('Sincronização concluída');

  } catch (error) {
    console.error('Erro ao sincronizar avaliações:', error);
    throw error;
  }
}

export function salvarAvaliacaoLocal(avaliacao: AvaliacaoInput) {
  try {
    // Buscar avaliações pendentes existentes
    const avaliacoesPendentes = JSON.parse(localStorage.getItem('avaliacoes_pendentes') || '[]');
    
    // Adicionar nova avaliação
    avaliacoesPendentes.push(avaliacao);
    
    // Salvar de volta no localStorage
    localStorage.setItem('avaliacoes_pendentes', JSON.stringify(avaliacoesPendentes));
    
    console.log('Avaliação salva localmente');
  } catch (error) {
    console.error('Erro ao salvar avaliação localmente:', error);
    throw error;
  }
} 