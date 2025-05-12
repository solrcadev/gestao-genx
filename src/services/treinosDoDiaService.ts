import { supabase } from '@/lib/supabase';
import { JustificativaTipo } from '@/hooks/attendance-hooks';

export interface TreinoDoDia {
  id: string;
  data: string;
  treino_id: string;
  aplicado?: boolean;
  treino?: {
    id: string;
    nome: string;
    local: string;
    horario: string;
    time: string;
  };
}

export interface PresencaAtleta {
  id?: string;
  atleta_id: string;
  treino_do_dia_id: string;
  presente: boolean;
  justificativa?: string | null;
  justificativa_tipo?: JustificativaTipo | null;
  indice_esforco?: number | null;
  atleta: {
    id: string;
    nome: string;
    posicao: string;
    time: string;
    foto_url?: string;
  };
}

/**
 * Fetch upcoming trainings for dashboard
 */
export const fetchProximosTreinos = async (limit = 3): Promise<TreinoDoDia[]> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data, error } = await supabase
      .from('treinos_do_dia')
      .select(`
        id,
        data,
        treino_id,
        aplicado,
        treino:treino_id(id, nome, local, horario, time)
      `)
      .gte('data', today.toISOString().split('T')[0])
      .order('data', { ascending: true })
      .limit(limit);
      
    if (error) throw error;
    
    return (data || []).map(item => ({
      id: item.id,
      data: item.data,
      treino_id: item.treino_id,
      aplicado: item.aplicado,
      treino: Array.isArray(item.treino) 
        ? item.treino[0] 
        : item.treino
    }));
  } catch (error) {
    console.error('Error fetching upcoming trainings:', error);
    return [];
  }
};

/**
 * Fetch training day by ID with detailed information
 */
export const fetchTreinoDoDiaById = async (id: string): Promise<TreinoDoDia | null> => {
  try {
    const { data, error } = await supabase
      .from('treinos_do_dia')
      .select(`
        id,
        data,
        treino_id,
        aplicado,
        treino:treino_id(id, nome, local, horario, time)
      `)
      .eq('id', id)
      .maybeSingle();
      
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching training day:', error);
      return null;
    }
    
    if (!data) {
      console.warn('Training day not found with ID:', id);
      return null;
    }
    
    return {
      id: data.id,
      data: data.data,
      treino_id: data.treino_id,
      aplicado: data.aplicado,
      treino: Array.isArray(data.treino) 
        ? data.treino[0] 
        : data.treino
    };
  } catch (error) {
    console.error('Error fetching training day:', error);
    return null;
  }
};

/**
 * Fetch attendance for a specific training day
 */
export const fetchPresencasAtletas = async (treinoDoDiaId: string): Promise<PresencaAtleta[]> => {
  try {
    // First attempt to fetch existing attendance records
    const { data: presencas, error: presencasError } = await supabase
      .from('treinos_presencas')
      .select(`
        id,
        atleta_id,
        treino_do_dia_id,
        presente,
        justificativa,
        justificativa_tipo,
        indice_esforco,
        atleta:athletes(id, nome, posicao, time, foto_url)
      `)
      .eq('treino_do_dia_id', treinoDoDiaId);
      
    if (presencasError) {
      console.error('Error fetching attendance records:', presencasError);
      return [];
    }
    
    // If attendance records already exist, return them
    if (presencas && presencas.length > 0) {
      return presencas.map(item => ({
        ...item,
        atleta: item.atleta as any
      })) as PresencaAtleta[];
    }
    
    // If no attendance records exist yet, fetch training day info to get the team
    const { data: treinoDoDia, error: treinoDoDiaError } = await supabase
      .from('treinos_do_dia')
      .select(`
        treino:treino_id(id, time)
      `)
      .eq('id', treinoDoDiaId)
      .maybeSingle(); // Changed from single() to maybeSingle() to avoid PGRST116 errors
      
    if (treinoDoDiaError) {
      console.error('Error fetching training day:', treinoDoDiaError);
      return [];
    }
    
    if (!treinoDoDia) {
      console.error('Training day not found with ID:', treinoDoDiaId);
      return [];
    }
    
    const time = treinoDoDia?.treino ? (treinoDoDia.treino as any).time : null;
    
    if (!time) {
      console.error('Could not determine team for training day');
      return [];
    }
    
    // Fetch athletes for the team
    const { data: atletas, error: atletasError } = await supabase
      .from('athletes')
      .select('id, nome, posicao, time, foto_url')
      .eq('time', time);
      
    if (atletasError) {
      console.error('Error fetching athletes:', atletasError);
      return [];
    }
    
    // Create default attendance records (all present)
    return atletas.map(atleta => ({
      id: undefined,
      atleta_id: atleta.id,
      treino_do_dia_id: treinoDoDiaId,
      presente: true,
      justificativa: null,
      justificativa_tipo: null,
      atleta
    })) as PresencaAtleta[];
  } catch (error) {
    console.error('Error in fetchPresencasAtletas:', error);
    return [];
  }
};

/**
 * Register multiple attendance records at once
 */
export const registrarPresencasEmLote = async ({ 
  treinoDoDiaId, 
  presences 
}: { 
  treinoDoDiaId: string; 
  presences: {
    atleta_id: string;
    presente: boolean;
    justificativa?: string | null;
    justificativa_tipo?: JustificativaTipo | null;
    id?: string;
  }[];
}) => {
  try {
    console.log(`[DEBUG] Registrando presenças em lote para treino ${treinoDoDiaId}. Total: ${presences.length}`);
    
    if (!treinoDoDiaId) {
      throw new Error("ID do treino do dia não informado");
    }
    
    if (!presences.length) {
      console.warn("[DEBUG] Nenhuma presença para salvar");
      return true;
    }
    
    const validPresences = presences.filter(p => {
      if (!p.atleta_id) {
        console.warn("[DEBUG] Presença sem ID de atleta válido, ignorando");
        return false;
      }
      return true;
    });
    
    if (!validPresences.length) {
      console.warn("[DEBUG] Nenhuma presença válida para salvar");
      return true;
    }
    
    // Separar registros a inserir e a atualizar
    const presencesToUpdate = validPresences.filter(p => p.id);
    const presencesToInsert = validPresences.filter(p => !p.id);
    
    console.log(`[DEBUG] Registros a inserir: ${presencesToInsert.length}, a atualizar: ${presencesToUpdate.length}`);
    
    // Inserir novos registros se houver
    if (presencesToInsert.length > 0) {
      const newRecords = presencesToInsert.map(({ id, ...rest }) => ({
        ...rest,
        treino_do_dia_id: treinoDoDiaId 
      }));
      
      const { error: insertError } = await supabase
        .from('treinos_presencas')
        .insert(newRecords);
      
      if (insertError) {
        console.error("[ERROR] Erro ao inserir registros de presença:", insertError);
        throw new Error(`Error inserting attendance records: ${insertError.message}`);
      }
    }
    
    // Atualizar registros existentes se houver
    for (const presence of presencesToUpdate) {
      const { id, ...updateData } = presence;
      
      const { error: updateError } = await supabase
        .from('treinos_presencas')
        .update({
          ...updateData,
          treino_do_dia_id: treinoDoDiaId
        })
        .eq('id', id);
      
      if (updateError) {
        console.error(`[ERROR] Erro ao atualizar registro de presença ${id}:`, updateError);
        throw new Error(`Error updating attendance record: ${updateError.message}`);
      }
    }
    
    console.log("[DEBUG] Todos os registros de presença foram salvos com sucesso");
    
    // Acionar o recálculo de índices de esforço após salvar
    try {
      const { error: refreshError } = await supabase.rpc('refresh_effort_indices');
      if (refreshError) {
        console.warn("[WARNING] Erro ao recalcular índices de esforço:", refreshError);
      }
    } catch (error) {
      console.warn("[WARNING] Exceção ao recalcular índices de esforço:", error);
      // Não lançamos erro aqui para não falhar a operação principal
    }
    
    return true;
  } catch (error) {
    console.error("[ERROR] Erro ao inserir registros de presença:", error);
    console.error("[ERROR] Erro completo ao registrar presenças:", error);
    throw error;
  }
};

/**
 * Calculate and update the effort index for an athlete
 */
export const updateAthleteEffortIndex = async (atletaId: string): Promise<number> => {
  try {
    // Get recent attendance records for the athlete
    const { data, error } = await supabase
      .from('treinos_presencas')
      .select('presente, justificativa_tipo')
      .eq('atleta_id', atletaId)
      .order('created_at', { ascending: false })
      .limit(20); // Consider last 20 trainings
      
    if (error || !data || data.length === 0) {
      console.error('Error fetching attendance for effort index:', error);
      return 0; // Neutral score if no data
    }
    
    // Calculate effort score based on attendance and justification type
    let totalScore = 0;
    data.forEach(record => {
      if (record.presente) {
        totalScore += 1; // Present = +1
      } else {
        // Apply different weights based on justification type
        switch (record.justificativa_tipo) {
          case JustificativaTipo.MOTIVO_LOGISTICO:
            totalScore += 0.5; // Logistical reason = +0.5
            break;
          case JustificativaTipo.MOTIVO_ACADEMICO:
          case JustificativaTipo.MOTIVO_PESSOAL:
          case JustificativaTipo.MOTIVO_SAUDE:
            totalScore += 0; // Other justified reasons = 0
            break;
          default:
            totalScore -= 1; // Absence without justification = -1
        }
      }
    });
    
    // Calculate index as average score
    const effortIndex = totalScore / data.length;
    
    // Ensure index is between -1 and 1
    const normalizedIndex = Math.max(-1, Math.min(1, effortIndex));
    
    // Update the athlete's effort index in the database
    const { error: updateError } = await supabase
      .from('athletes')
      .update({ indice_esforco: normalizedIndex })
      .eq('id', atletaId);
      
    if (updateError) {
      console.error('Error updating athlete effort index:', updateError);
    }
    
    return normalizedIndex;
  } catch (error) {
    console.error('Error calculating effort index:', error);
    return 0; // Default to neutral if error
  }
};

/**
 * Set a training for the day - used by the Trainings page
 */
export const definirTreinoDoDia = async (treinoId: string): Promise<{ id: string } | null> => {
  try {
    // Get training data to get the date
    const { data: treino, error: treinoError } = await supabase
      .from('treinos')
      .select('data')
      .eq('id', treinoId)
      .maybeSingle();
    
    if (treinoError) {
      console.error('Error fetching training:', treinoError);
      throw new Error(treinoError?.message || 'Erro ao buscar dados do treino');
    }

    if (!treino) {
      console.error('Training not found with ID:', treinoId);
      throw new Error('Treino não encontrado');
    }

    // Insert new record in treinos_do_dia
    const { data, error } = await supabase
      .from('treinos_do_dia')
      .insert({
        treino_id: treinoId,
        data: treino.data,
        aplicado: false
      })
      .select('id')
      .maybeSingle();
      
    if (error) {
      console.error('Error setting training for the day:', error);
      throw new Error(error.message);
    }
    
    if (!data) {
      console.error('Failed to create training day record');
      throw new Error('Falha ao criar registro de treino do dia');
    }
    
    return data;
  } catch (error) {
    console.error('Error in definirTreinoDoDia:', error);
    throw error;
  }
};

/**
 * Fetch training data for the specified date
 */
export const getTreinoDoDia = async (date: Date): Promise<any> => {
  try {
    // Format date to YYYY-MM-DD
    const formattedDate = date.toISOString().split('T')[0];
    
    // Fetch the training day for the specific date
    const { data, error } = await supabase
      .from('treinos_do_dia')
      .select(`
        id, 
        data, 
        aplicado,
        treino:treino_id(id, nome, local, horario, time)
      `)
      .eq('data', formattedDate)
      .maybeSingle(); // Changed from single() to maybeSingle() to avoid PGRST116 errors
      
    if (error && error.code !== 'PGRST116') { // Not found error code
      console.error("Error fetching training day:", error);
      throw error;
    }
    
    return data || null;
  } catch (error) {
    console.error("Error in getTreinoDoDia:", error);
    return null;
  }
};

/**
 * Set a training for a specific date
 */
export const setTreinoParaDia = async (treinoId: string, data?: Date): Promise<any> => {
  try {
    const dateToUse = data || new Date();
    const formattedDate = dateToUse.toISOString().split('T')[0];
    
    // Check if there's already a training for this date
    const { data: existingTreino, error: checkError } = await supabase
      .from('treinos_do_dia')
      .select('id')
      .eq('data', formattedDate);
      
    if (checkError) {
      console.error("Error checking existing training:", checkError);
      throw checkError;
    }
    
    // If exists, update
    if (existingTreino && existingTreino.length > 0) {
      const { data: updatedData, error: updateError } = await supabase
        .from('treinos_do_dia')
        .update({ treino_id: treinoId })
        .eq('data', formattedDate)
        .select();
        
      if (updateError) {
        throw updateError;
      }
      
      return updatedData;
    }
    
    // If not exists, create
    const { data: newData, error: insertError } = await supabase
      .from('treinos_do_dia')
      .insert({
        treino_id: treinoId,
        data: formattedDate
      })
      .select();
      
    if (insertError) {
      throw insertError;
    }
    
    return newData;
  } catch (error) {
    console.error("Error setting training for day:", error);
    throw error;
  }
};

/**
 * Fetch training data for the specified date
 */
export const fetchTreinoAtual = async (treinoDoDiaId: string): Promise<any> => {
  try {
    if (!treinoDoDiaId) {
      console.error("[treinosDoDiaService] fetchTreinoAtual: treinoDoDiaId é null ou undefined");
      return { exercicios: [] };
    }

    console.log("[treinosDoDiaService] Buscando informações do treino para treinoDoDiaId:", treinoDoDiaId);
    
    // First get the training day details
    const { data: treinoDoDia, error: treinoDoDiaError } = await supabase
      .from('treinos_do_dia')
      .select(`
        id, 
        data, 
        treino_id,
        aplicado,
        treino:treino_id(id, nome, local, horario, time)
      `)
      .eq('id', treinoDoDiaId)
      .maybeSingle(); // Use maybeSingle to avoid PGRST116 errors
      
    if (treinoDoDiaError) {
      console.error("[treinosDoDiaService] Erro ao buscar treino do dia:", treinoDoDiaError);
      return { exercicios: [] };
    }
    
    if (!treinoDoDia) {
      console.warn("[treinosDoDiaService] Treino do dia não encontrado para ID:", treinoDoDiaId);
      return { exercicios: [] };
    }
    
    if (!treinoDoDia.treino_id) {
      console.warn("[treinosDoDiaService] Treino do dia sem treino_id associado:", treinoDoDiaId);
      return { 
        id: treinoDoDiaId,
        data: treinoDoDia.data,
        treino_id: null,
        aplicado: treinoDoDia.aplicado,
        treino: null,
        exercicios: [] 
      };
    }
    
    console.log("[treinosDoDiaService] Buscando exercícios para treino_id:", treinoDoDia.treino_id);
    
    // Now fetch the exercises for this training
    const { data: exercicios, error: exerciciosError } = await supabase
      .from('treinos_exercicios')
      .select(`
        id,
        treino_id,
        exercicio_id,
        ordem,
        tempo_real,
        concluido,
        observacao,
        exercicio:exercicio_id(id, nome, descricao, categoria, tempo_estimado, imagem_url)
      `)
      .eq('treino_id', treinoDoDia.treino_id)
      .order('ordem');
      
    if (exerciciosError) {
      console.error("[treinosDoDiaService] Erro ao buscar exercícios:", exerciciosError);
      return { 
        ...treinoDoDia,
        exercicios: [] 
      };
    }
    
    // Validar os exercícios para garantir que todos os campos necessários existam
    const exerciciosValidados = (exercicios || []).filter(exercicio => {
      if (!exercicio.id) {
        console.warn("[treinosDoDiaService] Exercício sem ID encontrado");
        return false;
      }
      
      return true;
    });
    
    console.log("[treinosDoDiaService] Exercícios validados:", exerciciosValidados.length);
    
    // Return both the training day info and the exercises
    return {
      ...treinoDoDia,
      exercicios: exerciciosValidados || []
    };
  } catch (error) {
    console.error("[treinosDoDiaService] Erro ao buscar treino atual com exercícios:", error);
    return { exercicios: [] };
  }
};

/**
 * Marks an exercise as completed
 * @param params Object containing exercise data
 * @returns Promise with updated exercise data
 */
export const concluirExercicio = async (params: { exercicioId: string; tempoReal: number; treinoDoDiaId?: string }): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('treinos_exercicios')
      .update({ 
        concluido: true,
        tempo_real: params.tempoReal
      })
      .eq('id', params.exercicioId)
      .select();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error completing exercise:", error);
    throw error;
  }
};

export const desmarcarExercicio = async (params: { exercicioId: string }): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('treinos_exercicios')
      .update({ concluido: false })
      .eq('id', params.exercicioId)
      .select();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error unmarking exercise:", error);
    throw error;
  }
};

export const salvarAvaliacaoExercicio = async (avaliacaoData: any): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('training_evaluations')
      .insert(avaliacaoData)
      .select();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error saving exercise evaluation:", error);
    throw error;
  }
};

export const getExerciciosTreinoDoDia = async (treinoDoDiaId: string): Promise<any[]> => {
  try {
    if (!treinoDoDiaId) {
      console.error("[treinosDoDiaService] getExerciciosTreinoDoDia: treinoDoDiaId é null ou undefined");
      return [];
    }

    console.log("[treinosDoDiaService] Buscando exercícios para treinoDoDiaId:", treinoDoDiaId);
    
    // First, get the treino_id from the treino_do_dia
    const { data: treinoDoDia, error: treinoDoDiaError } = await supabase
      .from('treinos_do_dia')
      .select('treino_id')
      .eq('id', treinoDoDiaId)
      .maybeSingle(); // Use maybeSingle to avoid PGRST116 errors
      
    if (treinoDoDiaError) {
      console.error("[treinosDoDiaService] Erro ao buscar treino do dia:", treinoDoDiaError);
      return [];
    }
    
    if (!treinoDoDia) {
      console.warn("[treinosDoDiaService] Treino do dia não encontrado para ID:", treinoDoDiaId);
      return [];
    }
    
    if (!treinoDoDia.treino_id) {
      console.warn("[treinosDoDiaService] Treino do dia sem treino_id associado:", treinoDoDiaId);
      return [];
    }
    
    console.log("[treinosDoDiaService] Usando treino_id para buscar exercícios:", treinoDoDia.treino_id);
    
    // Now fetch the exercises for that training with detailed data
    const { data: exercicios, error: exerciciosError } = await supabase
      .from('treinos_exercicios')
      .select(`
        id,
        treino_id,
        exercicio_id,
        ordem,
        tempo_real,
        concluido,
        observacao,
        exercicio:exercicio_id(
          id, 
          nome, 
          descricao, 
          categoria, 
          tempo_estimado, 
          imagem_url, 
          fundamentos,
          checklist_tecnico
        )
      `)
      .eq('treino_id', treinoDoDia.treino_id)
      .order('ordem');
      
    if (exerciciosError) {
      console.error("[treinosDoDiaService] Erro ao buscar exercícios:", exerciciosError);
      return [];
    }
    
    if (!exercicios || exercicios.length === 0) {
      console.warn("[treinosDoDiaService] Nenhum exercício encontrado para o treino_id:", treinoDoDia.treino_id);
      return [];
    }
    
    console.log("[treinosDoDiaService] Exercícios encontrados:", exercicios.length);
    
    // Validar cada exercício para garantir que todos os IDs necessários existam
    const exerciciosValidados = exercicios
      .filter(exercicio => {
        // Validar o ID do exercicio
        if (!exercicio.id) {
          console.warn("[treinosDoDiaService] Exercício sem ID encontrado");
          return false;
        }
        
        // Validar o exercicio_id (chave estrangeira)
        if (!exercicio.exercicio_id) {
          console.warn("[treinosDoDiaService] Exercício sem exercicio_id:", exercicio.id);
          return false;
        }
        
        // Verificar se o objeto exercicio existe (join funcionou)
        if (!exercicio.exercicio) {
          console.warn("[treinosDoDiaService] Exercício sem dados relacionados:", exercicio.id);
          // Ainda retornamos true pois o exercício em si é válido
          return true;
        }
        
        return true;
      })
      .map(exercicio => {
        // Garantir que o exercício tenha o treino_id correto
        return {
          ...exercicio,
          treino_id: treinoDoDia.treino_id
        };
      });
    
    console.log("[treinosDoDiaService] Exercícios validados:", exerciciosValidados.length);
    return exerciciosValidados;
  } catch (error) {
    console.error("[treinosDoDiaService] Erro ao obter exercícios para avaliação:", error);
    return [];
  }
};
