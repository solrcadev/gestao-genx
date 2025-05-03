
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
    
    return data || [];
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
    
    return data;
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
    // Separate records with IDs (existing ones) from new ones
    const existingRecords = presences.filter(p => p.id);
    const newRecords = presences.filter(p => !p.id);
    
    // Update existing records one by one
    for (const record of existingRecords) {
      const { id, ...updateData } = record;
      
      const { error } = await supabase
        .from('treinos_presencas')
        .update({
          ...updateData,
          treino_do_dia_id: treinoDoDiaId
        })
        .eq('id', id as string);
        
      if (error) {
        throw new Error(`Error updating attendance record: ${error.message}`);
      }
    }
    
    // Insert new records in batch
    if (newRecords.length > 0) {
      const { error } = await supabase
        .from('treinos_presencas')
        .insert(newRecords.map(record => ({
          ...record,
          treino_do_dia_id: treinoDoDiaId
        })));
        
      if (error) {
        throw new Error(`Error inserting attendance records: ${error.message}`);
      }
    }
    
    // Update effort indices for all athletes
    const atletaIds = [...new Set(presences.map(p => p.atleta_id))];
    for (const atletaId of atletaIds) {
      await updateAthleteEffortIndex(atletaId);
    }
    
    return true;
  } catch (error) {
    console.error('Error registering attendance:', error);
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
