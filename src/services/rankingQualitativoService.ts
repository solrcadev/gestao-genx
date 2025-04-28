import { supabase } from '@/lib/supabase';
import { TeamType } from '@/types';
import { buscarEventosQualificados } from './avaliacaoQualitativaService';

// Interface para avaliação qualitativa por atleta e fundamento
export interface AvaliacaoQualitativa {
  atleta_id: string;
  atleta_nome: string;
  time: TeamType;
  fundamento: string;
  media_peso: number;
  total_avaliacoes: number;
  avaliacoes_positivas: number;
  avaliacoes_negativas: number;
  ultima_avaliacao: string;
  avaliacao_qualitativa: string;
  nota_percentual: number;
}

// Interface para o resultado do ranking combinado
export interface RankingCombinado {
  atleta_id: string;
  atleta_nome: string;
  percentual_quantitativo: number;
  nota_qualitativa: number;
  score_total: number;
  total_execucoes: number;
  total_avaliacoes_qualitativas: number;
  avaliacao_descritiva: string;
}

// Pesos configuráveis para a fórmula de ranking
export interface PesosRanking {
  quantitativo: number;
  qualitativo: number;
}

// Pesos padrão (70% quantitativo, 30% qualitativo)
export const PESOS_PADRAO: PesosRanking = {
  quantitativo: 0.7,
  qualitativo: 0.3
};

// Função para buscar avaliações qualitativas 
export async function buscarAvaliacoesQualitativas(
  time: TeamType,
  fundamento?: string,
  filtrarPorDataInicio?: string,
  filtrarPorDataFim?: string
): Promise<AvaliacaoQualitativa[]> {
  try {
    console.log(`Buscando avaliações qualitativas para time ${time}, fundamento: ${fundamento || 'todos'}`);
    
    // Como a view pode não existir ainda, vamos obter os dados diretamente da tabela de eventos qualificados
    const eventos = await buscarEventosQualificados({
      fundamento: fundamento?.toLowerCase() === 'passe' ? 'recepção' : fundamento,
      data_inicio: filtrarPorDataInicio,
      data_fim: filtrarPorDataFim
    });
    
    console.log(`Encontrados ${eventos.length} eventos qualificados`);
    
    if (eventos.length === 0) {
      return [];
    }
    
    // Primeiro, precisamos obter a informação dos atletas
    const atletas = new Map<string, { id: string, nome: string, time: TeamType }>();
    
    // Obter todos os IDs de atletas dos eventos
    const atletaIds = [...new Set(eventos.map(e => e.atleta_id))];
    
    // Buscar informações dos atletas do banco
    const { data: athletesData, error } = await supabase
      .from('athletes')
      .select('id, nome, time')
      .in('id', atletaIds);
    
    if (error) {
      console.error("Erro ao buscar atletas:", error);
      return [];
    }
    
    // Filtrar apenas atletas do time especificado
    const atletasDoTime = athletesData?.filter(a => a.time === time) || [];
    
    // Mapear atletas por ID para fácil acesso
    atletasDoTime.forEach(a => {
      atletas.set(a.id, { 
        id: a.id, 
        nome: a.nome, 
        time: a.time 
      });
    });
    
    // Agrupar eventos por atleta e fundamento
    const eventosPorAtletaEFundamento = new Map<string, Map<string, {
      eventos: typeof eventos,
      media_peso: number,
      total: number,
      positivos: number,
      negativos: number,
      ultimaData: string
    }>>();
    
    // Processar cada evento
    eventos.forEach(evento => {
      const atletaId = evento.atleta_id;
      const fundamento = evento.fundamento;
      
      // Verificar se o atleta pertence ao time selecionado
      if (!atletas.has(atletaId)) return;
      
      // Inicializar mapa para o atleta se necessário
      if (!eventosPorAtletaEFundamento.has(atletaId)) {
        eventosPorAtletaEFundamento.set(atletaId, new Map());
      }
      
      const fundamentosDoAtleta = eventosPorAtletaEFundamento.get(atletaId)!;
      
      // Inicializar dados do fundamento se necessário
      if (!fundamentosDoAtleta.has(fundamento)) {
        fundamentosDoAtleta.set(fundamento, {
          eventos: [],
          media_peso: 0,
          total: 0,
          positivos: 0,
          negativos: 0,
          ultimaData: ''
        });
      }
      
      const dadosFundamento = fundamentosDoAtleta.get(fundamento)!;
      
      // Adicionar evento à lista
      dadosFundamento.eventos.push(evento);
      dadosFundamento.total++;
      
      // Contar eventos positivos e negativos
      if (evento.peso > 0) dadosFundamento.positivos++;
      if (evento.peso < 0) dadosFundamento.negativos++;
      
      // Atualizar última data
      const eventoData = evento.timestamp || evento.created_at || '';
      if (!dadosFundamento.ultimaData || eventoData > dadosFundamento.ultimaData) {
        dadosFundamento.ultimaData = eventoData;
      }
    });
    
    // Calcular médias e converter para o formato AvaliacaoQualitativa
    const resultado: AvaliacaoQualitativa[] = [];
    
    eventosPorAtletaEFundamento.forEach((fundamentosMap, atletaId) => {
      const atleta = atletas.get(atletaId);
      if (!atleta) return;
      
      fundamentosMap.forEach((dados, fundamento) => {
        // Se estamos filtrando por fundamento e não é o selecionado, pular
        if (fundamento && 
            fundamento !== fundamento && 
            !(fundamento.toLowerCase() === 'recepção' && fundamento?.toLowerCase() === 'passe')) {
          return;
        }
        
        // Calcular média de peso
        const somasPesos = dados.eventos.reduce((soma, e) => soma + e.peso, 0);
        const mediaPeso = dados.total > 0 ? somasPesos / dados.total : 0;
        
        // Calcular nota percentual
        // Considerando que os pesos variam de -2.0 a 3.0 (amplitude de 5.0)
        // Fórmula: ((Peso + 2.0) / 5.0) * 100
        const notaPercentual = Math.max(0, Math.min(100, ((mediaPeso + 2.0) / 5.0) * 100));
        
        // Definir avaliação qualitativa
        let avaliacaoQualitativa = 'Regular';
        if (mediaPeso >= 2.5) avaliacaoQualitativa = 'Excelente';
        else if (mediaPeso >= 1.5) avaliacaoQualitativa = 'Muito Bom';
        else if (mediaPeso >= 0.5) avaliacaoQualitativa = 'Bom';
        else if (mediaPeso >= -0.5) avaliacaoQualitativa = 'Regular';
        else if (mediaPeso >= -1.5) avaliacaoQualitativa = 'Ruim';
        else avaliacaoQualitativa = 'Muito Ruim';
        
        resultado.push({
          atleta_id: atletaId,
          atleta_nome: atleta.nome,
          time: atleta.time,
          fundamento,
          media_peso: mediaPeso,
          total_avaliacoes: dados.total,
          avaliacoes_positivas: dados.positivos,
          avaliacoes_negativas: dados.negativos,
          ultima_avaliacao: dados.ultimaData,
          avaliacao_qualitativa: avaliacaoQualitativa,
          nota_percentual: notaPercentual
        });
      });
    });
    
    console.log(`Processadas ${resultado.length} avaliações qualitativas`);
    return resultado;
  } catch (erro) {
    console.error('Exceção ao buscar avaliações qualitativas:', erro);
    return [];
  }
}

// Função para calcular a média de avaliações qualitativas para um atleta
export function calcularMediaQualitativaPorAtleta(
  avaliacoes: AvaliacaoQualitativa[]
): { [atletaId: string]: { mediaTotal: number, totalAvaliacoes: number, avaliacaoDescritiva: string } } {
  if (!avaliacoes || avaliacoes.length === 0) {
    return {};
  }
  
  const mediasPorAtleta: { 
    [atletaId: string]: { 
      somaNotas: number, 
      totalFundamentos: number, 
      totalAvaliacoes: number,
      avaliacaoDescritiva: string
    } 
  } = {};
  
  // Agrupar por atleta e calcular média
  avaliacoes.forEach(avaliacao => {
    if (!avaliacao || !avaliacao.atleta_id) return;
    
    if (!mediasPorAtleta[avaliacao.atleta_id]) {
      mediasPorAtleta[avaliacao.atleta_id] = {
        somaNotas: 0,
        totalFundamentos: 0,
        totalAvaliacoes: 0,
        avaliacaoDescritiva: ''
      };
    }
    
    // Verificar se a nota percentual é válida
    if (typeof avaliacao.nota_percentual === 'number' && !isNaN(avaliacao.nota_percentual)) {
      mediasPorAtleta[avaliacao.atleta_id].somaNotas += avaliacao.nota_percentual;
      mediasPorAtleta[avaliacao.atleta_id].totalFundamentos++;
    }
    
    if (typeof avaliacao.total_avaliacoes === 'number') {
      mediasPorAtleta[avaliacao.atleta_id].totalAvaliacoes += avaliacao.total_avaliacoes;
    }
  });
  
  // Calcular média final e determinar avaliação descritiva
  const result: { [atletaId: string]: { mediaTotal: number, totalAvaliacoes: number, avaliacaoDescritiva: string } } = {};
  
  Object.entries(mediasPorAtleta).forEach(([atletaId, dados]) => {
    const mediaTotal = dados.totalFundamentos > 0 
      ? dados.somaNotas / dados.totalFundamentos
      : 0;
    
    // Determinar descrição com base na média percentual
    let avaliacaoDescritiva = 'Sem avaliação';
    if (mediaTotal >= 80) avaliacaoDescritiva = 'Excelente';
    else if (mediaTotal >= 70) avaliacaoDescritiva = 'Muito Bom';
    else if (mediaTotal >= 60) avaliacaoDescritiva = 'Bom';
    else if (mediaTotal >= 50) avaliacaoDescritiva = 'Regular';
    else if (mediaTotal >= 40) avaliacaoDescritiva = 'Abaixo da média';
    else if (mediaTotal > 0) avaliacaoDescritiva = 'Precisa melhorar';
    
    result[atletaId] = { 
      mediaTotal, 
      totalAvaliacoes: dados.totalAvaliacoes,
      avaliacaoDescritiva
    };
  });
  
  return result;
}

// Função principal para gerar ranking combinado (quantitativo + qualitativo)
export function gerarRankingCombinado(
  quantitativo: { id: string, nome: string, percentual: number, totalExecucoes: number }[],
  avaliacoesQualitativas: AvaliacaoQualitativa[],
  pesos: PesosRanking = PESOS_PADRAO
): RankingCombinado[] {
  // Verificar se temos dados
  if (!quantitativo || quantitativo.length === 0) {
    console.log('Nenhum dado quantitativo disponível para gerar ranking combinado');
    return [];
  }
  
  // Normalizar os pesos para soma = 1
  const pesoTotal = pesos.quantitativo + pesos.qualitativo;
  const pesosNormalizados = {
    quantitativo: pesos.quantitativo / pesoTotal,
    qualitativo: pesos.qualitativo / pesoTotal
  };
  
  console.log(`Gerando ranking combinado com pesos: Quantitativo=${pesosNormalizados.quantitativo.toFixed(2)}, Qualitativo=${pesosNormalizados.qualitativo.toFixed(2)}`);
  
  // Verificar se existem avaliações qualitativas
  if (!avaliacoesQualitativas || avaliacoesQualitativas.length === 0) {
    console.log('Nenhuma avaliação qualitativa disponível. Usando apenas dados quantitativos.');
    // Se não temos dados qualitativos, retornar apenas com base no quantitativo
    return quantitativo.map(atleta => ({
      atleta_id: atleta.id,
      atleta_nome: atleta.nome,
      percentual_quantitativo: atleta.percentual,
      nota_qualitativa: 0,
      score_total: atleta.percentual, // 100% quantitativo
      total_execucoes: atleta.totalExecucoes,
      total_avaliacoes_qualitativas: 0,
      avaliacao_descritiva: 'Sem avaliação'
    }));
  }
  
  // Log de depuração para identificar atletas e suas avaliações
  console.log(`Processando ${avaliacoesQualitativas.length} avaliações qualitativas para ${quantitativo.length} atletas`);
  
  // Mapear avaliações por ID de atleta para facilitar a busca
  const avaliacoesPorAtleta: Record<string, AvaliacaoQualitativa[]> = {};
  
  avaliacoesQualitativas.forEach(avaliacao => {
    if (!avaliacao.atleta_id) return;
    
    if (!avaliacoesPorAtleta[avaliacao.atleta_id]) {
      avaliacoesPorAtleta[avaliacao.atleta_id] = [];
    }
    
    avaliacoesPorAtleta[avaliacao.atleta_id].push(avaliacao);
  });
  
  console.log(`Mapeadas avaliações para ${Object.keys(avaliacoesPorAtleta).length} atletas distintos`);
  
  // Calcular médias qualitativas por atleta
  const mediasQualitativas = calcularMediaQualitativaPorAtleta(avaliacoesQualitativas);
  console.log(`Calculadas médias qualitativas para ${Object.keys(mediasQualitativas).length} atletas`);
  
  // Gerar ranking combinado
  const rankingCombinado = quantitativo.map(atleta => {
    // Buscar nota qualitativa do atleta (se disponível)
    const dadosQualitativos = mediasQualitativas[atleta.id] || {
      mediaTotal: 0,
      totalAvaliacoes: 0,
      avaliacaoDescritiva: 'Sem avaliação'
    };
    
    // Calcular score total ponderado
    let scoreTotal: number;
    let usouQualitativo = false;
    
    if (dadosQualitativos.totalAvaliacoes > 0 && dadosQualitativos.mediaTotal > 0) {
      // Com avaliação qualitativa: média ponderada
      scoreTotal = (atleta.percentual * pesosNormalizados.quantitativo) + 
                   (dadosQualitativos.mediaTotal * pesosNormalizados.qualitativo);
      
      // Garantir que o score está entre 0 e 100
      scoreTotal = Math.max(0, Math.min(100, scoreTotal));
      usouQualitativo = true;
      
      console.log(`Atleta ${atleta.nome}: Calculado score combinado com avaliação qualitativa = ${scoreTotal.toFixed(1)}%`);
    } else {
      // Sem avaliação qualitativa: apenas score quantitativo
      scoreTotal = atleta.percentual;
      console.log(`Atleta ${atleta.nome}: Sem avaliação qualitativa, usando apenas quantitativo = ${scoreTotal.toFixed(1)}%`);
    }
    
    return {
      atleta_id: atleta.id,
      atleta_nome: atleta.nome,
      percentual_quantitativo: atleta.percentual,
      nota_qualitativa: dadosQualitativos.mediaTotal,
      score_total: scoreTotal,
      total_execucoes: atleta.totalExecucoes,
      total_avaliacoes_qualitativas: dadosQualitativos.totalAvaliacoes,
      avaliacao_descritiva: dadosQualitativos.avaliacaoDescritiva
    };
  });
  
  return rankingCombinado;
} 