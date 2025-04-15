import { supabase } from '@/lib/supabase';
import { format, parse, isAfter, isBefore, subMonths } from 'date-fns';
import { AthletePerformance, TeamType } from '@/types';

// Função para obter o desempenho de um atleta em um período específico
export async function getAthletePerformance(
  athleteId: string,
  startDate: Date,
  endDate: Date
): Promise<AthletePerformance[]> {
  try {
    const { data, error } = await supabase
      .from('athlete_performance')
      .select('*')
      .eq('athlete_id', athleteId)
      .gte('date', format(startDate, 'yyyy-MM-dd'))
      .lte('date', format(endDate, 'yyyy-MM-dd'))
      .order('date', { ascending: true });

    if (error) {
      console.error('Erro ao buscar performance do atleta:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao obter performance do atleta:', error);
    return [];
  }
}

// Função para obter o desempenho médio da equipe em um período específico
export async function getTeamPerformance(
  teamType: TeamType,
  startDate: Date,
  endDate: Date
): Promise<AthletePerformance[]> {
  try {
    // Primeiro, obter todos os atletas do time especificado
    const { data: athletes, error: athletesError } = await supabase
      .from('athletes')
      .select('id')
      .eq('time', teamType);

    if (athletesError) {
      console.error('Erro ao buscar atletas do time:', athletesError);
      throw athletesError;
    }

    const athleteIds = athletes ? athletes.map(athlete => athlete.id) : [];

    // Se não houver atletas no time, retornar um array vazio
    if (athleteIds.length === 0) {
      return [];
    }

    // Agora, buscar a performance de cada atleta no período especificado
    const { data, error } = await supabase
      .from('athlete_performance')
      .select('*')
      .in('athlete_id', athleteIds)
      .gte('date', format(startDate, 'yyyy-MM-dd'))
      .lte('date', format(endDate, 'yyyy-MM-dd'))
      .order('date', { ascending: true });

    if (error) {
      console.error('Erro ao buscar performance da equipe:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao obter performance da equipe:', error);
    return [];
  }
}

// Função para adicionar ou atualizar a performance de um atleta
export async function upsertAthletePerformance(
  athleteId: string,
  date: Date,
  performanceData: Omit<AthletePerformance, 'athlete_id' | 'date' | 'created_at'>
): Promise<AthletePerformance | null> {
  try {
    const { data, error } = await supabase
      .from('athlete_performance')
      .upsert(
        [
          {
            athlete_id: athleteId,
            date: format(date, 'yyyy-MM-dd'),
            ...performanceData,
          },
        ],
        { onConflict: ['athlete_id', 'date'] }
      )
      .select('*')
      .single();

    if (error) {
      console.error('Erro ao adicionar/atualizar performance do atleta:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erro ao adicionar/atualizar performance do atleta:', error);
    return null;
  }
}

// Função para obter estatísticas de desempenho de um atleta
export async function getAthletePerformanceStats(athleteId: string) {
  try {
    // Calcular a média de acertos
    const { data: avgData, error: avgError } = await supabase
      .from('athlete_performance')
      .select('acertos')
      .eq('athlete_id', athleteId);

    if (avgError) {
      console.error('Erro ao buscar média de acertos:', avgError);
      throw avgError;
    }

    const totalAcertos = avgData?.reduce((sum, item) => sum + item.acertos, 0) || 0;
    const mediaAcertos = avgData && avgData.length > 0 ? totalAcertos / avgData.length : 0;

    // Calcular a maior pontuação
    const { data: maxData, error: maxError } = await supabase
      .from('athlete_performance')
      .select('pontuacao')
      .eq('athlete_id', athleteId)
      .order('pontuacao', { ascending: false })
      .limit(1);

    if (maxError) {
      console.error('Erro ao buscar maior pontuação:', maxError);
      throw maxError;
    }

    const maiorPontuacao = maxData && maxData.length > 0 ? maxData[0].pontuacao : 0;

    // Calcular a menor pontuação
    const { data: minData, error: minError } = await supabase
      .from('athlete_performance')
      .select('pontuacao')
      .eq('athlete_id', athleteId)
      .order('pontuacao', { ascending: true })
      .limit(1);

    if (minError) {
      console.error('Erro ao buscar menor pontuação:', minError);
      throw minError;
    }

    const menorPontuacao = minData && minData.length > 0 ? minData[0].pontuacao : 0;

    return {
      mediaAcertos,
      maiorPontuacao,
      menorPontuacao,
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas de desempenho do atleta:', error);
    return {
      mediaAcertos: 0,
      maiorPontuacao: 0,
      menorPontuacao: 0,
    };
  }
}

export interface HistoricoTreinoPorAtleta {
  treinoId: string;
  nomeTreino: string;
  data: string;
  local: string;
  presenca: boolean;
  justificativa?: string;
  fundamentos?: {
    fundamento: string;
    acertos: number;
    erros: number;
  }[];
}

// Função para obter histórico de treinos por atleta
export async function getHistoricoTreinoPorAtleta(atletaId: string): Promise<HistoricoTreinoPorAtleta[]> {
  try {
    // Buscar treinos_atletas para este atleta
    const { data: treinosAtleta, error: treinosError } = await supabase
      .from('treinos_atletas')
      .select(`
        id,
        presente,
        justificativa_falta,
        observacoes,
        treino_id,
        treinos:treino_id (
          id, 
          nome, 
          data,
          local
        )
      `)
      .eq('atleta_id', atletaId)
      .order('created_at', { ascending: false });

    if (treinosError) {
      console.error('Erro ao buscar histórico de treinos:', treinosError);
      throw treinosError;
    }

    // Buscar as avaliações de fundamentos para esse atleta
    const { data: avaliacoes, error: avaliacoesError } = await supabase
      .from('avaliacoes_fundamento')
      .select('*')
      .eq('atleta_id', atletaId);

    if (avaliacoesError) {
      console.error('Erro ao buscar avaliações de fundamentos:', avaliacoesError);
    }

    // Mapear os resultados para o formato desejado
    const historico: HistoricoTreinoPorAtleta[] = (treinosAtleta || []).map(item => {
      // Encontrar avaliações relacionadas a este treino
      const fundamentosTreino = (avaliacoes || [])
        .filter(av => av.treino_id === item.treino_id)
        .map(av => ({
          fundamento: av.fundamento,
          acertos: av.acertos,
          erros: av.erros
        }));
      
      return {
        treinoId: item.treino_id,
        nomeTreino: item.treinos?.nome || 'Treino sem nome',
        data: item.treinos?.data || new Date().toISOString().split('T')[0],
        local: item.treinos?.local || 'Local não especificado',
        presenca: item.presente,
        justificativa: item.justificativa_falta,
        fundamentos: fundamentosTreino
      };
    });

    // Se não houver dados, retornar exemplo para testes
    if (historico.length === 0) {
      return getMockHistoricoTreinos();
    }

    return historico;
  } catch (error) {
    console.error('Erro ao buscar histórico de treinos do atleta:', error);
    return getMockHistoricoTreinos(); // Retornar dados de exemplo em caso de erro
  }
}

// Dados de exemplo para testes
function getMockHistoricoTreinos(): HistoricoTreinoPorAtleta[] {
  return [
    {
      treinoId: '1',
      nomeTreino: 'Treino Tático #1',
      data: '2023-04-10',
      local: 'Ginásio Principal',
      presenca: true,
      fundamentos: [
        { fundamento: 'saque', acertos: 8, erros: 2 },
        { fundamento: 'recepção', acertos: 12, erros: 3 }
      ]
    },
    {
      treinoId: '2',
      nomeTreino: 'Treino Físico',
      data: '2023-04-07',
      local: 'Quadra Externa',
      presenca: true,
      fundamentos: [
        { fundamento: 'bloqueio', acertos: 5, erros: 5 }
      ]
    },
    {
      treinoId: '3',
      nomeTreino: 'Treino Técnico',
      data: '2023-04-05',
      local: 'Academia',
      presenca: false,
      justificativa: 'Consulta médica agendada',
      fundamentos: []
    },
    {
      treinoId: '4',
      nomeTreino: 'Amistoso',
      data: '2023-04-01',
      local: 'Ginásio Visitante',
      presenca: true,
      fundamentos: [
        { fundamento: 'ataque', acertos: 15, erros: 4 },
        { fundamento: 'defesa', acertos: 7, erros: 3 },
        { fundamento: 'levantamento', acertos: 22, erros: 1 }
      ]
    }
  ];
}

// Função para obter os atletas mais frequentes em um período específico
export async function getMostFrequentAthletes(
  teamType: TeamType,
  startDate: Date,
  endDate: Date
): Promise<{ athleteId: string; nome: string; presencas: number }[]> {
  try {
    // Buscar todos os atletas do time especificado
    const { data: athletes, error: athletesError } = await supabase
      .from('athletes')
      .select('id, nome')
      .eq('time', teamType);

    if (athletesError) {
      console.error('Erro ao buscar atletas do time:', athletesError);
      throw athletesError;
    }

    // Se não houver atletas no time, retornar um array vazio
    if (!athletes || athletes.length === 0) {
      return [];
    }

    // Buscar os treinos que ocorreram no período especificado
    const { data: treinos, error: treinosError } = await supabase
      .from('treinos')
      .select('id')
      .gte('data', format(startDate, 'yyyy-MM-dd'))
      .lte('data', format(endDate, 'yyyy-MM-dd'));

    if (treinosError) {
      console.error('Erro ao buscar treinos no período:', treinosError);
      throw treinosError;
    }

    // Se não houver treinos no período, retornar um array vazio
    if (!treinos || treinos.length === 0) {
      return [];
    }

    const treinoIds = treinos.map(treino => treino.id);

    // Buscar a presença dos atletas nos treinos especificados
    const { data: presencas, error: presencasError } = await supabase
      .from('treinos_atletas')
      .select('atleta_id, treino_id, presente')
      .in('treino_id', treinoIds)
      .eq('presente', true);

    if (presencasError) {
      console.error('Erro ao buscar presenças dos atletas:', presencasError);
      throw presencasError;
    }

    // Contar o número de presenças de cada atleta
    const contagemPresencas: { [athleteId: string]: number } = {};
    presencas?.forEach(presenca => {
      if (contagemPresencas[presenca.atleta_id]) {
        contagemPresencas[presenca.atleta_id]++;
      } else {
        contagemPresencas[presenca.atleta_id] = 1;
      }
    });

    // Mapear os resultados para o formato desejado
    const atletasFrequentes = athletes.map(athlete => ({
      athleteId: athlete.id,
      nome: athlete.nome,
      presencas: contagemPresencas[athlete.id] || 0,
    }));

    // Ordenar os atletas por número de presenças (do maior para o menor)
    atletasFrequentes.sort((a, b) => b.presencas - a.presencas);

    return atletasFrequentes;
  } catch (error) {
    console.error('Erro ao obter atletas mais frequentes:', error);
    return [];
  }
}
