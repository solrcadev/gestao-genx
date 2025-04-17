import { supabase } from '@/lib/supabase';
import { TeamType, AthletePerformance } from '@/types';

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

// Interface para os dados brutos das avaliações
interface AvaliacaoRaw {
  atleta_id: string;
  treino_id: string;
  fundamento: string;
  acertos: number;
  erros: number;
  timestamp: string;
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
    acertos: number;
    erros: number;
  }[];
}

// Interface for student performance
export interface StudentPerformance {
  frequency: number;
  evolution: number;
  completedTrainings: number;
  achievedGoals: number;
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
    
    // 3. Buscar as avaliações de exercícios
    let avaliacoes: any[] = [];
    let avaliacoesError = null;
    
    try {
      const result = await supabase
        .from('avaliacoes_exercicios')
        .select('*')
        .in('atleta_id', atletas.map(a => a.id));
      
      avaliacoes = result.data || [];
      avaliacoesError = result.error;
    } catch (error: any) {
      // Se a tabela não existir, vamos usar um array vazio
      if (error?.code === '42P01' || (avaliacoesError && avaliacoesError.code === '42P01')) {
        console.log('Tabela avaliacoes_exercicios não existe, usando array vazio');
        avaliacoes = [];
        avaliacoesError = null;
      } else {
        console.error('Erro ao buscar avaliações:', error);
        avaliacoesError = error;
      }
    }
    
    if (avaliacoesError && avaliacoesError.code !== '42P01') {
      console.error('Erro ao buscar avaliações:', avaliacoesError);
      throw avaliacoesError;
    }
    
    console.log(`Avaliações encontradas: ${avaliacoes?.length || 0}`);
    
    // 3.1 Complementar com avaliações do localStorage (caso existam)
    const localAvaliacoes = getLocalStorageAvaliacoes();
    if (localAvaliacoes.length > 0) {
      console.log(`Encontradas ${localAvaliacoes.length} avaliações no localStorage`);
      // Filtrar apenas avaliações dos atletas do time atual
      const atletaIds = atletas.map(a => a.id);
      const filteredLocalAvaliacoes = localAvaliacoes.filter(a => atletaIds.includes(a.atleta_id));
      console.log(`${filteredLocalAvaliacoes.length} avaliações no localStorage são para atletas deste time`);
      
      // Adicionar ao array de avaliações do banco de dados
      avaliacoes = [...avaliacoes, ...filteredLocalAvaliacoes];
    }
    
    // 4. Processar os dados para o formato esperado pelos componentes
    const performanceData: AthletePerformance[] = atletas.map(atleta => {
      // Calcular dados de presença
      const atletaPresencas = presencas?.filter(p => p.atleta_id === atleta.id) || [];
      const totalPresencas = atletaPresencas.length;
      const presencasConfirmadas = atletaPresencas.filter(p => p.presente).length;
      const percentualPresenca = totalPresencas > 0 
        ? (presencasConfirmadas / totalPresencas) * 100 
        : 0;
      
      // Processar avaliações por fundamento
      const atletaAvaliacoes = avaliacoes?.filter(a => a.atleta_id === atleta.id) || [];
      
      // Agrupar avaliações por fundamento
      const avaliacoesPorFundamento: Record<string, {
        acertos: number;
        erros: number;
        total: number;
        percentualAcerto: number;
        ultimaData: string;
      }> = {};
      
      // Processar cada avaliação
      atletaAvaliacoes.forEach(avaliacao => {
        const fundamento = avaliacao.fundamento.toLowerCase();
        
        if (!avaliacoesPorFundamento[fundamento]) {
          avaliacoesPorFundamento[fundamento] = {
            acertos: 0,
            erros: 0,
            total: 0,
            percentualAcerto: 0,
            ultimaData: avaliacao.timestamp
          };
        }
        
        // Adicionar dados da avaliação
        avaliacoesPorFundamento[fundamento].acertos += avaliacao.acertos;
        avaliacoesPorFundamento[fundamento].erros += avaliacao.erros;
        avaliacoesPorFundamento[fundamento].total += (avaliacao.acertos + avaliacao.erros);
        
        // Atualizar data mais recente
        if (avaliacao.timestamp && avaliacoesPorFundamento[fundamento].ultimaData) {
          try {
            const avaliacaoDate = new Date(avaliacao.timestamp);
            const ultimaDate = new Date(avaliacoesPorFundamento[fundamento].ultimaData);
            
            if (avaliacaoDate > ultimaDate) {
              avaliacoesPorFundamento[fundamento].ultimaData = avaliacao.timestamp;
            }
          } catch (dateError) {
            console.error('Erro ao processar datas:', dateError);
            // Em caso de erro, manter a data atual
          }
        }
      });
      
      // Não vamos mais criar fundamentos simulados se não existirem, apenas mostrar os que temos
      
      // Calcular percentuais de acerto para cada fundamento
      Object.keys(avaliacoesPorFundamento).forEach(fundamento => {
        const { acertos, total } = avaliacoesPorFundamento[fundamento];
        avaliacoesPorFundamento[fundamento].percentualAcerto = total > 0 
          ? (acertos / total) * 100 
          : 0;
      });
      
      // Calcular média geral de avaliações
      const totalAvaliacoes = atletaAvaliacoes.length;
      let somaPercentuais = 0;
      
      Object.values(avaliacoesPorFundamento).forEach(avaliacao => {
        somaPercentuais += avaliacao.percentualAcerto;
      });
      
      const mediaGeral = Object.keys(avaliacoesPorFundamento).length > 0
        ? somaPercentuais / Object.keys(avaliacoesPorFundamento).length
        : 0;
      
      // Formatar datas para exibição
      Object.keys(avaliacoesPorFundamento).forEach(fundamento => {
        try {
          const dataOriginal = avaliacoesPorFundamento[fundamento].ultimaData;
          if (dataOriginal) {
            const data = new Date(dataOriginal);
            avaliacoesPorFundamento[fundamento].ultimaData = data.toLocaleDateString('pt-BR');
          } else {
            avaliacoesPorFundamento[fundamento].ultimaData = 'N/A';
          }
        } catch (dateError) {
          console.error('Erro ao formatar data:', dateError);
          avaliacoesPorFundamento[fundamento].ultimaData = 'N/A';
        }
      });
      
      // Coletar últimas avaliações para histórico
      let ultimasAvaliacoes = [];
      try {
        if (atletaAvaliacoes.length > 0) {
          ultimasAvaliacoes = atletaAvaliacoes
            .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
            .slice(0, 5)
            .map(av => ({
              data: av.timestamp ? new Date(av.timestamp).toLocaleDateString('pt-BR') : 'N/A',
              treino: av.treino_id,
              fundamento: av.fundamento,
              acertos: av.acertos,
              erros: av.erros
            }));
        }
      } catch (evalError) {
        console.error('Erro ao processar últimas avaliações:', evalError);
        // Em caso de erro, retornar array vazio
      }
      
      // Retornar objeto com dados de performance do atleta
      return {
        atleta: {
          id: atleta.id,
          nome: atleta.nome,
          posicao: atleta.posicao,
          time: atleta.time,
          foto_url: atleta.foto_url,
          created_at: atleta.created_at,
          idade: atleta.idade,
          altura: atleta.altura
        },
        presenca: {
          total: totalPresencas,
          presentes: presencasConfirmadas,
          percentual: percentualPresenca
        },
        avaliacoes: {
          total: totalAvaliacoes,
          mediaNota: mediaGeral,
          porFundamento: avaliacoesPorFundamento
        },
        ultimasAvaliacoes
      };
    });
    
    console.log(`Dados de desempenho processados para ${performanceData.length} atletas`);
    return performanceData;
  } catch (error) {
    console.error('Erro ao buscar dados de desempenho:', error);
    throw error;
  }
}

// Função para registrar avaliação de desempenho
export async function registrarAvaliacaoDesempenho(avaliacao: AvaliacaoRaw) {
  try {
    const { data, error } = await supabase
      .from('avaliacoes_exercicios')
      .insert([avaliacao]);
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao registrar avaliação:', error);
    throw error;
  }
}

// Função para obter o desempenho de um atleta específico
export async function getAthletePerformance(atletaId: string): Promise<AthletePerformance | null> {
  try {
    console.log(`Iniciando busca de desempenho para atleta ID: ${atletaId}`);
    
    // 1. Buscar o atleta
    const { data: atleta, error: atletaError } = await supabase
      .from('athletes')
      .select('*')
      .eq('id', atletaId)
      .single();
    
    if (atletaError) {
      console.error('Erro ao buscar atleta:', atletaError);
      throw atletaError;
    }
    
    if (!atleta) {
      console.log('Atleta não encontrado');
      return null;
    }
    
    console.log(`Atleta encontrado: ${atleta.nome}`);
    
    // 2. Buscar os dados de presença
    let presencas: any[] = [];
    let presencasError = null;
    
    try {
      const result = await supabase
        .from('presencas')
        .select('*')
        .eq('atleta_id', atletaId);
      
      presencas = result.data || [];
      presencasError = result.error;
      
      // Se tiver erro de relação, vamos tentar com 'treinos_presencas'
      if (presencasError && presencasError.code === 'PGRST200') {
        console.log('Tentando buscar presenças na tabela treinos_presencas...');
        const alternativeResult = await supabase
          .from('treinos_presencas')
          .select('*')
          .eq('atleta_id', atletaId);
        
        presencas = alternativeResult.data || [];
        presencasError = alternativeResult.error;
      }
    } catch (error: any) {
      // Se a tabela não existir, vamos usar um array vazio
      if (error?.code === '42P01' || (presencasError && presencasError.code === '42P01')) {
        console.log('Tabela presencas não existe, usando array vazio para atleta específico');
        presencas = [];
        presencasError = null;
      } else {
        console.error('Erro ao buscar presenças para atleta específico:', error);
        presencasError = error;
      }
    }
    
    if (presencasError && presencasError.code !== '42P01') {
      console.error('Erro ao buscar presenças para atleta específico:', presencasError);
      throw presencasError;
    }
    
    console.log(`Presenças encontradas para atleta específico: ${presencas?.length || 0}`);
    
    // 3. Buscar as avaliações de exercícios
    let avaliacoes: any[] = [];
    let avaliacoesError = null;
    
    try {
      const result = await supabase
        .from('avaliacoes_exercicios')
        .select('*')
        .eq('atleta_id', atletaId);
      
      avaliacoes = result.data || [];
      avaliacoesError = result.error;
    } catch (error: any) {
      // Se a tabela não existir, vamos usar um array vazio
      if (error?.code === '42P01' || (avaliacoesError && avaliacoesError.code === '42P01')) {
        console.log('Tabela avaliacoes_exercicios não existe, usando array vazio para atleta específico');
        avaliacoes = [];
        avaliacoesError = null;
      } else {
        console.error('Erro ao buscar avaliações para atleta específico:', error);
        avaliacoesError = error;
      }
    }
    
    if (avaliacoesError && avaliacoesError.code !== '42P01') {
      console.error('Erro ao buscar avaliações para atleta específico:', avaliacoesError);
      throw avaliacoesError;
    }
    
    console.log(`Avaliações encontradas para atleta específico: ${avaliacoes?.length || 0}`);
    
    // 3.1 Complementar com avaliações do localStorage (caso existam)
    const localAvaliacoes = getLocalStorageAvaliacoes();
    if (localAvaliacoes.length > 0) {
      // Filtrar apenas avaliações deste atleta
      const filteredLocalAvaliacoes = localAvaliacoes.filter(a => a.atleta_id === atletaId);
      console.log(`Encontradas ${filteredLocalAvaliacoes.length} avaliações no localStorage para este atleta`);
      
      // Adicionar ao array de avaliações do banco de dados
      avaliacoes = [...avaliacoes, ...filteredLocalAvaliacoes];
    }
    
    // Calcular dados de presença ajustando para diferentes nomes de campos
    const totalPresencas = presencas?.length || 0;
    const presencasConfirmadas = presencas?.filter(p => {
      return p.presente === true || p.status === 'presente';
    }).length || 0;
    const percentualPresenca = totalPresencas > 0 
      ? (presencasConfirmadas / totalPresencas) * 100 
      : 0;
    
    // Processar avaliações por fundamento
    const avaliacoesPorFundamento: Record<string, {
      acertos: number;
      erros: number;
      total: number;
      percentualAcerto: number;
      ultimaData: string;
    }> = {};
    
    // Processar cada avaliação
    avaliacoes?.forEach(avaliacao => {
      const fundamento = avaliacao.fundamento.toLowerCase();
      
      if (!avaliacoesPorFundamento[fundamento]) {
        avaliacoesPorFundamento[fundamento] = {
          acertos: 0,
          erros: 0,
          total: 0,
          percentualAcerto: 0,
          ultimaData: avaliacao.timestamp
        };
      }
      
      // Adicionar dados da avaliação
      avaliacoesPorFundamento[fundamento].acertos += avaliacao.acertos;
      avaliacoesPorFundamento[fundamento].erros += avaliacao.erros;
      avaliacoesPorFundamento[fundamento].total += (avaliacao.acertos + avaliacao.erros);
      
      // Atualizar data mais recente
      if (avaliacao.timestamp && avaliacoesPorFundamento[fundamento].ultimaData) {
        try {
          const avaliacaoDate = new Date(avaliacao.timestamp);
          const ultimaDate = new Date(avaliacoesPorFundamento[fundamento].ultimaData);
          
          if (avaliacaoDate > ultimaDate) {
            avaliacoesPorFundamento[fundamento].ultimaData = avaliacao.timestamp;
          }
        } catch (dateError) {
          console.error('Erro ao processar datas:', dateError);
          // Em caso de erro, manter a data atual
        }
      }
    });
    
    // Não vamos mais criar fundamentos simulados se não existirem, apenas mostrar os que temos
    
    // Calcular percentuais de acerto para cada fundamento
    Object.keys(avaliacoesPorFundamento).forEach(fundamento => {
      const { acertos, total } = avaliacoesPorFundamento[fundamento];
      avaliacoesPorFundamento[fundamento].percentualAcerto = total > 0 
        ? (acertos / total) * 100 
        : 0;
    });
    
    // Calcular média geral de avaliações
    const totalAvaliacoes = avaliacoes?.length || 0;
    let somaPercentuais = 0;
    
    Object.values(avaliacoesPorFundamento).forEach(avaliacao => {
      somaPercentuais += avaliacao.percentualAcerto;
    });
    
    const mediaGeral = Object.keys(avaliacoesPorFundamento).length > 0
      ? somaPercentuais / Object.keys(avaliacoesPorFundamento).length
      : 0;
    
    // Formatar datas para exibição
    Object.keys(avaliacoesPorFundamento).forEach(fundamento => {
      try {
        const dataOriginal = avaliacoesPorFundamento[fundamento].ultimaData;
        if (dataOriginal) {
          const data = new Date(dataOriginal);
          avaliacoesPorFundamento[fundamento].ultimaData = data.toLocaleDateString('pt-BR');
        } else {
          avaliacoesPorFundamento[fundamento].ultimaData = 'N/A';
        }
      } catch (dateError) {
        console.error('Erro ao formatar data:', dateError);
        avaliacoesPorFundamento[fundamento].ultimaData = 'N/A';
      }
    });
    
    // Coletar últimas avaliações para histórico
    let ultimasAvaliacoes = [];
    try {
      if (avaliacoes.length > 0) {
        ultimasAvaliacoes = avaliacoes
          .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
          .slice(0, 5)
          .map(av => ({
            data: av.timestamp ? new Date(av.timestamp).toLocaleDateString('pt-BR') : 'N/A',
            treino: av.treino_id,
            fundamento: av.fundamento,
            acertos: av.acertos,
            erros: av.erros
          }));
      }
    } catch (evalError) {
      console.error('Erro ao processar últimas avaliações:', evalError);
      // Em caso de erro, retornar array vazio
    }
    
    console.log('Dados de desempenho do atleta processados com sucesso');
    
    // Retornar objeto com dados de performance do atleta
    return {
      atleta: {
        id: atleta.id,
        nome: atleta.nome,
        posicao: atleta.posicao,
        time: atleta.time,
        foto_url: atleta.foto_url,
        created_at: atleta.created_at,
        idade: atleta.idade,
        altura: atleta.altura
      },
      presenca: {
        total: totalPresencas,
        presentes: presencasConfirmadas,
        percentual: percentualPresenca
      },
      avaliacoes: {
        total: totalAvaliacoes,
        mediaNota: mediaGeral,
        porFundamento: avaliacoesPorFundamento
      },
      ultimasAvaliacoes
    };
  } catch (error) {
    console.error('Erro ao buscar desempenho do atleta:', error);
    throw error;
  }
}

// Função para obter o desempenho de um aluno específico
export async function getStudentPerformance(studentId: string): Promise<StudentPerformance | null> {
  try {
    console.log(`Iniciando busca de desempenho para aluno ID: ${studentId}`);
    
    // 1. Buscar o aluno
    const { data: student, error: studentError } = await supabase
      .from('athletes')
      .select('*')
      .eq('id', studentId)
      .single();
    
    if (studentError) {
      console.error('Erro ao buscar aluno:', studentError);
      throw studentError;
    }
    
    if (!student) {
      console.log('Aluno não encontrado');
      return null;
    }
    
    // 2. Buscar os dados de presença
    let presencas: any[] = [];
    let presencasError = null;
    
    try {
      const result = await supabase
        .from('presencas')
        .select('*')
        .eq('atleta_id', studentId);
      
      presencas = result.data || [];
      presencasError = result.error;

      // Se tiver erro de relação, vamos tentar com 'treinos_presencas'
      if (presencasError && presencasError.code === 'PGRST200') {
        console.log('Tentando buscar presenças na tabela treinos_presencas...');
        const alternativeResult = await supabase
          .from('treinos_presencas')
          .select('*')
          .eq('atleta_id', studentId);
        
        presencas = alternativeResult.data || [];
        presencasError = alternativeResult.error;
      }
    } catch (error: any) {
      console.error('Erro ao buscar presenças:', error);
      presencasError = error;
    }
    
    if (presencasError) {
      console.error('Erro ao buscar presenças:', presencasError);
      throw presencasError;
    }
    
    // 3. Buscar avaliações
    const { data: avaliacoes, error: avaliacoesError } = await supabase
      .from('performance_evaluations')
      .select('*')
      .eq('atleta_id', studentId);
    
    if (avaliacoesError) {
      console.error('Erro ao buscar avaliações:', avaliacoesError);
      throw avaliacoesError;
    }
    
    // 4. Buscar metas alcançadas
    const { data: metas, error: metasError } = await supabase
      .from('metas')
      .select('*')
      .eq('atleta_id', studentId)
      .eq('concluida', true);
    
    if (metasError) {
      console.error('Erro ao buscar metas:', metasError);
      throw metasError;
    }
    
    // 5. Processar dados
    const totalTreinos = presencas.length;
    const treinosPresentes = presencas.filter(p => p.presente === true || p.status === 'presente').length;
    const frequencia = totalTreinos > 0 ? (treinosPresentes / totalTreinos) * 100 : 0;
    
    // Calcular média das avaliações
    let mediaAvaliacoes = 0;
    if (avaliacoes && avaliacoes.length > 0) {
      const soma = avaliacoes.reduce((acc, avaliacao) => {
        // Aqui estamos considerando que existe um campo nota ou pontuacao
        const nota = avaliacao.nota || avaliacao.pontuacao || 0;
        return acc + nota;
      }, 0);
      mediaAvaliacoes = soma / avaliacoes.length;
    }
    
    // Retornar dados processados
    return {
      frequency: frequencia,
      evolution: mediaAvaliacoes,
      completedTrainings: treinosPresentes,
      achievedGoals: metas ? metas.length : 0
    };
  } catch (error) {
    console.error('Erro ao buscar desempenho do aluno:', error);
    throw error;
  }
}

// Função para obter o histórico de treinos de um estudante
export async function getTrainingHistory(studentId: string): Promise<any[]> {
  try {
    if (!studentId) {
      console.error("ID do estudante não especificado");
      return [];
    }
    
    // Tentamos buscar da tabela alternativa 'treinos_presencas' sem join
    try {
      const { data: presencasData, error: presencasError } = await supabase
        .from('treinos_presencas')
        .select('*')
        .eq('atleta_id', studentId)
        .order('created_at', { ascending: false });

      // Se conseguimos buscar e temos dados, usamos esses
      if (!presencasError && presencasData && presencasData.length > 0) {
        console.log(`Encontrados ${presencasData.length} registros de presença na tabela 'treinos_presencas'`);
        
        // Extrair IDs de treinos
        const treinoIds = presencasData
          .filter(p => p.treino_id)
          .map(p => p.treino_id);
        
        // Se tiver IDs de treinos, buscar informações
        if (treinoIds.length > 0) {
          // Buscar os treinos pelos IDs
          const { data: treinosData, error: treinosError } = await supabase
            .from('treinos')
            .select('id, nome, data')
            .in('id', treinoIds);
            
          // Criar mapa para acesso rápido
          const treinosMap = new Map();
          if (!treinosError && treinosData && treinosData.length > 0) {
            treinosData.forEach(treino => treinosMap.set(treino.id, treino));
          }
          
          // Mapear resultados
          return presencasData.map(presenca => {
            const presencaStatus = presenca.presente !== undefined ? presenca.presente : false;
            const treino = treinosMap.get(presenca.treino_id);
            
            let dataFormatada = 'Data não disponível';
            if (treino?.data) {
              dataFormatada = new Date(treino.data).toLocaleDateString('pt-BR');
            } else if (presenca.data) {
              dataFormatada = new Date(presenca.data).toLocaleDateString('pt-BR');
            }
            
            return {
              id: presenca.id,
              date: dataFormatada,
              type: treino?.nome || 'Treino',
              duration: 90, // Tempo médio estimado para um treino
              status: presencaStatus ? 'completed' : 'incomplete'
            };
          });
        } else {
          // Caso não tenha IDs de treinos, retornar dados básicos
          return presencasData.map(presenca => {
            const presencaStatus = presenca.presente !== undefined ? presenca.presente : false;
            
            return {
              id: presenca.id,
              date: presenca.data ? new Date(presenca.data).toLocaleDateString('pt-BR') : 'Data não disponível',
              type: 'Treino',
              duration: 90, // Tempo médio estimado para um treino
              status: presencaStatus ? 'completed' : 'incomplete'
            };
          });
        }
      }
    } catch (error) {
      console.log("Erro ao buscar na tabela 'treinos_presencas'", error);
    }

    // Tentamos buscar da tabela alternativa 'presencas' sem join
    try {
      const { data: presencasData, error: presencasError } = await supabase
        .from('presencas')
        .select('*')
        .eq('atleta_id', studentId)
        .order('created_at', { ascending: false });

      // Se conseguimos buscar e temos dados, usamos esses
      if (!presencasError && presencasData && presencasData.length > 0) {
        console.log(`Encontrados ${presencasData.length} registros de presença na tabela 'presencas'`);
        
        // Extrair IDs de treinos
        const treinoIds = presencasData
          .filter(p => p.treino_id)
          .map(p => p.treino_id);
        
        // Se tiver IDs de treinos, buscar informações
        if (treinoIds.length > 0) {
          // Buscar os treinos pelos IDs
          const { data: treinosData, error: treinosError } = await supabase
            .from('treinos')
            .select('id, nome, data')
            .in('id', treinoIds);
            
          // Criar mapa para acesso rápido
          const treinosMap = new Map();
          if (!treinosError && treinosData && treinosData.length > 0) {
            treinosData.forEach(treino => treinosMap.set(treino.id, treino));
          }
          
          // Mapear resultados
          return presencasData.map(presenca => {
            const presencaStatus = presenca.presente !== undefined ? presenca.presente : false;
            const treino = treinosMap.get(presenca.treino_id);
            
            let dataFormatada = 'Data não disponível';
            if (treino?.data) {
              dataFormatada = new Date(treino.data).toLocaleDateString('pt-BR');
            } else if (presenca.data) {
              dataFormatada = new Date(presenca.data).toLocaleDateString('pt-BR');
            }
            
            return {
              id: presenca.id,
              date: dataFormatada,
              type: treino?.nome || 'Treino',
              duration: 90, // Tempo médio estimado para um treino
              status: presencaStatus ? 'completed' : 'incomplete'
            };
          });
        } else {
          // Caso não tenha IDs de treinos, retornar dados básicos
          return presencasData.map(presenca => {
            const presencaStatus = presenca.presente !== undefined ? presenca.presente : false;
            
            return {
              id: presenca.id,
              date: presenca.data ? new Date(presenca.data).toLocaleDateString('pt-BR') : 'Data não disponível',
              type: 'Treino',
              duration: 90, // Tempo médio estimado para um treino
              status: presencaStatus ? 'completed' : 'incomplete'
            };
          });
        }
      }
    } catch (error) {
      console.log("Erro ao buscar na tabela 'presencas', tentando alternativa...", error);
    }

    // Tentamos buscar da tabela alternativa 'treinos_presencas' sem join
    try {
      const { data: presencasData, error: presencasError } = await supabase
        .from('treinos_presencas')
        .select('*')
        .eq('atleta_id', studentId)
        .order('created_at', { ascending: false });

      // Se conseguimos buscar e temos dados, usamos esses
      if (!presencasError && presencasData && presencasData.length > 0) {
        console.log(`Encontrados ${presencasData.length} registros de presença na tabela 'treinos_presencas'`);
        
        // Extrair IDs de treinos
        const treinoIds = presencasData
          .filter(p => p.treino_id)
          .map(p => p.treino_id);
        
        // Se tiver IDs de treinos, buscar informações
        if (treinoIds.length > 0) {
          // Buscar os treinos pelos IDs
          const { data: treinosData, error: treinosError } = await supabase
            .from('treinos')
            .select('id, nome, data')
            .in('id', treinoIds);
            
          // Criar mapa para acesso rápido
          const treinosMap = new Map();
          if (!treinosError && treinosData && treinosData.length > 0) {
            treinosData.forEach(treino => treinosMap.set(treino.id, treino));
          }
          
          // Mapear resultados
          return presencasData.map(presenca => {
            const presencaStatus = presenca.presente !== undefined ? presenca.presente : false;
            const treino = treinosMap.get(presenca.treino_id);
            
            let dataFormatada = 'Data não disponível';
            if (treino?.data) {
              dataFormatada = new Date(treino.data).toLocaleDateString('pt-BR');
            } else if (presenca.data) {
              dataFormatada = new Date(presenca.data).toLocaleDateString('pt-BR');
            }
            
            return {
              id: presenca.id,
              date: dataFormatada,
              type: treino?.nome || 'Treino',
              duration: 90, // Tempo médio estimado para um treino
              status: presencaStatus ? 'completed' : 'incomplete'
            };
          });
        } else {
          // Caso não tenha IDs de treinos, retornar dados básicos
          return presencasData.map(presenca => {
            const presencaStatus = presenca.presente !== undefined ? presenca.presente : false;
            
            return {
              id: presenca.id,
              date: presenca.data ? new Date(presenca.data).toLocaleDateString('pt-BR') : 'Data não disponível',
              type: 'Treino',
              duration: 90, // Tempo médio estimado para um treino
              status: presencaStatus ? 'completed' : 'incomplete'
            };
          });
        }
      }
    } catch (error) {
      console.log("Erro ao buscar na tabela 'treinos_presencas'", error);
    }
  } catch (error) {
    console.error('Erro ao buscar histórico de treinos:', error);
    return [];
  }
}

// Função para obter as metas de um estudante
export async function getStudentGoals(studentId: string): Promise<any[]> {
  try {
    // Verificar se temos uma tabela de metas
    let metas: any[] = [];
    let metasError = null;
    
    try {
      const result = await supabase
        .from('metas')
        .select('*')
        .eq('atleta_id', studentId);
      
      metas = result.data || [];
      metasError = result.error;
    } catch (error: any) {
      // Se a tabela não existir, retornamos um array vazio
      if (error?.code === '42P01' || (metasError && metasError.code === '42P01')) {
        console.log('Tabela metas não existe, retornando array vazio');
        return [];
      } else {
        console.error('Erro ao buscar metas:', error);
        metasError = error;
      }
    }
    
    if (metasError) {
      console.error('Erro ao buscar metas:', metasError);
      return [];
    }
    
    if (!metas || metas.length === 0) {
      console.log('Não há metas para este atleta');
      return [];
    }
    
    // Formatar dados para o componente
    return metas.map(meta => ({
      id: meta.id,
      title: meta.titulo,
      description: meta.descricao,
      targetDate: meta.data_alvo,
      progress: meta.progresso
    }));
  } catch (error) {
    console.error('Erro ao buscar metas do estudante:', error);
    return [];
  }
}

// Função para buscar avaliações salvas no localStorage
function getLocalStorageAvaliacoes(): any[] {
  try {
    // Tentar buscar da tabela avaliacoes_exercicios (formato compatível com este serviço)
    const avaliacoesExercicios = JSON.parse(localStorage.getItem('avaliacoes_exercicios') || '[]');
    
    // Tentar buscar também da tabela avaliacoes_fundamento (onde as avaliações são salvas originalmente)
    const avaliacoesFundamento = JSON.parse(localStorage.getItem('avaliacoes_fundamento') || '[]');
    
    // Se encontrou dados em avaliacoes_fundamento, converter para o formato esperado por este serviço
    let convertedAvaliacoes: any[] = [];
    if (avaliacoesFundamento.length > 0) {
      convertedAvaliacoes = avaliacoesFundamento.map((avaliacao: any) => {
        return {
          ...avaliacao,
          timestamp: avaliacao.timestamp || new Date().toISOString() // Garantir que há timestamp
        };
      });
    }
    
    // Combinar as avaliações, removendo duplicatas por ID
    const allAvaliacoes = [...avaliacoesExercicios];
    
    // Adicionar apenas as avaliações de avaliacoes_fundamento que não existem em avaliacoes_exercicios
    for (const avaliacao of convertedAvaliacoes) {
      if (!allAvaliacoes.some(a => a.id === avaliacao.id)) {
        allAvaliacoes.push(avaliacao);
      }
    }
    
    return allAvaliacoes;
  } catch (error) {
    console.error('Erro ao buscar avaliações do localStorage:', error);
    return [];
  }
}

/**
 * Busca o histórico completo de treinos de um atleta específico
 * @param athleteId ID do atleta
 * @returns Array com o histórico de treinos
 */
export async function getHistoricoTreinoPorAtleta(athleteId: string): Promise<HistoricoTreinoPorAtleta[]> {
  try {
    if (!athleteId) {
      console.error("ID do atleta não especificado");
      return [];
    }

    console.log(`Buscando histórico de treinos para o atleta ${athleteId}`);
    
    // Primeiro tentamos buscar da tabela 'presencas' com join para treinos
    try {
      const result = await supabase
        .from('presencas')
        .select(`
          *,
          treinos (*)
        `)
        .eq('atleta_id', athleteId)
        .order('created_at', { ascending: false });
      
      // Se conseguimos buscar com sucesso e temos dados, usamos esses
      if (!result.error && result.data && result.data.length > 0) {
        console.log(`Encontrados ${result.data.length} registros de presença na tabela 'presencas'`);
        
        return mapearPresencasParaHistorico(result.data, athleteId);
      }
    } catch (error) {
      console.log("Erro ao buscar na tabela 'presencas', tentando alternativa...", error);
    }
    
    // Se não conseguimos da primeira tabela, tentamos da 'treinos_presencas' com join para treinos
    console.log('Buscando na tabela treinos_presencas...');
    
    // 1. Buscar presenças do atleta sem join para evitar erro de FK
    const { data: presencas, error: presencasError } = await supabase
      .from('treinos_presencas')
      .select('*')
      .eq('atleta_id', athleteId)
      .order('created_at', { ascending: false });
    
    if (presencasError) {
      console.error('Erro ao buscar presenças:', presencasError);
      return [];
    }
    
    if (!presencas || presencas.length === 0) {
      console.log('Nenhuma presença encontrada para o atleta');
      return [];
    }
    
    console.log(`Encontrados ${presencas.length} registros de presença`);

    // 2. Extrair os IDs dos treinos para buscar informações adicionais
    const treinoIds = presencas
      .filter(p => p.treino_id)
      .map(p => p.treino_id);
    
    // Buscar os dados dos treinos relacionados em uma consulta separada
    const { data: treinos, error: treinosError } = await supabase
      .from('treinos')
      .select('id, nome, data, local')
      .in('id', treinoIds);
    
    if (treinosError) {
      console.error('Erro ao buscar treinos relacionados:', treinosError);
      // Continuar mesmo com erro
    }
    
    // Criar mapa para acesso rápido aos treinos
    const treinosMap = new Map();
    if (treinos && treinos.length > 0) {
      treinos.forEach(treino => treinosMap.set(treino.id, treino));
    }
    
    // 3. Buscar avaliações do atleta para coletar dados de desempenho
    const { data: avaliacoes, error: avaliacoesError } = await supabase
      .from('avaliacoes_exercicios')
      .select('*')
      .eq('atleta_id', athleteId);
    
    if (avaliacoesError) {
      console.error('Erro ao buscar avaliações:', avaliacoesError);
      // Continuar mesmo com erro
    }
    
    // 4. Complementar com avaliações do localStorage
    const localAvaliacoes = getLocalStorageAvaliacoes()
      .filter(a => a.atleta_id === athleteId);
    
    // Combinar todas as avaliações
    const todasAvaliacoes = [...(avaliacoes || []), ...localAvaliacoes];
    
    // 5. Mapear os dados para o formato esperado
    const historicoTreinos: HistoricoTreinoPorAtleta[] = presencas.map(presenca => {
      // Verificar o nome do campo treino_id (pode variar entre implementações)
      const treinoId = presenca.treino_id || '';
      
      // Buscar informações do treino
      const treino = treinosMap.get(treinoId);
      
      // Encontrar as avaliações relacionadas a este treino
      const avaliacoesTreino = todasAvaliacoes.filter(a => 
        a.treino_id === treinoId
      );
      
      // Agrupar avaliações por fundamento
      const fundamentosMap: Record<string, { acertos: number, erros: number }> = {};
      
      avaliacoesTreino.forEach(avaliacao => {
        const fundamento = avaliacao?.fundamento 
          ? avaliacao.fundamento.toLowerCase() 
          : 'desconhecido';
        
        if (!fundamentosMap[fundamento]) {
          fundamentosMap[fundamento] = {
            acertos: 0,
            erros: 0
          };
        }
        
        fundamentosMap[fundamento].acertos += (avaliacao.acertos || 0);
        fundamentosMap[fundamento].erros += (avaliacao.erros || 0);
      });
      
      // Converter o mapa de fundamentos para array
      const fundamentos = Object.entries(fundamentosMap).map(([fundamento, dados]) => ({
        fundamento,
        acertos: dados.acertos,
        erros: dados.erros
      }));
      
      // Verificar o nome do campo para presença
      const presencaStatus = presenca.presente !== undefined 
        ? presenca.presente 
        : false;
      
      let dataFormatada = 'Data não disponível';
      if (treino?.data) {
        dataFormatada = new Date(treino.data).toLocaleDateString('pt-BR');
      } else if (presenca.data) {
        dataFormatada = new Date(presenca.data).toLocaleDateString('pt-BR');
      }
      
      return {
        treinoId: treinoId || 'desconhecido',
        nomeTreino: treino?.nome || 'Treino sem nome',
        data: treino?.data 
          ? new Date(treino.data).toISOString() // Mantendo o formato ISO para que a formatação seja feita no componente 
          : new Date().toISOString(),
        local: treino?.local || 'Local não especificado',
        presenca: presencaStatus,
        justificativa: presenca.justificativa,
        fundamentos
      };
    });
    
    console.log(`Histórico de treinos processado com ${historicoTreinos.length} registros`);
    return historicoTreinos;
  } catch (error) {
    console.error('Erro ao buscar histórico de treinos:', error);
    // Retornar array vazio em vez de lançar o erro
    return [];
  }
}

// Função auxiliar para mapear dados de presenças para o formato esperado
function mapearPresencasParaHistorico(presencas: any[], athleteId: string): HistoricoTreinoPorAtleta[] {
  try {
    // Buscar avaliações do atleta para complementar
    const localAvaliacoes = getLocalStorageAvaliacoes()
      .filter(a => a.atleta_id === athleteId);
    
    return presencas.map(presenca => {
      // Encontrar treino associado
      const treino = presenca.treinos;
      
      // Verificar se temos avaliações para este treino
      const avaliacoesTreino = localAvaliacoes.filter(a => 
        a.treino_id === presenca.treino_id
      );
      
      // Agrupar avaliações por fundamento
      const fundamentosMap: Record<string, { acertos: number, erros: number }> = {};
      
      avaliacoesTreino.forEach(avaliacao => {
        const fundamento = avaliacao?.fundamento 
          ? avaliacao.fundamento.toLowerCase() 
          : 'desconhecido';
        
        if (!fundamentosMap[fundamento]) {
          fundamentosMap[fundamento] = {
            acertos: 0,
            erros: 0
          };
        }
        
        fundamentosMap[fundamento].acertos += (avaliacao.acertos || 0);
        fundamentosMap[fundamento].erros += (avaliacao.erros || 0);
      });
      
      // Converter o mapa de fundamentos para array
      const fundamentos = Object.entries(fundamentosMap).map(([fundamento, dados]) => ({
        fundamento,
        acertos: dados.acertos,
        erros: dados.erros
      }));
      
      return {
        treinoId: presenca.treino_id || 'desconhecido',
        nomeTreino: treino?.nome || 'Treino sem nome',
        data: treino?.data 
          ? new Date(treino.data).toLocaleDateString('pt-BR') 
          : presenca.data 
            ? new Date(presenca.data).toLocaleDateString('pt-BR')
            : 'Data não disponível',
        local: treino?.local || 'Local não especificado',
        presenca: presenca.presente !== undefined ? presenca.presente : false,
        justificativa: presenca.justificativa,
        fundamentos
      };
    });
  } catch (error) {
    console.error('Erro ao mapear presenças para histórico:', error);
    return [];
  }
}
