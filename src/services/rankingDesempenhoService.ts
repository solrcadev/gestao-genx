import { supabase } from '@/lib/supabase';
import { TeamType, AthletePerformance } from '@/types';
import { buscarEventosQualificados } from './avaliacaoQualitativaService';

// Interface para o resultado do ranking de desempenho
export interface RankingDesempenhoAtleta {
  id: string;
  nome: string;
  time: TeamType;
  mediaDesempenho: number;
  totalAvaliacoes: number;
  totalEventosAvaliados: number;
  status: 'com_dados' | 'sem_dados';
}

// Interface para avaliação qualitativa processada
interface AvaliacaoQualitativaProcessada {
  atleta_id: string;
  atleta_nome: string;
  time: TeamType;
  somaPesos: number;
  totalEventos: number;
  mediaPonderada: number;
}

/**
 * Busca as avaliações qualitativas de eventos e calcula a média ponderada
 * @param time Tipo de time (Masculino/Feminino)
 * @param dataInicio Data de início do período de avaliação
 * @param dataFim Data de fim do período de avaliação
 * @returns Lista de avaliações qualitativas processadas por atleta
 */
export async function buscarAvaliacoesQualitativasPorEvento(
  time: TeamType,
  dataInicio?: string,
  dataFim?: string
): Promise<AvaliacaoQualitativaProcessada[]> {
  try {
    console.log(`Buscando avaliações qualitativas por evento para time ${time}`);
    
    // Buscar eventos qualificados com filtros de data
    const eventos = await buscarEventosQualificados({
      data_inicio: dataInicio,
      data_fim: dataFim
    });
    
    console.log(`Encontrados ${eventos.length} eventos qualificados`);
    
    if (eventos.length === 0) {
      return [];
    }
    
    // Buscar informações dos atletas
    const atletaIds = [...new Set(eventos.map(e => e.atleta_id))];
    
    const { data: atletasData, error } = await supabase
      .from('athletes')
      .select('id, nome, time')
      .in('id', atletaIds);
    
    if (error) {
      console.error("Erro ao buscar atletas:", error);
      return [];
    }
    
    // Filtrar atletas pelo time selecionado
    const atletasDoTime = atletasData.filter(a => a.time === time);
    const atletasMap = new Map(atletasDoTime.map(a => [a.id, a]));
    
    // Agrupar eventos por atleta
    const eventosPorAtleta = new Map<string, { 
      somaPesos: number; 
      totalEventos: number; 
      atleta_nome: string;
      time: TeamType;
    }>();
    
    // Processar cada evento
    eventos.forEach(evento => {
      const atletaId = evento.atleta_id;
      const atleta = atletasMap.get(atletaId);
      
      // Verificar se o atleta pertence ao time selecionado
      if (!atleta) return;
      
      // Inicializar ou atualizar dados do atleta
      if (!eventosPorAtleta.has(atletaId)) {
        eventosPorAtleta.set(atletaId, {
          somaPesos: 0,
          totalEventos: 0,
          atleta_nome: atleta.nome,
          time: atleta.time
        });
      }
      
      const dadosAtleta = eventosPorAtleta.get(atletaId)!;
      
      // Acumular peso e contar eventos
      dadosAtleta.somaPesos += evento.peso;
      dadosAtleta.totalEventos++;
    });
    
    // Converter para lista de resultados
    const resultado: AvaliacaoQualitativaProcessada[] = [];
    
    eventosPorAtleta.forEach((dados, atletaId) => {
      // Calcular média ponderada
      const mediaPonderada = dados.totalEventos > 0 
        ? dados.somaPesos / dados.totalEventos
        : 0;
      
      resultado.push({
        atleta_id: atletaId,
        atleta_nome: dados.atleta_nome,
        time: dados.time,
        somaPesos: dados.somaPesos,
        totalEventos: dados.totalEventos,
        mediaPonderada: mediaPonderada
      });
    });
    
    console.log(`Processadas avaliações para ${resultado.length} atletas`);
    return resultado;
  } catch (erro) {
    console.error('Erro ao buscar avaliações qualitativas por evento:', erro);
    return [];
  }
}

/**
 * Calcula o ranking de desempenho dos atletas usando a média ponderada das avaliações
 * qualitativas por evento e, opcionalmente, incorpora dados quantitativos para fallback
 * @param time Tipo de time (Masculino/Feminino)
 * @param dataInicio Data de início do período de avaliação
 * @param dataFim Data de fim do período de avaliação
 * @param dadosQuantitativos Dados de desempenho quantitativo dos atletas (opcional)
 * @returns Ranking de desempenho dos atletas
 */
export async function gerarRankingDesempenho(
  time: TeamType,
  dataInicio?: string,
  dataFim?: string,
  dadosQuantitativos?: AthletePerformance[]
): Promise<RankingDesempenhoAtleta[]> {
  try {
    // Buscar avaliações qualitativas
    const avaliacoesQualitativas = await buscarAvaliacoesQualitativasPorEvento(
      time,
      dataInicio,
      dataFim
    );
    
    // Se não há dados quantitativos e nem qualitativos, retorna lista vazia
    if ((!avaliacoesQualitativas || avaliacoesQualitativas.length === 0) && 
        (!dadosQuantitativos || dadosQuantitativos.length === 0)) {
      return [];
    }
    
    // Map para armazenar os dados de ranking por atleta
    const rankingPorAtleta = new Map<string, RankingDesempenhoAtleta>();
    
    // Primeiro, processar as avaliações qualitativas (prioridade)
    avaliacoesQualitativas.forEach(avaliacao => {
      // Converter a média ponderada para uma escala de 0-100
      // Considerando que os pesos variam de -2.0 a 3.0 (amplitude de 5.0)
      const mediaPercentual = Math.max(0, Math.min(100, ((avaliacao.mediaPonderada + 2.0) / 5.0) * 100));
      
      rankingPorAtleta.set(avaliacao.atleta_id, {
        id: avaliacao.atleta_id,
        nome: avaliacao.atleta_nome,
        time: avaliacao.time,
        mediaDesempenho: mediaPercentual,
        totalAvaliacoes: avaliacao.totalEventos,
        totalEventosAvaliados: avaliacao.totalEventos,
        status: 'com_dados'
      });
    });
    
    // Se temos dados quantitativos, usá-los como complemento ou fallback
    if (dadosQuantitativos && dadosQuantitativos.length > 0) {
      dadosQuantitativos.forEach(atletaData => {
        const atletaId = atletaData.atleta.id;
        
        // Se o atleta já tem dados qualitativos, não substituir
        if (rankingPorAtleta.has(atletaId)) {
          return;
        }
        
        // Verificar se o atleta tem avaliações quantitativas
        const temAvaliacoes = Object.values(atletaData.avaliacoes.porFundamento).some(
          fundamento => fundamento.total > 0
        );
        
        if (temAvaliacoes) {
          // Calcular média quantitativa geral
          let somaPercentuais = 0;
          let totalFundamentos = 0;
          
          Object.values(atletaData.avaliacoes.porFundamento).forEach(fundamento => {
            if (fundamento.total > 0) {
              somaPercentuais += fundamento.percentualAcerto;
              totalFundamentos++;
            }
          });
          
          const mediaQuantitativa = totalFundamentos > 0 
            ? somaPercentuais / totalFundamentos
            : 0;
          
          // Adicionar ao ranking
          rankingPorAtleta.set(atletaId, {
            id: atletaId,
            nome: atletaData.atleta.nome,
            time: atletaData.atleta.time,
            mediaDesempenho: mediaQuantitativa,
            totalAvaliacoes: atletaData.avaliacoes.total,
            totalEventosAvaliados: atletaData.avaliacoes.total,
            status: 'com_dados'
          });
        }
      });
    }
    
    // Converter o Map para array e aplicar ordenação
    const rankingFinal = Array.from(rankingPorAtleta.values()).sort((a, b) => {
      // Ordenar por média de desempenho (decrescente)
      if (b.mediaDesempenho !== a.mediaDesempenho) {
        return b.mediaDesempenho - a.mediaDesempenho;
      }
      
      // Desempate por número de avaliações (decrescente)
      if (b.totalAvaliacoes !== a.totalAvaliacoes) {
        return b.totalAvaliacoes - a.totalAvaliacoes;
      }
      
      // Desempate por ordem alfabética
      return a.nome.localeCompare(b.nome);
    });
    
    console.log(`Ranking de desempenho gerado com ${rankingFinal.length} atletas`);
    return rankingFinal;
  } catch (erro) {
    console.error('Erro ao gerar ranking de desempenho:', erro);
    return [];
  }
}

/**
 * Função de utilidade para gerar uma descrição do desempenho com base na média
 * @param media Média de desempenho (0-100)
 * @returns Descrição textual do desempenho
 */
export function descreverDesempenho(media: number): string {
  if (media >= 85) return 'Excelente';
  if (media >= 75) return 'Muito Bom';
  if (media >= 65) return 'Bom';
  if (media >= 50) return 'Regular';
  if (media >= 35) return 'Abaixo da média';
  if (media > 0) return 'Precisa melhorar';
  return 'Sem avaliação';
} 