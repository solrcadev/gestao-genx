
import { supabase } from "@/lib/supabase";
import { HistoricoTreinoPorAtleta } from "@/types";

export const getHistoricoTreinoPorAtleta = async (atletaId: string): Promise<HistoricoTreinoPorAtleta[]> => {
  try {
    // Busca registros de presença para o atleta específico
    const { data: presencasData, error: presencasError } = await supabase
      .from('treinos_presencas')
      .select(`
        *,
        treino_do_dia:treino_do_dia_id(
          *,
          treino:treino_id(*)
        )
      `)
      .eq('atleta_id', atletaId)
      .order('created_at', { ascending: false });

    if (presencasError) {
      throw new Error(`Erro ao buscar presenças: ${presencasError.message}`);
    }

    // Se não há dados de presença, retornar array vazio
    if (!presencasData || presencasData.length === 0) {
      return [];
    }

    // Mapear os dados de presença para o formato esperado
    const historico = presencasData.map(presenca => {
      // Certifique-se que treino existe e possui os campos esperados
      const treino = presenca.treino_do_dia?.treino || {};
      
      return {
        id: presenca.id,
        data: treino.data || new Date().toISOString().split('T')[0],
        nome_treino: treino.nome || "Treino sem nome",
        local: treino.local || "Local não especificado",
        presente: presenca.presente,
        justificativa: presenca.justificativa || null,
        treino_id: treino.id || null,
        treino_do_dia_id: presenca.treino_do_dia_id,
      };
    });

    return historico;
  } catch (error) {
    console.error('Erro ao buscar histórico de treinos:', error);
    throw error;
  }
};
