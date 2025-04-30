import { supabase } from '@/lib/supabase';
import { TeamType, AthletePerformance } from '@/types';
import { 
  buscarEventosQualificados, 
  calcularEstatisticasEventosQualificados,
  EventoQualificado,
  salvarEventoQualificado 
} from '@/services/avaliacaoQualitativaService';
import { buscarAvaliacoesQualitativas } from '@/services/rankingQualitativoService';

// Interface for the performance data
export interface PerformanceData {
  frequency: number;
  evolution: number;
  completedTrainings: number;
  totalTrainings: number;
  goalsAchieved: number;
  totalGoals: number;
}

// Interface for training history
export interface TrainingHistory {
  id: string;
  date: string;
  type: string;
  duration: number;
  status: string;
}

// Interface for goals
export interface Goal {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  progress: number;
  status: 'achieved' | 'in_progress' | 'pending';
}

/**
 * Interface para o histórico de treinos por atleta
 */
export interface HistoricoTreinoPorAtleta {
  treinoId: string;
  nomeTreino: string;
  data: string;
  local: string;
  presenca: boolean;
  justificativa?: string;
  fundamentos: {
    fundamento: string;
    pontuacao: number;  // Pontuação total dos eventos qualitativos
    totalEventos: number; // Total de eventos qualitativos
  }[];
}

// Interface para os dados do ranking de atletas por fundamento
export interface RankingAtletaFundamento {
  id: string;
  nome: string;
  pontuacaoMedia: number;  // Média ponderada dos eventos
  totalEventos: number;    // Total de eventos avaliados
  eventosPositivos: number; // Total de eventos com pontuação positiva
  eventosNegativos: number; // Total de eventos com pontuação negativa
  posicao: number;
}

// Função para obter o desempenho dos atletas por time
export async function getAthletesPerformance(team: TeamType): Promise<AthletePerformance[]> {
  try {
    console.log(`Iniciando busca de desempenho para time: ${team}`);
    
    // 1. Buscar os atletas do time selecionado
    const { data: atletas, error: atletasError } = await supabase
      .from('athletes')
      .select('*')
      .eq('time', team);
    
    if (atletasError) {
      console.error('Erro ao buscar atletas:', atletasError);
      throw atletasError;
    }
    
    console.log(`Atletas encontrados: ${atletas?.length || 0}`);
    if (!atletas || atletas.length === 0) return [];
    
    // 2. Buscar os dados de presença
    let presencas: any[] = [];
    let presencasError = null;
    
    try {
      const result = await supabase
        .from('presencas')
        .select('*')
        .in('atleta_id', atletas.map(a => a.id));
      
      presencas = result.data || [];
      presencasError = result.error;
    } catch (error: any) {
      // Se a tabela não existir, vamos usar um array vazio
      if (error?.code === '42P01' || (presencasError && presencasError.code === '42P01')) {
        console.log('Tabela presencas não existe, usando array vazio');
        presencas = [];
        presencasError = null;
      } else {
        console.error('Erro ao buscar presenças:', error);
        presencasError = error;
      }
    }
    
    if (presencasError && presencasError.code !== '42P01') {
      console.error('Erro ao buscar presenças:', presencasError);
      throw presencasError;
    }
    
    console.log(`Presenças encontradas: ${presencas?.length || 0}`);
    
    // 3. Buscar avaliações qualitativas para todos os atletas do time
    const avaliacoesQualitativas = await buscarAvaliacoesQualitativas(team);
    console.log(`Avaliações qualitativas encontradas: ${avaliacoesQualitativas.length}`);
    
    // Agrupar avaliações por atleta e fundamento
    const avaliacoesPorAtleta: Record<string, Record<string, {
      mediaQualitativa: number;
      totalAvaliacoes: number;
      notaPercentual: number;
      ultimaData?: string;
    }>> = {};
    
    avaliacoesQualitativas.forEach(avaliacao => {
      if (!avaliacoesPorAtleta[avaliacao.atleta_id]) {
        avaliacoesPorAtleta[avaliacao.atleta_id] = {};
      }
      
      const fundamento = avaliacao.fundamento.toLowerCase();
      avaliacoesPorAtleta[avaliacao.atleta_id][fundamento] = {
        mediaQualitativa: avaliacao.media_peso,
        totalAvaliacoes: avaliacao.total_avaliacoes,
        notaPercentual: avaliacao.nota_percentual,
        ultimaData: avaliacao.ultima_avaliacao
      };
    });
    
    // Inicializar array de resultados com todos os atletas
    const results: AthletePerformance[] = [];
    
    // Processar cada atleta individualmente
    for (const atleta of atletas) {
      try {
        console.log(`Processando atleta: ${atleta.nome} (${atleta.id})`);
        
        // Calcular frequência com base nas presenças
        const atletaPresencas = presencas.filter(p => p.atleta_id === atleta.id);
        const totalTreinos = atletaPresencas.length;
        const treinosPresentes = atletaPresencas.filter(p => p.presente).length;
        const frequencia = totalTreinos > 0 ? (treinosPresentes / totalTreinos) * 100 : 0;
        
        // Verificar se o atleta tem avaliações qualitativas
        const avaliacoesAtleta = avaliacoesPorAtleta[atleta.id] || {};
        
        // Preparar objeto de avaliações por fundamento no formato esperado pela aplicação
        const porFundamento: Record<string, {
          percentualAcerto: number;
          total: number;
          acertos: number; // Mantido para compatibilidade, não usado
          erros: number;   // Mantido para compatibilidade, não usado
          ultimaData?: string;
        }> = {};
        
        // Processar cada fundamento avaliado
        Object.entries(avaliacoesAtleta).forEach(([fundamento, dados]) => {
          porFundamento[fundamento] = {
            percentualAcerto: dados.notaPercentual,
            total: dados.totalAvaliacoes,
            acertos: Math.round((dados.notaPercentual / 100) * dados.totalAvaliacoes), // Aproximação para compatibilidade
            erros: Math.round(((100 - dados.notaPercentual) / 100) * dados.totalAvaliacoes), // Aproximação para compatibilidade
            ultimaData: dados.ultimaData
          };
        });
        
        // Se o atleta não tiver avaliações qualitativas, buscar eventos diretamente
        if (Object.keys(avaliacoesAtleta).length === 0) {
          // Buscar eventos qualificados para este atleta
          const eventosQualificados = await buscarEventosQualificados({ 
            atleta_id: atleta.id 
          });
          
          console.log(`Eventos qualificados encontrados: ${eventosQualificados.length}`);
          
          if (eventosQualificados.length > 0) {
            // Agrupar eventos por fundamento
            const eventosPorFundamento: Record<string, {
              eventos: EventoQualificado[];
              pontuacaoTotal: number;
            }> = {};
            
            eventosQualificados.forEach(evento => {
              const fundamento = evento.fundamento.toLowerCase();
              
              if (!eventosPorFundamento[fundamento]) {
                eventosPorFundamento[fundamento] = {
                  eventos: [],
                  pontuacaoTotal: 0
                };
              }
              
              eventosPorFundamento[fundamento].eventos.push(evento);
              eventosPorFundamento[fundamento].pontuacaoTotal += evento.peso;
            });
            
            // Converter para o formato esperado
            Object.entries(eventosPorFundamento).forEach(([fundamento, dados]) => {
              const total = dados.eventos.length;
              const mediaPeso = total > 0 ? dados.pontuacaoTotal / total : 0;
              
              // Converter para escala 0-100%: ((mediaPeso + 2) / 5) * 100
              const notaPercentual = Math.max(0, Math.min(100, ((mediaPeso + 2) / 5) * 100));
              
              // Obter data mais recente
              const datas = dados.eventos.map(e => e.timestamp || '').filter(Boolean);
              const ultimaData = datas.length > 0 ? 
                new Date(Math.max(...datas.map(d => new Date(d).getTime()))).toISOString() : 
                undefined;
              
              porFundamento[fundamento] = {
                percentualAcerto: notaPercentual,
                total,
                acertos: Math.round((notaPercentual / 100) * total), // Aproximação para compatibilidade
                erros: Math.round(((100 - notaPercentual) / 100) * total), // Aproximação para compatibilidade
                ultimaData
              };
            });
          }
        }
        
        // Calcular totais e médias para avaliacoes
        let totalGeral = 0;
        let somaPercentuais = 0;
        let contadorFundamentos = 0;
        
        Object.values(porFundamento).forEach(dados => {
          totalGeral += dados.total;
          somaPercentuais += dados.percentualAcerto;
          contadorFundamentos++;
        });
        
        const mediaNota = contadorFundamentos > 0 ? somaPercentuais / contadorFundamentos : 0;
        
        // Criar objeto de performance para o atleta
        const performanceObj: AthletePerformance = {
          atleta: {
            id: atleta.id,
            nome: atleta.nome,
            posicao: atleta.posicao,
            time: atleta.time as TeamType,
            foto_url: atleta.imagem_url || null,
            created_at: atleta.created_at || new Date().toISOString(),
            idade: atleta.idade || 0,
            altura: atleta.altura || 0,
            email: atleta.email || null,
            access_status: atleta.access_status || 'sem_acesso'
          },
          presenca: {
            total: totalTreinos,
            presentes: treinosPresentes,
            percentual: frequencia
          },
          avaliacoes: {
            total: totalGeral,
            mediaNota: mediaNota,
            porFundamento: porFundamento
          }
        };
        
        results.push(performanceObj);
      } catch (atletaError) {
        console.error(`Erro ao processar atleta ${atleta.nome}:`, atletaError);
        // Continuar para o próximo atleta
      }
    }
    
    console.log(`Retornando dados de desempenho para ${results.length} atletas`);
    return results;
  } catch (error) {
    console.error('Erro em getAthletesPerformance:', error);
    throw error;
  }
}

// Função para carregar dados de performance formatados para ranking
export async function loadPerformanceDataForRanking(team: TeamType): Promise<AthletePerformance[]> {
  return await getAthletesPerformance(team);
}

// Função para obter ranking de atletas por fundamento
export async function getAthletesRankingByFundamento(
  time: TeamType,
  fundamento: string
): Promise<RankingAtletaFundamento[]> {
  try {
    // Buscar avaliações qualitativas processadas
    const avaliacoesQualitativas = await buscarAvaliacoesQualitativas(
      time,
      fundamento
    );
    
    // Se não houver avaliações, retornar array vazio
    if (!avaliacoesQualitativas || avaliacoesQualitativas.length === 0) {
      return [];
    }
    
    // Converter para o formato esperado
    const ranking = avaliacoesQualitativas
      .map(avaliacao => {
        // Verificar limite mínimo de avaliações (pelo menos 3)
        if (avaliacao.total_avaliacoes < 3) {
          return null;
        }
        
        return {
          id: avaliacao.atleta_id,
          nome: avaliacao.atleta_nome,
          pontuacaoMedia: avaliacao.media_peso,
          totalEventos: avaliacao.total_avaliacoes,
          eventosPositivos: avaliacao.avaliacoes_positivas,
          eventosNegativos: avaliacao.avaliacoes_negativas,
          posicao: 0 // Será calculado abaixo
        };
      })
      .filter(item => item !== null) as RankingAtletaFundamento[];
    
    // Ordenar por pontuação média (maior para menor)
    ranking.sort((a, b) => b.pontuacaoMedia - a.pontuacaoMedia);
    
    // Atribuir posições (ranking)
    ranking.forEach((item, index) => {
      item.posicao = index + 1;
    });
    
    return ranking;
  } catch (error) {
    console.error(`Erro ao obter ranking para ${fundamento}:`, error);
    return [];
  }
}

// Função para obter histórico de treinos por atleta
export async function getHistoricoTreinoPorAtleta(athleteId: string): Promise<HistoricoTreinoPorAtleta[]> {
  try {
    // Buscar presença do atleta primeiro
    const { data: presencas, error: presencasError } = await supabase
      .from('presencas')
      .select(`
        *,
        treinos:treino_id (
          id,
          nome,
          data,
          local
        )
      `)
      .eq('atleta_id', athleteId);
    
    if (presencasError) {
      console.error('Erro ao buscar presenças do atleta:', presencasError);
      throw presencasError;
    }
    
    // Mapear presencas para o formato do histórico
    const historico = mapearPresencasParaHistorico(presencas || [], athleteId);
    
    // Buscar eventos qualificados do atleta
    const eventosQualificados = await buscarEventosQualificados({
      atleta_id: athleteId
    });
    
    // Agrupar eventos por treino e fundamento
    const eventosPorTreino: Record<string, Record<string, { 
      pontuacao: number, 
      total: number 
    }>> = {};
    
    eventosQualificados.forEach(evento => {
      const { treino_id, fundamento, peso } = evento;
      
      if (!treino_id) return;
      
      if (!eventosPorTreino[treino_id]) {
        eventosPorTreino[treino_id] = {};
      }
      
      if (!eventosPorTreino[treino_id][fundamento]) {
        eventosPorTreino[treino_id][fundamento] = { pontuacao: 0, total: 0 };
      }
      
      eventosPorTreino[treino_id][fundamento].pontuacao += peso;
      eventosPorTreino[treino_id][fundamento].total += 1;
    });
    
    // Adicionar eventos ao histórico
    historico.forEach(treino => {
      const eventosTreino = eventosPorTreino[treino.treinoId];
      
      if (eventosTreino) {
        Object.entries(eventosTreino).forEach(([fundamento, dados]) => {
          treino.fundamentos.push({
            fundamento,
            pontuacao: dados.pontuacao,
            totalEventos: dados.total
          });
        });
      }
    });
    
    return historico;
  } catch (error) {
    console.error('Erro ao obter histórico de treinos:', error);
    return [];
  }
}

// Função auxiliar para mapear presenças para histórico
function mapearPresencasParaHistorico(presencas: any[], athleteId: string): HistoricoTreinoPorAtleta[] {
  const historico: HistoricoTreinoPorAtleta[] = [];
  
  presencas.forEach(presenca => {
    if (!presenca.treinos) return;
    
    historico.push({
      treinoId: presenca.treino_id,
      nomeTreino: presenca.treinos.nome || 'Treino sem nome',
      data: presenca.treinos.data || '',
      local: presenca.treinos.local || '',
      presenca: presenca.presente,
      justificativa: presenca.justificativa,
      fundamentos: []
    });
  });
  
  // Ordenar por data (mais recente primeiro)
  historico.sort((a, b) => {
    const dataA = a.data ? new Date(a.data).getTime() : 0;
    const dataB = b.data ? new Date(b.data).getTime() : 0;
    return dataB - dataA;
  });
  
  return historico;
}

// Função para obter dados de desempenho de um atleta específico
export async function getAthletePerformance(athleteId: string): Promise<AthletePerformance> {
  try {
    console.log(`Buscando desempenho do atleta: ${athleteId}`);
    
    // 1. Buscar dados do atleta
    const { data: atleta, error: atletaError } = await supabase
      .from('athletes')
      .select('*')
      .eq('id', athleteId)
      .single();
    
    if (atletaError || !atleta) {
      console.error('Erro ao buscar atleta:', atletaError);
      throw atletaError || new Error('Atleta não encontrado');
    }
    
    // 2. Buscar dados de presença do atleta
    const { data: presencas, error: presencasError } = await supabase
      .from('presencas')
      .select('*')
      .eq('atleta_id', athleteId);
    
    if (presencasError) {
      console.error('Erro ao buscar presenças:', presencasError);
      throw presencasError;
    }
    
    const totalTreinos = presencas?.length || 0;
    const treinosPresentes = presencas?.filter(p => p.presente)?.length || 0;
    const frequencia = totalTreinos > 0 ? (treinosPresentes / totalTreinos) * 100 : 0;
    
    // 3. Buscar eventos qualificados para este atleta
    const eventosQualificados = await buscarEventosQualificados({ atleta_id: athleteId });
    console.log(`Eventos qualificados encontrados: ${eventosQualificados.length}`);
    
    // 4. Processar eventos por fundamento
    const eventosPorFundamento: Record<string, {
      total: number;
      positivos: number;
      negativos: number;
      mediaPeso: number;
      ultimaData?: string;
      acertos: number;
      erros: number;
      percentualAcerto: number;
    }> = {};
    
    const ultimasAvaliacoes: {
      data: string;
      treino: string;
      fundamento: string;
      acertos: number;
      erros: number;
    }[] = [];
    
    eventosQualificados.forEach(evento => {
      if (!evento.fundamento) return;
      
      const fundamento = evento.fundamento.toLowerCase();
      
      if (!eventosPorFundamento[fundamento]) {
        eventosPorFundamento[fundamento] = {
          total: 0,
          positivos: 0,
          negativos: 0,
          mediaPeso: 0,
          acertos: 0,
          erros: 0,
          percentualAcerto: 0
        };
      }
      
      const dados = eventosPorFundamento[fundamento];
      dados.total += 1;
      
      if (evento.peso > 0) {
        dados.positivos += 1;
        dados.acertos += 1;
      } else if (evento.peso < 0) {
        dados.negativos += 1;
        dados.erros += 1;
      }
      
      // Atualizar média
      const novaSoma = (dados.mediaPeso * (dados.total - 1)) + evento.peso;
      dados.mediaPeso = novaSoma / dados.total;
      
      // Calcular percentual de acerto
      dados.percentualAcerto = ((dados.acertos / dados.total) * 100) || 0;
      
      // Rastrear última data
      if (evento.timestamp) {
        const dataEvento = new Date(evento.timestamp);
        if (!dados.ultimaData || dataEvento > new Date(dados.ultimaData)) {
          dados.ultimaData = evento.timestamp;
        }
        
        // Registrar para o gráfico de evolução
        ultimasAvaliacoes.push({
          data: evento.timestamp,
          treino: evento.treino_id || "Avaliação individual",
          fundamento,
          acertos: evento.peso > 0 ? 1 : 0,
          erros: evento.peso < 0 ? 1 : 0
        });
      }
    });
    
    // Ordenar últimas avaliações por data
    ultimasAvaliacoes.sort((a, b) => {
      return new Date(a.data).getTime() - new Date(b.data).getTime();
    });
    
    // 5. Montar objeto de resposta
    const porFundamento: Record<string, {
      percentualAcerto: number;
      total: number;
      acertos: number;
      erros: number;
      ultimaData?: string;
    }> = {};
    
    Object.entries(eventosPorFundamento).forEach(([fundamento, dados]) => {
      porFundamento[fundamento] = {
        percentualAcerto: dados.percentualAcerto,
        total: dados.total,
        acertos: dados.acertos,
        erros: dados.erros,
        ultimaData: dados.ultimaData
      };
    });
    
    return {
      atleta: {
        id: atleta.id,
        nome: atleta.nome,
        posicao: atleta.posicao,
        time: atleta.time as TeamType,
        foto_url: atleta.imagem_url || null,
        created_at: atleta.created_at || new Date().toISOString(),
        idade: atleta.idade || 0,
        altura: atleta.altura || 0,
        email: atleta.email || null,
        access_status: atleta.access_status || 'sem_acesso'
      },
      presenca: {
        total: totalTreinos,
        presentes: treinosPresentes,
        percentual: frequencia
      },
      avaliacoes: {
        total: eventosQualificados.length,
        mediaNota: Object.values(eventosPorFundamento).reduce((acc, dados) => acc + dados.percentualAcerto, 0) / 
                  (Object.keys(eventosPorFundamento).length || 1),
        porFundamento: porFundamento
      },
      ultimasAvaliacoes: ultimasAvaliacoes
    };
  } catch (error) {
    console.error('Erro em getAthletePerformance:', error);
    throw error;
  }
}

// Função para buscar histórico de treinos de um atleta
export async function getTrainingHistory(athleteId: string): Promise<TrainingHistory[]> {
  try {
    const historico = await getHistoricoTreinoPorAtleta(athleteId);
    
    // Mapear para o formato esperado pelo componente
    return historico.map(item => ({
      id: item.treinoId,
      date: item.data,
      type: item.nomeTreino,
      duration: 90, // Valor padrão em minutos
      status: item.presenca ? 'completed' : 'incomplete'
    }));
  } catch (error) {
    console.error('Erro ao buscar histórico de treinos:', error);
    return [];
  }
}

// Função para buscar metas de um atleta
export async function getStudentGoals(athleteId: string): Promise<Goal[]> {
  try {
    // Buscar metas do banco
    const { data: metas, error } = await supabase
      .from('metas')
      .select('*')
      .eq('atleta_id', athleteId);
    
    if (error) {
      console.error('Erro ao buscar metas:', error);
      throw error;
    }
    
    // Mapear para o formato esperado
    return (metas || []).map(meta => ({
      id: meta.id,
      title: meta.titulo,
      description: meta.descricao || '',
      targetDate: meta.data_alvo,
      progress: meta.progresso || 0,
      status: meta.progresso >= 100 ? 'achieved' : 
              new Date(meta.data_alvo) < new Date() ? 'pending' : 'in_progress'
    }));
  } catch (error) {
    console.error('Erro ao buscar metas do atleta:', error);
    return [];
  }
}

// Função para registrar nova avaliação de desempenho
export async function registrarAvaliacaoDesempenho(avaliacaoData: {
  atleta_id: string;
  treino_id?: string;
  fundamento: string;
  acertos: number;
  erros: number;
  timestamp: string;
}): Promise<void> {
  try {
    const { atleta_id, treino_id, fundamento, acertos, erros, timestamp } = avaliacaoData;
    
    // Criar eventos para cada acerto e erro
    const eventos: EventoQualificado[] = [];
    
    // Configuração do evento com base no fundamento
    const configFundamento = {
      acerto: { tipo: 'Eficiente', peso: 1.0 },
      erro: { tipo: 'Erro', peso: -1.5 }
    };
    
    // Adicionar eventos para acertos
    for (let i = 0; i < acertos; i++) {
      eventos.push({
        atleta_id,
        treino_id,
        fundamento,
        tipo_evento: configFundamento.acerto.tipo,
        peso: configFundamento.acerto.peso,
        timestamp
      });
    }
    
    // Adicionar eventos para erros
    for (let i = 0; i < erros; i++) {
      eventos.push({
        atleta_id,
        treino_id,
        fundamento,
        tipo_evento: configFundamento.erro.tipo,
        peso: configFundamento.erro.peso,
        timestamp
      });
    }
    
    // Salvar todos os eventos
    for (const evento of eventos) {
      await salvarEventoQualificado(evento);
    }
    
    console.log(`Registrados ${eventos.length} eventos para o atleta ${atleta_id}`);
  } catch (error) {
    console.error('Erro ao registrar avaliação de desempenho:', error);
    throw error;
  }
}
