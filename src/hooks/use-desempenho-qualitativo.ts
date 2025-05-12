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
    media: number;
  }[];
}

// Interface para avaliação vinda do banco
interface AvaliacaoQualitativa {
  id: string;
  atleta_id: string;
  treino_id: string;
  fundamento: string;
  tipo_evento: string;
  peso: number;
  timestamp: string;
  observacoes?: string;
  origem?: string;
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
          .from('avaliacoes_fundamento')
          .select('*')
          .order('timestamp', { ascending: false });
          
        if (avaliacoesError) throw avaliacoesError;
        
        // Buscar atletas
        const { data: atletasData, error: atletasError } = await supabase
          .from('athletes')
          .select('id, nome, time, posicao')
          .order('nome');
          
        if (atletasError) throw atletasError;
        
        // Processar os dados para cada atleta
        const processedData: AtletaDesempenho[] = atletasData.map((atleta: any) => {
          // Filtrar avaliações para este atleta
          const avaliacoesAtleta = (avaliacoesData || []).filter(
            (av: AvaliacaoQualitativa) => av.atleta_id === atleta.id
          );
          
          // Se não houver avaliações, retornar atleta com array vazio de fundamentos
          if (avaliacoesAtleta.length === 0) {
            return {
              id: atleta.id,
              nome: atleta.nome,
              time: atleta.time,
              posicao: atleta.posicao,
              fundamentos: []
            };
          }
          
          // Agrupar avaliações por fundamento
          const avaliacoesPorFundamento: {
            [fundamento: string]: {
              total: number;
              positivas: number;
              negativas: number;
              somaPesos: number;
            }
          } = {};
          
          // Processar cada avaliação para este atleta
          avaliacoesAtleta.forEach((avaliacao: AvaliacaoQualitativa) => {
            const { fundamento, peso } = avaliacao;
            
            // Inicializar o objeto para este fundamento se não existir
            if (!avaliacoesPorFundamento[fundamento]) {
              avaliacoesPorFundamento[fundamento] = {
                total: 0,
                positivas: 0,
                negativas: 0,
                somaPesos: 0
              };
            }
            
            // Incrementar contadores
            avaliacoesPorFundamento[fundamento].total += 1;
            avaliacoesPorFundamento[fundamento].somaPesos += peso;
            
            if (peso > 0) {
              avaliacoesPorFundamento[fundamento].positivas += 1;
            } else if (peso < 0) {
              avaliacoesPorFundamento[fundamento].negativas += 1;
            }
          });
          
          // Converter dados agrupados para o formato de saída
          const fundamentos = Object.entries(avaliacoesPorFundamento).map(([fundamento, dados]) => {
            // Calcular eficiência como relação entre positivas e total
            const eficiencia = dados.total > 0 ? (dados.positivas / dados.total) * 100 : 0;
            
            // Calcular média dos pesos
            const media = dados.total > 0 ? dados.somaPesos / dados.total : 0;
            
            return {
              fundamento,
              eficiencia,
              total: dados.total,
              positivas: dados.positivas,
              negativas: dados.negativas,
              media
            };
          });
          
          // Ordenar por fundamento para consistência na exibição
          fundamentos.sort((a, b) => a.fundamento.localeCompare(b.fundamento));
          
          return {
            id: atleta.id,
            nome: atleta.nome,
            time: atleta.time,
            posicao: atleta.posicao,
            fundamentos
          };
        });
        
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
