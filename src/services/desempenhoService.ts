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
    const { data, error } = await supabase
      .rpc('get_all_fundamentos_tecnicos');

    if (error) {
      console.error('Erro ao buscar fundamentos técnicos:', error);
      throw new Error(error.message);
    }

    // Extrair apenas os nomes dos fundamentos do resultado
    return (data || []).map((item: { fundamento: string }) => item.fundamento);
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
    const { data, error } = await supabase
      .rpc('get_performance_trend_por_fundamento', {
        p_fundamento_nome: filtros.fundamento,
        p_data_inicio: filtros.data_inicio?.toISOString().split('T')[0],
        p_data_fim: filtros.data_fim?.toISOString().split('T')[0],
        p_genero_equipe: filtros.genero_equipe
      });

    if (error) {
      console.error('Erro ao buscar dados de desempenho:', error);
      throw new Error(error.message);
    }

    return data || [];
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
    const { data, error } = await supabase
      .rpc('get_exercise_usage_volume_por_fundamento', {
        p_fundamento_nome: filtros.fundamento,
        p_data_inicio: filtros.data_inicio?.toISOString().split('T')[0],
        p_data_fim: filtros.data_fim?.toISOString().split('T')[0],
        p_genero_equipe: filtros.genero_equipe
      });

    if (error) {
      console.error('Erro ao buscar dados de uso de exercícios:', error);
      throw new Error(error.message);
    }

    return data || [];
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