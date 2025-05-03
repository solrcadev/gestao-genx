
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { TeamType } from '@/types';

export interface TopAtleta {
  id: string;
  nome: string;
  posicao: string;
  time: string;
  foto_url?: string;
  pontuacao: number;
  eficiencia: number;
  fundamento?: string;
}

/**
 * Fetch top athletes based on performance metrics
 * @param limit Number of athletes to fetch
 * @param team Team filter
 * @returns Query result with top athletes data
 */
export function useTopAtletas(limit: number = 10, team?: TeamType) {
  return useQuery({
    queryKey: ['top-atletas', limit, team],
    queryFn: async (): Promise<TopAtleta[]> => {
      try {
        let query = supabase
          .from('vw_fundamentos_ranking')
          .select(`
            atleta:atleta_id(id, nome, posicao, time, foto_url),
            fundamento,
            total_acertos,
            total_erros,
            eficiencia
          `)
          .order('eficiencia', { ascending: false })
          .limit(limit);
        
        if (team) {
          query = query.eq('atleta.time', team);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        return data.map((item: any) => ({
          id: item.atleta.id,
          nome: item.atleta.nome,
          posicao: item.atleta.posicao,
          time: item.atleta.time,
          foto_url: item.atleta.foto_url,
          pontuacao: item.total_acertos,
          eficiencia: item.eficiencia * 100,
          fundamento: item.fundamento
        }));
      } catch (error) {
        console.error('Error fetching top athletes:', error);
        throw error;
      }
    }
  });
}

/**
 * Fetch top athletes by specific fundamento
 * @param fundamento The specific fundamento to rank by
 * @param limit Number of athletes to fetch
 * @param team Optional team filter
 */
export function useTopAtletasByFundamento(fundamento: string, limit: number = 10, team?: TeamType) {
  return useQuery({
    queryKey: ['top-atletas-by-fundamento', fundamento, limit, team],
    queryFn: async (): Promise<TopAtleta[]> => {
      try {
        let query = supabase
          .from('vw_fundamentos_ranking')
          .select(`
            atleta:atleta_id(id, nome, posicao, time, foto_url),
            total_acertos,
            total_erros,
            eficiencia
          `)
          .eq('fundamento', fundamento)
          .order('eficiencia', { ascending: false })
          .limit(limit);
        
        if (team) {
          query = query.eq('atleta.time', team);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        return data.map((item: any) => ({
          id: item.atleta.id,
          nome: item.atleta.nome,
          posicao: item.atleta.posicao,
          time: item.atleta.time,
          foto_url: item.atleta.foto_url,
          pontuacao: item.total_acertos,
          eficiencia: item.eficiencia * 100,
          fundamento: fundamento
        }));
      } catch (error) {
        console.error(`Error fetching top athletes for ${fundamento}:`, error);
        throw error;
      }
    }
  });
}
