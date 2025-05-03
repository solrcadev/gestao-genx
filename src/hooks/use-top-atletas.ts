
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface TopAtleta {
  id: string;
  nome: string;
  posicao: string;
  time: string;
  desempenho: number;
  fundamento: string;
}

export function useTopAtletas(options: { 
  fundamento?: string; 
  timeType?: 'Masculino' | 'Feminino';
  limit?: number;
} = {}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [atletas, setAtletas] = useState<TopAtleta[]>([]);

  useEffect(() => {
    async function fetchTopAtletas() {
      try {
        setLoading(true);
        
        // Buscar atletas
        const { data: atletasData, error: atletasError } = await supabase
          .from('athletes')
          .select('id, nome, time')
          .eq('time', options.timeType || 'Masculino')
          .limit(options.limit || 10);
          
        if (atletasError) throw atletasError;
        
        // Aqui processaríamos os dados para calcular os top atletas
        // Mas para simplificar, vamos retornar dados simulados
        
        const processedData: TopAtleta[] = atletasData.map((atleta: any, index: number) => ({
          id: atleta.id,
          nome: atleta.nome,
          posicao: 'Levantador', // Simulado
          time: atleta.time,
          desempenho: 95 - index * 5, // Simulando pontuações decrescentes
          fundamento: options.fundamento || 'Ataque'
        }));
        
        setAtletas(processedData);
        
      } catch (err) {
        console.error('Erro ao buscar top atletas:', err);
        setError(err instanceof Error ? err : new Error('Erro desconhecido'));
      } finally {
        setLoading(false);
      }
    }
    
    fetchTopAtletas();
  }, [options.fundamento, options.timeType, options.limit]);
  
  return { atletas, loading, error };
}
