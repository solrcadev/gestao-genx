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
      .single();
      
    if (error) {
      console.error('Error fetching training day:', error);
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
      .single();
      
    if (treinoDoDiaError) {
      console.error('Error fetching training day:', treinoDoDiaError);
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
        console.warn("[DEBUG] Presença sem ID de atleta, ignorando");
        return false;
      }
      return true;
    });
    
    if (validPresences.length === 0) {
      console.warn("[DEBUG] Nenhuma presença válida para salvar");
      return true;
    }
    
    const existingRecords = validPresences.filter(p => p.id);
    const newRecords = validPresences.filter(p => !p.id);
    
    console.log(`[DEBUG] Registros existentes: ${existingRecords.length}, Novos registros: ${newRecords.length}`);
    
    for (const record of existingRecords) {
      const { id, ...updateData } = record;
      
      console.log(`[DEBUG] Atualizando registro ${id} para atleta ${record.atleta_id}, presente: ${record.presente}`);
      
      const { error } = await supabase
        .from('treinos_presencas')
        .update({
          ...updateData,
          treino_do_dia_id: treinoDoDiaId
        })
        .eq('id', id as string);
        
      if (error) {
        console.error(`[ERROR] Erro ao atualizar registro de presença ${id}:`, error);
        throw new Error(`Error updating attendance record: ${error.message}`);
      }
    }
    
    if (newRecords.length > 0) {
      const recordsToInsert = newRecords.map(record => ({
        ...record,
        treino_do_dia_id: treinoDoDiaId
      }));
      
      console.log(`[DEBUG] Inserindo ${recordsToInsert.length} novos registros de presença`);
      console.log(`[DEBUG] Exemplo: atleta_id=${recordsToInsert[0]?.atleta_id}, presente=${recordsToInsert[0]?.presente}`);
      
      const { data, error } = await supabase
        .from('treinos_presencas')
        .insert(recordsToInsert)
        .select();
        
      if (error) {
        console.error(`[ERROR] Erro ao inserir registros de presença:`, error);
        throw new Error(`Error inserting attendance records: ${error.message}`);
      }
      
      console.log(`[DEBUG] ${data?.length || 0} registros inseridos com sucesso`);
    }
    
    const atletaIds = [...new Set(validPresences.map(p => p.atleta_id))];
    console.log(`[DEBUG] Atualizando índices de esforço para ${atletaIds.length} atletas`);
    
    for (const atletaId of atletaIds) {
      await updateAthleteEffortIndex(atletaId);
    }
    
    console.log(`[DEBUG] Presenças registradas com sucesso para o treino ${treinoDoDiaId}`);
    return true;
  } catch (error) {
    console.error('[ERROR] Erro completo ao registrar presenças:', error);
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
      .single();
    
    if (treinoError || !treino) {
      console.error('Error fetching training:', treinoError);
      throw new Error(treinoError?.message || 'Erro ao buscar dados do treino');
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
      .single();
      
    if (error) {
      console.error('Error setting training for the day:', error);
      throw new Error(error.message);
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
      .single();
      
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

// Add these missing functions that are imported by other components
export const fetchTreinoAtual = async (): Promise<any> => {
  try {
    const today = new Date();
    return await getTreinoDoDia(today);
  } catch (error) {
    console.error("Error fetching current training:", error);
    return null;
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

export const desmarcarExercicio = async (exercicioId: string): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('treinos_exercicios')
      .update({ concluido: false })
      .eq('id', exercicioId)
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
    // First, get the treino_id from the treino_do_dia
    const { data: treinoDoDia, error: treinoDoDiaError } = await supabase
      .from('treinos_do_dia')
      .select('treino_id')
      .eq('id', treinoDoDiaId)
      .single();
      
    if (treinoDoDiaError || !treinoDoDia) {
      console.error("Error fetching training day:", treinoDoDiaError);
      return [];
    }
    
    // Now fetch the exercises for that training
    const { data: exercicios, error: exerciciosError } = await supabase
      .from('treinos_exercicios')
      .select(`
        id,
        ordem,
        tempo_real,
        concluido,
        observacao,
        exercicio:exercicio_id(id, nome, descricao, categoria, tempo_estimado, imagem_url)
      `)
      .eq('treino_id', treinoDoDia.treino_id)
      .order('ordem');
      
    if (exerciciosError) {
      console.error("Error fetching exercises:", exerciciosError);
      return [];
    }
    
    return exercicios || [];
  } catch (error) {
    console.error("Error getting exercises for training day:", error);
    return [];
  }
};
