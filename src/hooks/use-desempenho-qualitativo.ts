
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { TeamType } from '@/types';

// Interface para os dados resumidos de avaliação qualitativa por atleta
export interface DesempenhoQualitativoAtleta {
  atletaId: string;
  nome: string;
  time: string;
  posicao: string;
  mediasQualitativas: {
    [fundamento: string]: {
      media: number;
      totalExecucoes: number;
      ultimaData: string;
    }
  };
  mediaGeral: number;
  totalAvaliacoes: number;
}

/**
 * Hook para buscar dados de desempenho qualitativo filtrados por time
 */
export function useDesempenhoQualitativo(
  time: TeamType,
  dataInicio?: Date,
  dataFim?: Date
) {
  return useQuery({
    queryKey: ['desempenho-qualitativo', time, dataInicio, dataFim],
    queryFn: async () => {
      try {
        // Montar query base
        let query = supabase
          .from('avaliacoes_eventos_qualificados')
          .select(`
            id,
            atleta_id,
            atleta:athletes!inner(id, nome, time, posicao),
            fundamento,
            tipo_evento,
            peso,
            timestamp
          `)
          .eq('atleta.time', time);

        // Aplicar filtros de data se fornecidos
        if (dataInicio) {
          query = query.gte('timestamp', dataInicio.toISOString());
        }
        if (dataFim) {
          // Adicionar 1 dia para incluir todo o dia final
          const fimAjustado = new Date(dataFim);
          fimAjustado.setDate(fimAjustado.getDate() + 1);
          query = query.lt('timestamp', fimAjustado.toISOString());
        }

        // Executar a consulta
        const { data, error } = await query;

        if (error) throw error;

        // Processar os dados agrupando por atleta e fundamento
        const atletasMap: Record<string, DesempenhoQualitativoAtleta> = {};

        data.forEach(evento => {
          const atletaId = evento.atleta_id;
          const atleta = evento.atleta;
          const fundamento = evento.fundamento;
          const peso = evento.peso;
          const timestamp = evento.timestamp;

          // Inicializar atleta se não existir
          if (!atletasMap[atletaId]) {
            atletasMap[atletaId] = {
              atletaId,
              nome: atleta.nome,
              time: atleta.time,
              posicao: atleta.posicao,
              mediasQualitativas: {},
              mediaGeral: 0,
              totalAvaliacoes: 0
            };
          }

          // Inicializar fundamento se não existir
          if (!atletasMap[atletaId].mediasQualitativas[fundamento]) {
            atletasMap[atletaId].mediasQualitativas[fundamento] = {
              media: 0,
              totalExecucoes: 0,
              ultimaData: ''
            };
          }

          const dadosFundamento = atletasMap[atletaId].mediasQualitativas[fundamento];

          // Atualizar dados do fundamento
          dadosFundamento.media = 
            (dadosFundamento.media * dadosFundamento.totalExecucoes + peso) / 
            (dadosFundamento.totalExecucoes + 1);
          dadosFundamento.totalExecucoes += 1;
          
          // Atualizar última data se for mais recente
          if (!dadosFundamento.ultimaData || new Date(timestamp) > new Date(dadosFundamento.ultimaData)) {
            dadosFundamento.ultimaData = timestamp;
          }

          // Incrementar total de avaliações
          atletasMap[atletaId].totalAvaliacoes += 1;
        });

        // Calcular média geral para cada atleta
        Object.values(atletasMap).forEach(atleta => {
          const fundamentos = Object.values(atleta.mediasQualitativas);
          
          if (fundamentos.length > 0) {
            // Média das médias de cada fundamento
            atleta.mediaGeral = fundamentos.reduce((sum, fund) => sum + fund.media, 0) / fundamentos.length;
            
            // Normalizar a média para uma escala de 0-100%
            // Considerando que os pesos variam de -3 a +3
            atleta.mediaGeral = ((atleta.mediaGeral + 3) / 6) * 100;
          }
        });

        // Converter para array e ordenar por média geral
        return Object.values(atletasMap)
          .sort((a, b) => b.mediaGeral - a.mediaGeral);
      } catch (error) {
        console.error('Erro ao buscar dados de desempenho qualitativo:', error);
        throw error;
      }
    }
  });
}
