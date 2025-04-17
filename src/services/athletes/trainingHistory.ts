
import { supabase } from '@/lib/supabase';
import { HistoricoTreinoPorAtleta } from '@/services/performanceService';

export async function getHistoricoTreinoPorAtleta(atletaId: string): Promise<HistoricoTreinoPorAtleta[]> {
  try {
    const { data: treinosAtleta, error: treinosError } = await supabase
      .from('treinos_atletas')
      .select(`
        id,
        presente,
        justificativa_falta,
        observacoes,
        treino_id,
        treinos:treino_id (
          id, 
          nome, 
          data,
          local
        )
      `)
      .eq('atleta_id', atletaId)
      .order('created_at', { ascending: false });

    if (treinosError) throw treinosError;

    const { data: avaliacoes } = await supabase
      .from('avaliacoes_fundamento')
      .select('*')
      .eq('atleta_id', atletaId);

    const historico: HistoricoTreinoPorAtleta[] = (treinosAtleta || []).map(item => {
      // Safely access treinos object if it exists
      const treino = item.treinos || {};
      return {
        treinoId: item.treino_id,
        nomeTreino: treino.nome || 'Treino sem nome',
        data: treino.data || new Date().toISOString().split('T')[0],
        local: treino.local || 'Local não especificado',
        presenca: item.presente,
        justificativa: item.justificativa_falta,
        fundamentos: (avaliacoes || [])
          .filter(av => av.treino_id === item.treino_id)
          .map(av => ({
            fundamento: av.fundamento,
            acertos: av.acertos,
            erros: av.erros
          }))
      };
    });

    return historico.length > 0 ? historico : getMockHistoricoTreinos();
  } catch (error) {
    console.error('Error fetching training history:', error);
    return getMockHistoricoTreinos();
  }
}

function getMockHistoricoTreinos(): HistoricoTreinoPorAtleta[] {
  return [
    {
      treinoId: '1',
      nomeTreino: 'Treino Tático #1',
      data: '2023-04-10',
      local: 'Ginásio Principal',
      presenca: true,
      fundamentos: [
        { fundamento: 'saque', acertos: 8, erros: 2 },
        { fundamento: 'recepção', acertos: 12, erros: 3 }
      ]
    },
    {
      treinoId: '2',
      nomeTreino: 'Treino Físico',
      data: '2023-04-07',
      local: 'Quadra Externa',
      presenca: true,
      fundamentos: [
        { fundamento: 'bloqueio', acertos: 5, erros: 5 }
      ]
    },
    {
      treinoId: '3',
      nomeTreino: 'Treino Técnico',
      data: '2023-04-05',
      local: 'Academia',
      presenca: false,
      justificativa: 'Consulta médica agendada',
      fundamentos: []
    },
    {
      treinoId: '4',
      nomeTreino: 'Amistoso',
      data: '2023-04-01',
      local: 'Ginásio Visitante',
      presenca: true,
      fundamentos: [
        { fundamento: 'ataque', acertos: 15, erros: 4 },
        { fundamento: 'defesa', acertos: 7, erros: 3 },
        { fundamento: 'levantamento', acertos: 22, erros: 1 }
      ]
    }
  ];
}
