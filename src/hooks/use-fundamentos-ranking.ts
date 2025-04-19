
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { RankingItem, TeamType } from '@/types';

interface RankingFilters {
  team: TeamType;
  fundamento: string;
  startDate?: Date;
  endDate?: Date;
}

export function useFundamentosRanking({ team, fundamento, startDate, endDate }: RankingFilters) {
  return useQuery({
    queryKey: ['fundamentos-ranking', team, fundamento, startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('vw_fundamentos_ranking')
        .select('*')
        .eq('time', team)
        .eq('fundamento', fundamento);

      if (startDate) {
        query = query.gte('primeira_avaliacao', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('ultima_avaliacao', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data as RankingItem[];
    }
  });
}
