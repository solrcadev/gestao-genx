
import { supabase } from '@/lib/supabase';
import { TeamType } from '@/types';

interface RankingResult {
  id: string;
  nome: string;
  percentualAcerto: number;
}

export async function fetchRankingByFundamento(
  fundamento: string,
  team: TeamType,
  dateRange: { from: Date; to: Date }
): Promise<RankingResult[]> {
  try {
    // Get all avaliacoes within the date range
    const { data: avaliacoes, error } = await supabase
      .from('avaliacoes_fundamento')
      .select(`
        *,
        atleta:atleta_id (
          id,
          nome,
          time
        )
      `)
      .eq('fundamento', fundamento)
      .gte('created_at', dateRange.from.toISOString())
      .lte('created_at', dateRange.to.toISOString());

    if (error) throw error;

    // Group by athlete and calculate percentages
    const athleteStats = new Map<string, { 
      id: string;
      nome: string;
      time: TeamType;
      acertos: number;
      total: number;
    }>();

    avaliacoes?.forEach(av => {
      if (!av.atleta || av.atleta.time !== team) return;

      const current = athleteStats.get(av.atleta_id) || {
        id: av.atleta_id,
        nome: av.atleta.nome,
        time: av.atleta.time,
        acertos: 0,
        total: 0
      };

      current.acertos += av.acertos;
      current.total += (av.acertos + av.erros);
      athleteStats.set(av.atleta_id, current);
    });

    // Convert to array and sort by percentage
    return Array.from(athleteStats.values())
      .map(stat => ({
        id: stat.id,
        nome: stat.nome,
        percentualAcerto: (stat.acertos / stat.total) * 100
      }))
      .sort((a, b) => b.percentualAcerto - a.percentualAcerto);

  } catch (error) {
    console.error('Error fetching ranking:', error);
    return [];
  }
}
