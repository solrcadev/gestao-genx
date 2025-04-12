
import { supabase } from '@/lib/supabase';
import { Athlete, AthletePerformance, Team } from '@/types';
import { getAthletes } from './athleteService';

export const getAthletesPerformance = async (team?: Team): Promise<AthletePerformance[]> => {
  try {
    // 1. Obter todos os atletas
    const athletes = await getAthletes(team);
    
    // Array para armazenar os resultados de desempenho
    const performances: AthletePerformance[] = [];
    
    // 2. Para cada atleta, buscar dados de presença e avaliações
    for (const athlete of athletes) {
      
      // Buscar dados de presença
      const { data: presencasData, error: presencasError } = await supabase
        .from('treinos_presencas')
        .select('presente, treino_do_dia_id, treinos_do_dia!inner(data)')
        .eq('atleta_id', athlete.id);
        
      if (presencasError) {
        console.error('Erro ao buscar presenças:', presencasError);
        continue;
      }
      
      // Calcular métricas de presença
      const totalTreinos = presencasData?.length || 0;
      const presentes = presencasData?.filter(p => p.presente)?.length || 0;
      const percentualPresenca = totalTreinos > 0 ? (presentes / totalTreinos) * 100 : 0;
      
      // Buscar avaliações por fundamento
      const { data: avaliacoesData, error: avaliacoesError } = await supabase
        .from('avaliacoes_fundamento')
        .select('*, treino:treino_id(nome, data)')
        .eq('atleta_id', athlete.id);
        
      if (avaliacoesError) {
        console.error('Erro ao buscar avaliações:', avaliacoesError);
        continue;
      }
      
      // Calcular métricas de avaliação
      const totalAvaliacoes = avaliacoesData?.length || 0;
      
      // Agrupar por fundamento
      const fundamentos: { [key: string]: { acertos: number; erros: number; total: number; taxa: number } } = {};
      
      // Últimas avaliações para mostrar no histórico
      const ultimasAvaliacoes = [];
      
      let somaNotas = 0;
      
      avaliacoesData?.forEach(aval => {
        // Agrupamento por fundamento
        if (!fundamentos[aval.fundamento]) {
          fundamentos[aval.fundamento] = { acertos: 0, erros: 0, total: 0, taxa: 0 };
        }
        
        fundamentos[aval.fundamento].acertos += aval.acertos;
        fundamentos[aval.fundamento].erros += aval.erros;
        fundamentos[aval.fundamento].total += 1;
        
        // Calcular taxa para o fundamento atual
        const fundamento = fundamentos[aval.fundamento];
        const totalTentativas = fundamento.acertos + fundamento.erros;
        fundamento.taxa = totalTentativas > 0 ? (fundamento.acertos / totalTentativas) * 100 : 0;
        
        // Adicionar à soma para média
        const notaAval = totalTentativas > 0 ? (aval.acertos / totalTentativas) * 100 : 0;
        somaNotas += notaAval;
        
        // Adicionar às últimas avaliações
        if (ultimasAvaliacoes.length < 5 && aval.treino?.data) {
          ultimasAvaliacoes.push({
            data: aval.treino.data,
            treino: aval.treino.nome,
            fundamento: aval.fundamento,
            acertos: aval.acertos,
            erros: aval.erros
          });
        }
      });
      
      // Calcular média das notas
      const mediaNota = totalAvaliacoes > 0 ? somaNotas / totalAvaliacoes : 0;
      
      // Adicionar ao array de performances
      performances.push({
        atleta: athlete,
        presenca: {
          total: totalTreinos,
          presente: presentes,
          percentual: percentualPresenca
        },
        avaliacoes: {
          total: totalAvaliacoes,
          mediaNota,
          porFundamento: fundamentos
        },
        ultimasAvaliacoes
      });
    }
    
    // Ordenar por média de nota decrescente
    return performances.sort((a, b) => b.avaliacoes.mediaNota - a.avaliacoes.mediaNota);
    
  } catch (error) {
    console.error('Erro ao obter desempenho dos atletas:', error);
    throw error;
  }
};

export const getAthletePerformance = async (athleteId: string): Promise<AthletePerformance | null> => {
  try {
    const performances = await getAthletesPerformance();
    return performances.find(p => p.atleta.id === athleteId) || null;
  } catch (error) {
    console.error('Erro ao obter desempenho do atleta:', error);
    throw error;
  }
};
