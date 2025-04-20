
import { supabase } from '@/lib/supabase';
import { TeamType } from '@/types';

interface RankingResult {
  id: string;
  nome: string;
  percentualAcerto: number;
}

interface TeamStats {
  destaqueAtleta?: {
    nome: string;
    fundamento: string;
    evolucao: number;
  };
  piorFundamento?: {
    nome: string;
    media: number;
  };
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

export async function fetchTeamStats(
  team: TeamType,
  dateRange: { from: Date; to: Date }
): Promise<TeamStats> {
  try {
    // Get featured athlete
    const { data: destaque } = await supabase
      .from('destaques_atletas')
      .select(`
        atleta:atleta_id (nome),
        fundamento,
        percentual_evolucao
      `)
      .eq('time_type', team)
      .gte('semana_inicio', dateRange.from.toISOString())
      .lte('semana_fim', dateRange.to.toISOString())
      .order('percentual_evolucao', { ascending: false })
      .limit(1)
      .single();

    // Get worst performing foundation
    const { data: avaliacoes } = await supabase
      .from('avaliacoes_fundamento')
      .select(`
        fundamento,
        acertos,
        erros
      `)
      .gte('created_at', dateRange.from.toISOString())
      .lte('created_at', dateRange.to.toISOString());

    // Calculate foundation averages
    const fundamentoMedias = avaliacoes?.reduce((acc, av) => {
      if (!acc[av.fundamento]) {
        acc[av.fundamento] = { acertos: 0, total: 0 };
      }
      acc[av.fundamento].acertos += av.acertos;
      acc[av.fundamento].total += (av.acertos + av.erros);
      return acc;
    }, {} as Record<string, { acertos: number; total: number }>);

    let piorFundamento;
    if (fundamentoMedias) {
      const mediasArray = Object.entries(fundamentoMedias).map(([nome, stats]) => ({
        nome,
        media: (stats.acertos / stats.total) * 100
      }));
      piorFundamento = mediasArray.sort((a, b) => a.media - b.media)[0];
    }

    // Handle destaque properly with type checking
    const destaqueAtleta = destaque && destaque.atleta && typeof destaque.atleta === 'object' ? {
      nome: destaque.atleta.nome || 'Desconhecido',
      fundamento: destaque.fundamento,
      evolucao: destaque.percentual_evolucao
    } : undefined;

    return {
      destaqueAtleta,
      piorFundamento
    };
  } catch (error) {
    console.error('Error fetching team stats:', error);
    return {};
  }
}
