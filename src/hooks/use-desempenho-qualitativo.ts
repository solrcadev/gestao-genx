
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface AtletaDesempenho {
  id: string;
  nome: string;
  time: string;
  posicao: string;
  fundamentos: {
    fundamento: string;
    eficiencia: number;
    total: number;
    positivas: number;
    negativas: number;
  }[];
}

export function useDesempenhoQualitativo(options = {}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [desempenho, setDesempenho] = useState<AtletaDesempenho[]>([]);

  useEffect(() => {
    async function fetchDesempenho() {
      try {
        setLoading(true);
        
        // Buscar avaliações qualitativas
        const { data: avaliacoesData, error: avaliacoesError } = await supabase
          .from('avaliacoes_eventos_qualificados')
          .select('*')
          .order('timestamp', { ascending: false });
          
        if (avaliacoesError) throw avaliacoesError;
        
        // Buscar atletas
        const { data: atletasData, error: atletasError } = await supabase
          .from('athletes')
          .select('id, nome, time, posicao')
          .order('nome');
          
        if (atletasError) throw atletasError;
        
        // Processar os dados
        // Aqui processaríamos os dados para calcular as eficiências, etc.
        // Mas para simplificar, vamos apenas retornar uma estrutura vazia
        
        const processedData: AtletaDesempenho[] = atletasData.map((atleta: any) => ({
          id: atleta.id,
          nome: atleta.nome,
          time: atleta.time,
          posicao: atleta.posicao,
          fundamentos: []
        }));
        
        setDesempenho(processedData);
        
      } catch (err) {
        console.error('Erro ao buscar desempenho qualitativo:', err);
        setError(err instanceof Error ? err : new Error('Erro desconhecido'));
      } finally {
        setLoading(false);
      }
    }
    
    fetchDesempenho();
  }, []);
  
  return { desempenho, loading, error };
}
