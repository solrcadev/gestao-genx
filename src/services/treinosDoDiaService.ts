import { supabase } from '@/lib/supabase';
import { TeamType } from '@/types';

export interface TreinoDoDia {
  id: string;
  treino_id: string;
  data: string;
  aplicado: boolean;
  created_at: string;
  treino?: any;
  exercicios?: any[];
  presencas?: any[];
}

export interface Presenca {
  id: string;
  treino_do_dia_id: string;
  atleta_id: string;
  presente: boolean;
  justificativa?: string;
  created_at: string;
  atleta?: any;
}

export interface ExercicioAvaliacao {
  id: string;
  treino_do_dia_id: string;
  exercicio_id: string;
  atleta_id: string;
  fundamento: string;
  acertos: number;
  erros: number;
  created_at: string;
}

// Fetch all treinos do dia
export const fetchTreinosDosDia = async (): Promise<TreinoDoDia[]> => {
  const { data, error } = await supabase
    .from('treinos_do_dia')
    .select(`
      *,
      treino:treino_id (*)
    `)
    .order('data', { ascending: false });

  if (error) {
    console.error('Error fetching treinos do dia:', error);
    throw new Error(error.message);
  }

  return data || [];
};

// Get treino do dia by date
export const getTreinoDoDia = async (date: Date): Promise<TreinoDoDia | null> => {
  const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  const { data, error } = await supabase
    .from('treinos_do_dia')
    .select(`
      *,
      treino:treino_id (
        id,
        nome,
        local,
        data,
        descricao,
        time
      )
    `)
    .eq('data', formattedDate)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned, which is fine
      return null;
    }
    console.error('Error fetching treino do dia:', error);
    throw new Error(error.message);
  }

  return data;
};

// Create treino do dia
export const createTreinoDoDia = async (treinoId: string, date: Date): Promise<TreinoDoDia> => {
  const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  const { data, error } = await supabase
    .from('treinos_do_dia')
    .insert([
      {
        treino_id: treinoId,
        data: formattedDate,
        aplicado: false
      }
    ])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating treino do dia:', error);
    throw new Error(error.message);
  }
  
  return data;
};

// Fetch a specific treino do dia with its training details
export const fetchTreinoDoDia = async (id: string) => {
  const { data, error } = await supabase
    .from('treinos_do_dia')
    .select(`
      *,
      treino:treino_id (
        id,
        nome,
        local,
        data,
        descricao,
        time
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching treino do dia:', error);
    throw new Error(error.message);
  }

  if (!data?.treino?.time) {
    console.warn('Treino do dia sem time definido:', data);
  }

  return data;
};

// Define ou substitui o treino do dia
export const definirTreinoDoDia = async (treinoId: string, data: Date = new Date()): Promise<TreinoDoDia> => {
  const formattedDate = data.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  // Check if there is already a treino for this date
  const { data: existingTreino, error: checkError } = await supabase
    .from('treinos_do_dia')
    .select('*')
    .eq('data', formattedDate);
    
  if (checkError) {
    console.error('Error checking existing treino do dia:', checkError);
    throw new Error(checkError.message);
  }
  
  // Se já existe um treino para a data, exclui-o
  if (existingTreino && existingTreino.length > 0) {
    console.log('Substituindo treino existente para a data:', formattedDate);
    
    // Delete existing treino do dia
    const { error: deleteError } = await supabase
      .from('treinos_do_dia')
      .delete()
      .eq('data', formattedDate);
      
    if (deleteError) {
      console.error('Erro ao excluir treino do dia existente:', deleteError);
      throw new Error('Não foi possível substituir o treino existente. ' + deleteError.message);
    }
  }
  
  // Insert new treino do dia
  const { data: newTreinoDoDia, error } = await supabase
    .from('treinos_do_dia')
    .insert([
      {
        treino_id: treinoId,
        data: formattedDate,
        aplicado: false
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Error setting treino do dia:', error);
    throw new Error(error.message);
  }

  return newTreinoDoDia;
};

// Set a treino for the current day
export const setTreinoParaDia = async (treinoId: string, data: Date = new Date()): Promise<TreinoDoDia> => {
  const formattedDate = data.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  // Check if there is already a treino for this date
  const { data: existingTreino, error: checkError } = await supabase
    .from('treinos_do_dia')
    .select('*')
    .eq('data', formattedDate);
    
  if (checkError) {
    console.error('Error checking existing treino do dia:', checkError);
    throw new Error(checkError.message);
  }
  
  // If there's already a treino for this date, return an error
  if (existingTreino && existingTreino.length > 0) {
    throw new Error('Já existe um treino definido para esta data.');
  }
  
  // Insert new treino do dia
  const { data: newTreinoDoDia, error } = await supabase
    .from('treinos_do_dia')
    .insert([
      {
        treino_id: treinoId,
        data: formattedDate,
        aplicado: false
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Error setting treino do dia:', error);
    throw new Error(error.message);
  }

  return newTreinoDoDia;
};

// Conclude a treino do dia
export const concluirTreinoDoDia = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('treinos_do_dia')
    .update({ aplicado: true })
    .eq('id', id);

  if (error) {
    console.error('Error concluding treino do dia:', error);
    throw new Error(error.message);
  }
};

// Fetch presences for a treino do dia
export const fetchPresencas = async (treinoDoDiaId: string): Promise<Presenca[]> => {
  const { data, error } = await supabase
    .from('treinos_presencas')
    .select('*')
    .eq('treino_do_dia_id', treinoDoDiaId);

  if (error) {
    console.error('Error fetching presences:', error);
    throw new Error(error.message);
  }

  return data || [];
};

// Fetch athletes with attendance
export const fetchPresencasAtletas = async (treinoDoDiaId: string) => {
  // First, get the treino do dia to determine the team (masculine or feminine)
  const { data: treinoDoDia, error: treinoError } = await supabase
    .from('treinos_do_dia')
    .select(`
      *,
      treino:treino_id (time)
    `)
    .eq('id', treinoDoDiaId)
    .single();

  if (treinoError) {
    console.error('Error fetching treino do dia:', treinoError);
    throw new Error(treinoError.message);
  }

  // Get all athletes for the team
  const { data: athletes, error: athletesError } = await supabase
    .from('athletes')
    .select('*')
    .eq('time', treinoDoDia.treino.time)
    .order('nome');

  if (athletesError) {
    console.error('Error fetching athletes:', athletesError);
    throw new Error(athletesError.message);
  }

  // Get existing presences
  const { data: presencas, error: presencasError } = await supabase
    .from('treinos_presencas')
    .select('*')
    .eq('treino_do_dia_id', treinoDoDiaId);

  if (presencasError) {
    console.error('Error fetching presences:', presencasError);
    throw new Error(presencasError.message);
  }

  // Map athletes with their presence status
  const result = athletes.map(athlete => {
    const presence = presencas?.find(p => p.atleta_id === athlete.id);
    return {
      atleta: athlete,
      presente: presence ? presence.presente : true, // Default to present
      justificativa: presence?.justificativa || '',
      id: presence?.id
    };
  });

  return result;
};

// Register presence for an athlete
export const registrarPresenca = async ({
  treinoDoDiaId,
  atletaId,
  presente,
  justificativa
}: {
  treinoDoDiaId: string;
  atletaId: string;
  presente: boolean;
  justificativa?: string;
}): Promise<void> => {
  // Check if presence already exists
  const { data: existingPresence, error: checkError } = await supabase
    .from('treinos_presencas')
    .select('id')
    .eq('treino_do_dia_id', treinoDoDiaId)
    .eq('atleta_id', atletaId);

  if (checkError) {
    console.error('Error checking existing presence:', checkError);
    throw new Error(checkError.message);
  }

  if (existingPresence && existingPresence.length > 0) {
    // Update existing presence
    const { error } = await supabase
      .from('treinos_presencas')
      .update({
        presente,
        justificativa: presente ? null : justificativa
      })
      .eq('id', existingPresence[0].id);

    if (error) {
      console.error('Error updating presence:', error);
      throw new Error(error.message);
    }
  } else {
    // Insert new presence
    const { error } = await supabase
      .from('treinos_presencas')
      .insert([
        {
          treino_do_dia_id: treinoDoDiaId,
          atleta_id: atletaId,
          presente,
          justificativa: presente ? null : justificativa
        }
      ]);

    if (error) {
      console.error('Error registering presence:', error);
      throw new Error(error.message);
    }
  }
};

// Register presences in batch
export const registrarPresencasEmLote = async ({
  treinoDoDiaId,
  presences
}: {
  treinoDoDiaId: string;
  presences: Array<{
    atleta_id: string;
    presente: boolean;
    justificativa?: string;
    id?: string;
  }>;
}): Promise<void> => {
  // Process each presence separately (upsert)
  for (const presence of presences) {
    if (presence.id) {
      // Update existing presence
      const { error } = await supabase
        .from('treinos_presencas')
        .update({
          presente: presence.presente,
          justificativa: presence.presente ? null : presence.justificativa
        })
        .eq('id', presence.id);

      if (error) {
        console.error('Error updating presence in batch:', error);
        throw new Error(error.message);
      }
    } else {
      // Insert new presence
      const { error } = await supabase
        .from('treinos_presencas')
        .insert([
          {
            treino_do_dia_id: treinoDoDiaId,
            atleta_id: presence.atleta_id,
            presente: presence.presente,
            justificativa: presence.presente ? null : presence.justificativa
          }
        ]);

      if (error) {
        console.error('Error inserting presence in batch:', error);
        throw new Error(error.message);
      }
    }
  }
};

// Start an exercise
export const iniciarExercicio = async ({ 
  treinoDoDiaId, 
  exercicioId 
}: { 
  treinoDoDiaId: string;
  exercicioId: string;
}): Promise<void> => {
  // We just need to mark that the exercise is being executed
  // The actual timing will be tracked on the client side
  // Nothing to update in the database at this point
};

// Complete an exercise
export const concluirExercicio = async ({ 
  treinoDoDiaId, 
  exercicioId,
  tempoReal
}: { 
  treinoDoDiaId: string;
  exercicioId: string;
  tempoReal: number;
}): Promise<void> => {
  const { error } = await supabase
    .from('treinos_exercicios')
    .update({
      concluido: true,
      tempo_real: tempoReal
    })
    .eq('id', exercicioId);

  if (error) {
    console.error('Error concluding exercise:', error);
    throw new Error(error.message);
  }
};

// Save exercise evaluation
export const salvarAvaliacaoExercicio = async ({
  treinoDoDiaId,
  exercicioId,
  atletaId,
  fundamento,
  acertos,
  erros
}: {
  treinoDoDiaId: string;
  exercicioId: string;
  atletaId: string;
  fundamento: string;
  acertos: number;
  erros: number;
}): Promise<void> => {
  try {
    // Primeiro, recupera o treino do dia para obter o treino_id
    const treinoDoDia = await fetchTreinoDoDia(treinoDoDiaId);
    console.log("Salvando avaliação para o treino:", treinoDoDiaId, "exercício:", exercicioId, "atleta:", atletaId);
    
    // Documentar o que está tentando salvar
    const avaliacaoData = {
      treino_id: treinoDoDia.treino_id,
      exercicio_id: exercicioId,
      atleta_id: atletaId,
      fundamento,
      acertos,
      erros,
      timestamp: new Date().toISOString() // Adicionando timestamp para compatibilidade com performanceService
    };
    
    console.log("Dados da avaliação a serem salvos:", avaliacaoData);
    
    // Primeiro tenta salvar na tabela original (avaliacoes_fundamento)
    let savedInOriginalTable = false;
    const originalResult = await supabase
      .from('avaliacoes_fundamento')
      .insert([avaliacaoData]);
      
    if (!originalResult.error) {
      savedInOriginalTable = true;
      console.log("Avaliação salva com sucesso na tabela avaliacoes_fundamento");
    } else {
      console.warn('Erro ao salvar na tabela avaliacoes_fundamento:', originalResult.error);
    }
    
    // Tenta salvar também na tabela usada pelo performanceService (avaliacoes_exercicios)
    let savedInPerformanceTable = false;
    const performanceResult = await supabase
      .from('avaliacoes_exercicios')
      .insert([avaliacaoData]);
      
    if (!performanceResult.error) {
      savedInPerformanceTable = true;
      console.log("Avaliação salva com sucesso na tabela avaliacoes_exercicios");
    } else {
      console.warn('Erro ao salvar na tabela avaliacoes_exercicios:', performanceResult.error);
    }
    
    // Se não conseguiu salvar em nenhuma das tabelas, usa o fallback para localStorage
    if (!savedInOriginalTable && !savedInPerformanceTable) {
      console.warn('RLS error saving evaluation, using local storage fallback');
      // Salvar em localStorage como fallback quando autenticação não está disponível
      const tempId = `local_${Date.now()}_${atletaId}_${fundamento}`;
      saveEvaluationToLocalStorage({
        id: tempId,
        ...avaliacaoData
      });
      
      // Também salvar uma cópia no localStorage específico para performance
      saveEvaluationToLocalStorageForPerformance({
        id: tempId,
        ...avaliacaoData
      });
    }
  } catch (error) {
    console.error('Error in salvarAvaliacaoExercicio:', error);
    throw error;
  }
};

// Função auxiliar para salvar avaliação no localStorage (fallback para RLS)
const saveEvaluationToLocalStorage = (evaluation: {
  id: string;
  treino_id: string;
  exercicio_id: string;
  atleta_id: string;
  fundamento: string;
  acertos: number;
  erros: number;
  timestamp?: string;
}) => {
  try {
    // Buscar avaliações existentes
    const existingEvals = JSON.parse(localStorage.getItem('avaliacoes_fundamento') || '[]');
    
    // Verificar se já existe uma avaliação com este ID
    const existingIndex = existingEvals.findIndex((e: any) => e.id === evaluation.id);
    
    if (existingIndex >= 0) {
      // Atualizar avaliação existente
      existingEvals[existingIndex] = evaluation;
    } else {
      // Adicionar nova avaliação
      existingEvals.push(evaluation);
    }
    
    // Salvar no localStorage
    localStorage.setItem('avaliacoes_fundamento', JSON.stringify(existingEvals));
    console.log('Evaluation saved to localStorage successfully');
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

// Função auxiliar para salvar avaliação no localStorage para performance (para garantir que vai ser lido)
const saveEvaluationToLocalStorageForPerformance = (evaluation: {
  id: string;
  treino_id: string;
  exercicio_id: string;
  atleta_id: string;
  fundamento: string;
  acertos: number;
  erros: number;
  timestamp?: string;
}) => {
  try {
    // Buscar avaliações existentes
    const existingEvals = JSON.parse(localStorage.getItem('avaliacoes_exercicios') || '[]');
    
    // Verificar se já existe uma avaliação com este ID
    const existingIndex = existingEvals.findIndex((e: any) => e.id === evaluation.id);
    
    if (existingIndex >= 0) {
      // Atualizar avaliação existente
      existingEvals[existingIndex] = evaluation;
    } else {
      // Adicionar nova avaliação
      existingEvals.push(evaluation);
    }
    
    // Salvar no localStorage
    localStorage.setItem('avaliacoes_exercicios', JSON.stringify(existingEvals));
    console.log('Evaluation saved to localStorage for performance successfully');
  } catch (error) {
    console.error('Error saving to localStorage for performance:', error);
  }
};

export const salvarAvaliacoesEmLote = async (avaliacoes: Array<{
  treinoDoDiaId: string;
  exercicioId: string;
  atletaId: string;
  fundamento: string;
  acertos: number;
  erros: number;
}>): Promise<void> => {
  try {
    // Process each evaluation
    for (const avaliacao of avaliacoes) {
      const { treinoDoDiaId, exercicioId, atletaId, fundamento, acertos, erros } = avaliacao;
      await salvarAvaliacaoExercicio({ treinoDoDiaId, exercicioId, atletaId, fundamento, acertos, erros });
    }
    
    return Promise.resolve();
  } catch (error) {
    console.error('Error saving batch evaluations:', error);
    throw error;
  }
};

// Fetch current active treino do dia (mantida para compatibilidade)
export const fetchTreinoAtual = async (id: string) => {
  // Primeiro, obtem o treino do dia
  const treinoDoDia = await fetchTreinoDoDia(id);
  
  // Em seguida, obtém os exercícios
  const { data: exercicios, error: exerciciosError } = await supabase
    .from('treinos_exercicios')
    .select(`
      *,
      exercicio:exercicio_id (*)
    `)
    .eq('treino_id', treinoDoDia.treino_id)
    .order('ordem', { ascending: true });

  if (exerciciosError) {
    console.error('Error fetching exercises for treino:', exerciciosError);
    throw new Error(exerciciosError.message);
  }

  // Por fim, obtém as presenças
  const { data: presencas, error: presencasError } = await supabase
    .from('treinos_presencas')
    .select('*')
    .eq('treino_do_dia_id', id);

  if (presencasError) {
    console.error('Error fetching presences for treino do dia:', presencasError);
    throw new Error(presencasError.message);
  }

  return {
    ...treinoDoDia,
    exercicios: exercicios || [],
    presencas: presencas || []
  };
};

// Buscar os exercícios vinculados a um treino do dia
export const getExerciciosTreinoDoDia = async (treinoDoDiaId: string) => {
  try {
    // Primeiro obtenha o treino do dia para identificar o treino_id
    const { data: treinoDoDia, error: treinoError } = await supabase
      .from('treinos_do_dia')
      .select('treino_id')
      .eq('id', treinoDoDiaId)
      .single();

    if (treinoError) {
      console.error('Erro ao buscar treino do dia:', treinoError);
      throw new Error(treinoError.message);
    }

    console.log('Treino ID recuperado:', treinoDoDia.treino_id);

    // Primeiro, verificar a estrutura das tabelas
    const { data: exercicioInfo, error: infoError } = await supabase
      .from('exercicios')
      .select('*')
      .limit(1);

    if (!infoError && exercicioInfo && exercicioInfo.length > 0) {
      console.log('Estrutura da tabela exercicios:', Object.keys(exercicioInfo[0]));
    }

    const { data: treinosExerciciosInfo, error: treinosExError } = await supabase
      .from('treinos_exercicios')
      .select('*')
      .limit(1);

    if (!treinosExError && treinosExerciciosInfo && treinosExerciciosInfo.length > 0) {
      console.log('Estrutura da tabela treinos_exercicios:', Object.keys(treinosExerciciosInfo[0]));
    }

    // Buscar os exercícios vinculados ao treino com todos os dados necessários
    const { data: exercicios, error: exerciciosError } = await supabase
      .from('treinos_exercicios')
      .select(`
        *,
        exercicio:exercicio_id(*)
      `)
      .eq('treino_id', treinoDoDia.treino_id)
      .order('ordem');

    if (exerciciosError) {
      console.error('Erro ao buscar exercícios do treino:', exerciciosError);
      throw new Error(exerciciosError.message);
    }

    console.log('Exercícios recuperados para o treino do dia:', exercicios);
    
    // Verificar o primeiro exercício para entender sua estrutura
    if (exercicios && exercicios.length > 0) {
      console.log('Estrutura do primeiro exercício:', exercicios[0]);
      console.log('Campos disponíveis no primeiro exercício:', Object.keys(exercicios[0]));
      if (exercicios[0].exercicio) {
        console.log('Campos disponíveis no exercicio associado:', Object.keys(exercicios[0].exercicio));
        console.log('Valor de tempo_estimado:', exercicios[0].exercicio.tempo_estimado);
      }
    }
    
    return exercicios || [];
  } catch (error) {
    console.error('Erro ao buscar exercícios do treino do dia:', error);
    throw error;
  }
};
