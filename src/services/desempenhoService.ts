import { supabase } from '@/lib/supabase';

export interface PerformanceData {
  data_ponto_tempo: string;
  metrica_desempenho: number;
  total_acertos: number;
  total_erros: number;
}

export interface UsageVolumeData {
  data_ponto_tempo: string;
  volume_uso_exercicio: number;
}

export interface CorrelacaoDados {
  data_ponto_tempo: string;
  metrica_desempenho: number;
  volume_uso_exercicio: number;
  total_acertos: number;
  total_erros: number;
}

export interface FiltroAnalise {
  fundamento: string;
  data_inicio?: Date;
  data_fim?: Date;
  genero_equipe?: string;
}

/**
 * Obtém a lista de todos os fundamentos técnicos disponíveis no sistema
 * @returns Array com nomes dos fundamentos técnicos
 */
export const obterTodosFundamentos = async (): Promise<string[]> => {
  try {
    // Tentar usar RPC, mas se falhar (404) usar fallback direto
    try {
      const { data, error } = await supabase
        .rpc('get_all_fundamentos_tecnicos');

      if (error) {
        console.error('Erro ao buscar fundamentos técnicos via RPC:', error);
        throw error;
      }

      // Extrair apenas os nomes dos fundamentos do resultado
      return (data || []).map((item: { fundamento: string }) => item.fundamento);
    } catch (rpcError) {
      console.error('Fallback: buscando fundamentos diretamente da tabela de avaliações');
      
      // Fallback: consultar fundamentos direto da tabela
      const { data, error } = await supabase
        .from('avaliacoes_fundamento')
        .select('fundamento')
        .order('fundamento');
        
      if (error) {
        throw error;
      }
      
      // Remover duplicatas
      const fundamentosUnicos = [...new Set(data.map(item => item.fundamento))];
      return fundamentosUnicos;
    }
  } catch (error) {
    console.error('Erro em obterTodosFundamentos:', error);
    // Fallback para fundamentos padrão caso ocorra um erro
    return [
      'Saque',
      'Recepção',
      'Levantamento',
      'Ataque',
      'Bloqueio',
      'Defesa',
      'Deslocamento',
      'Comunicação'
    ];
  }
};

/**
 * Obtém dados de tendência de desempenho para um fundamento específico
 * @param filtros Filtros a serem aplicados na consulta
 * @returns Dados de desempenho ao longo do tempo
 */
export const obterDadosDesempenho = async (filtros: FiltroAnalise): Promise<PerformanceData[]> => {
  try {
    try {
      const { data, error } = await supabase
        .rpc('get_performance_trend_por_fundamento', {
          p_fundamento_nome: filtros.fundamento,
          p_data_inicio: filtros.data_inicio?.toISOString().split('T')[0],
          p_data_fim: filtros.data_fim?.toISOString().split('T')[0],
          p_genero_equipe: filtros.genero_equipe
        });

      if (error) {
        console.error('Erro ao buscar dados de desempenho via RPC:', error);
        throw error;
      }

      return data || [];
    } catch (rpcError) {
      console.error('Fallback: buscando dados de desempenho diretamente', rpcError);
      
      // Implementação alternativa sem usar RPC
      // Construir consulta SQL equivalente
      let query = supabase
        .from('avaliacoes_fundamento')
        .select(`
          treino_id,
          acertos,
          erros,
          treinos!inner(data, time)
        `)
        .eq('fundamento', filtros.fundamento);
        
      if (filtros.data_inicio) {
        query = query.gte('treinos.data', filtros.data_inicio.toISOString().split('T')[0]);
      }
      
      if (filtros.data_fim) {
        query = query.lte('treinos.data', filtros.data_fim.toISOString().split('T')[0]);
      }
      
      if (filtros.genero_equipe && filtros.genero_equipe !== 'Todos') {
        query = query.eq('treinos.time', filtros.genero_equipe);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Erro ao buscar dados de desempenho com fallback:', error);
        return [];
      }
      
      // Processar dados para formato esperado
      // Agrupar por data
      const dadosPorData: Record<string, { acertos: number, erros: number }> = {};
      
      data.forEach(item => {
        if (item.treinos && typeof item.treinos === 'object' && 'data' in item.treinos) {
          const dataString = String(item.treinos.data);
          const data = new Date(dataString).toISOString().split('T')[0];
          
          if (!dadosPorData[data]) {
            dadosPorData[data] = { acertos: 0, erros: 0 };
          }
          
          dadosPorData[data].acertos += item.acertos || 0;
          dadosPorData[data].erros += item.erros || 0;
        }
      });
      
      // Converter para formato de retorno
      const resultado: PerformanceData[] = Object.keys(dadosPorData).map(data => {
        const { acertos, erros } = dadosPorData[data];
        const total = acertos + erros;
        const metrica = total > 0 ? (acertos / total) * 100 : 0;
        
        return {
          data_ponto_tempo: data,
          metrica_desempenho: metrica,
          total_acertos: acertos,
          total_erros: erros
        };
      });
      
      return resultado.sort((a, b) => 
        new Date(a.data_ponto_tempo).getTime() - new Date(b.data_ponto_tempo).getTime()
      );
    }
  } catch (error) {
    console.error('Erro em obterDadosDesempenho:', error);
    return [];
  }
};

/**
 * Obtém dados de volume de uso de exercícios para um fundamento específico
 * @param filtros Filtros a serem aplicados na consulta
 * @returns Dados de volume de uso ao longo do tempo
 */
export const obterDadosUsoExercicios = async (filtros: FiltroAnalise): Promise<UsageVolumeData[]> => {
  try {
    try {
      const { data, error } = await supabase
        .rpc('get_exercise_usage_volume_por_fundamento', {
          p_fundamento_nome: filtros.fundamento,
          p_data_inicio: filtros.data_inicio?.toISOString().split('T')[0],
          p_data_fim: filtros.data_fim?.toISOString().split('T')[0],
          p_genero_equipe: filtros.genero_equipe
        });

      if (error) {
        console.error('Erro ao buscar dados de uso de exercícios via RPC:', error);
        throw error;
      }

      return data || [];
    } catch (rpcError) {
      console.error('Fallback: buscando dados de uso de exercícios diretamente', rpcError);
      
      // Implementação alternativa sem usar RPC
      let query = supabase
        .from('treinos_exercicios')
        .select(`
          treino_id,
          exercicio_id,
          treinos!inner(data, time),
          exercicios!inner(fundamentos)
        `);
        
      if (filtros.data_inicio) {
        query = query.gte('treinos.data', filtros.data_inicio.toISOString().split('T')[0]);
      }
      
      if (filtros.data_fim) {
        query = query.lte('treinos.data', filtros.data_fim.toISOString().split('T')[0]);
      }
      
      if (filtros.genero_equipe && filtros.genero_equipe !== 'Todos') {
        query = query.eq('treinos.time', filtros.genero_equipe);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Erro ao buscar dados de uso com fallback:', error);
        return [];
      }
      
      // Filtrar exercícios com o fundamento selecionado
      const dadosFiltrados = data.filter(item => 
        item.exercicios && 
        typeof item.exercicios === 'object' &&
        'fundamentos' in item.exercicios &&
        Array.isArray(item.exercicios.fundamentos) && 
        item.exercicios.fundamentos.includes(filtros.fundamento)
      );
      
      // Agrupar por data e contar exercícios únicos
      const dadosPorData: Record<string, Set<string>> = {};
      
      dadosFiltrados.forEach(item => {
        if (item.treinos && typeof item.treinos === 'object' && 'data' in item.treinos) {
          const dataString = String(item.treinos.data);
          const data = new Date(dataString).toISOString().split('T')[0];
          
          if (!dadosPorData[data]) {
            dadosPorData[data] = new Set();
          }
          
          dadosPorData[data].add(item.exercicio_id);
        }
      });
      
      // Converter para formato de retorno
      const resultado: UsageVolumeData[] = Object.keys(dadosPorData).map(data => {
        return {
          data_ponto_tempo: data,
          volume_uso_exercicio: dadosPorData[data].size
        };
      });
      
      return resultado.sort((a, b) => 
        new Date(a.data_ponto_tempo).getTime() - new Date(b.data_ponto_tempo).getTime()
      );
    }
  } catch (error) {
    console.error('Erro em obterDadosUsoExercicios:', error);
    return [];
  }
};

/**
 * Combina os dados de desempenho e uso de exercícios para análise de correlação
 * @param dadosDesempenho Dados de desempenho por fundamento
 * @param dadosUso Dados de uso de exercícios por fundamento
 * @returns Dados combinados para visualização de correlação
 */
export const combinarDadosCorrelacao = (
  dadosDesempenho: PerformanceData[],
  dadosUso: UsageVolumeData[]
): CorrelacaoDados[] => {
  // Criar um mapa dos dados de desempenho para facilitar a busca por data
  const mapaDesempenho = new Map<string, PerformanceData>();
  dadosDesempenho.forEach(item => {
    mapaDesempenho.set(item.data_ponto_tempo, item);
  });

  // Criar um mapa dos dados de uso para facilitar a busca por data
  const mapaUso = new Map<string, UsageVolumeData>();
  dadosUso.forEach(item => {
    mapaUso.set(item.data_ponto_tempo, item);
  });

  // Obter todas as datas únicas de ambos os conjuntos de dados
  const todasDatas = new Set([
    ...dadosDesempenho.map(item => item.data_ponto_tempo),
    ...dadosUso.map(item => item.data_ponto_tempo)
  ]);

  // Combinar os dados para cada data
  const dadosCombinados: CorrelacaoDados[] = [];

  todasDatas.forEach(data => {
    const desempenho = mapaDesempenho.get(data);
    const uso = mapaUso.get(data);

    dadosCombinados.push({
      data_ponto_tempo: data,
      metrica_desempenho: desempenho?.metrica_desempenho || 0,
      volume_uso_exercicio: uso?.volume_uso_exercicio || 0,
      total_acertos: desempenho?.total_acertos || 0,
      total_erros: desempenho?.total_erros || 0
    });
  });

  // Ordenar por data
  return dadosCombinados.sort((a, b) => 
    new Date(a.data_ponto_tempo).getTime() - new Date(b.data_ponto_tempo).getTime()
  );
};

/**
 * Formata uma data para exibição em formato local
 * @param dataStr String de data no formato 'YYYY-MM-DD'
 * @returns Data formatada em formato local (DD/MM/YYYY)
 */
export const formatarData = (dataStr: string): string => {
  try {
    const data = new Date(dataStr);
    return new Intl.DateTimeFormat('pt-BR').format(data);
  } catch (error) {
    return dataStr;
  }
}; 