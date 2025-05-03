
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { TeamType } from '@/types';

/**
 * Interface for attendance data with justification types
 */
export interface AthleteWithAttendance {
  id: string | null;
  atleta_id: string;
  presente: boolean;
  justificativa: string | null;
  justificativa_tipo: JustificativaTipo | null;
  indice_esforco: number | null;
  created_at: string;
  atleta: {
    id: string;
    nome: string;
    posicao: string;
    time: string;
    foto_url?: string;
  }
}

/**
 * Enum for justification types
 */
export enum JustificativaTipo {
  SEM_JUSTIFICATIVA = "sem_justificativa",
  MOTIVO_PESSOAL = "motivo_pessoal",
  MOTIVO_ACADEMICO = "motivo_academico",
  MOTIVO_LOGISTICO = "motivo_logistico",
  MOTIVO_SAUDE = "motivo_saude"
}

/**
 * Interface for training item
 */
export interface TrainingItem {
  id: string;
  data: string;
  nome: string;
  local: string;
  horario: string;
  time: TeamType | string;
}

/**
 * Hook to fetch athlete attendance for a specific training
 * @param treinoDoDiaId ID of the training day to fetch attendance
 * @returns List of athletes with attendance status
 */
export function useGetAthleteAttendance(treinoDoDiaId: string | undefined) {
  return useQuery({
    queryKey: ['attendance', treinoDoDiaId],
    queryFn: async () => {
      if (!treinoDoDiaId) {
        return [];
      }
      
      // Fetch attendance data from Supabase
      const { data: presencas, error: presencasError } = await supabase
        .from('treinos_presencas')
        .select(`
          id,
          atleta_id,
          presente,
          justificativa,
          justificativa_tipo,
          indice_esforco,
          created_at,
          atleta:athletes(id, nome, posicao, time, foto_url)
        `)
        .eq('treino_do_dia_id', treinoDoDiaId);
      
      if (presencasError) {
        throw new Error(`Erro ao buscar presenças: ${presencasError.message}`);
      }

      // If no attendance records, fetch available athletes for the training
      if (presencas.length === 0) {
        // First fetch training data to know the team
        const { data: treinoDoDia, error: treinoError } = await supabase
          .from('treinos_do_dia')
          .select(`
            treino:treino_id(id, time)
          `)
          .eq('id', treinoDoDiaId)
          .single();
          
        if (treinoError) {
          throw new Error(`Erro ao buscar treino: ${treinoError.message}`);
        }
          
        // Get all athletes from the corresponding team
        const time = treinoDoDia?.treino ? (treinoDoDia.treino as any).time : null;
        
        if (!time) {
          throw new Error('Não foi possível determinar o time do treino');
        }

        const { data: atletas, error: atletasError } = await supabase
          .from('athletes')
          .select('id, nome, posicao, time, foto_url')
          .eq('time', time);
          
        if (atletasError) {
          throw new Error(`Erro ao buscar atletas: ${atletasError.message}`);
        }

        // Format athletes as attendance records (all present by default)
        return atletas.map(atleta => ({
          id: null, // ID will be generated when saved
          atleta_id: atleta.id,
          presente: true, // Default is present
          justificativa: null,
          justificativa_tipo: null,
          indice_esforco: null,
          created_at: new Date().toISOString(),
          atleta
        })) as AthleteWithAttendance[];
      }
      
      return presencas.map(p => ({
        ...p,
        atleta: p.atleta as unknown as {
          id: string;
          nome: string;
          posicao: string;
          time: string;
          foto_url?: string;
        }
      })) as AthleteWithAttendance[];
    },
    enabled: !!treinoDoDiaId,
  });
}

/**
 * Hook to fetch available trainings
 * @param options Options for filtering such as date or team
 * @returns List of training days
 */
export function useGetAvailableTrainings(options: { 
  date?: Date | null;
  team?: TeamType | null;
} = {}) {
  return useQuery({
    queryKey: ['available-trainings', options],
    queryFn: async () => {
      let query = supabase
        .from('treinos_do_dia')
        .select(`
          id,
          data,
          treino:treino_id(id, nome, local, horario, time)
        `)
        .order('data', { ascending: false });
        
      // Filter by specific date if provided
      if (options.date) {
        const dateStr = options.date.toISOString().split('T')[0];
        query = query.eq('data', dateStr);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Filter by team if needed
      let filteredData = data || [];
      if (options.team) {
        filteredData = filteredData.filter(item => {
          // Access team safely using as any
          const treino = item.treino as any;
          return treino && treino.time === options.team;
        });
      }
      
      return filteredData.map(item => {
        const treino = item.treino as any;
        return {
          id: item.id,
          data: item.data,
          nome: treino?.nome || 'Treino sem nome',
          local: treino?.local || 'Local não especificado',
          horario: treino?.horario || 'Horário não especificado',
          time: treino?.time || 'Time não especificado'
        } as TrainingItem;
      });
    }
  });
}

/**
 * Calculate athlete effort index based on attendance history
 * @param atletaId ID of the athlete
 * @returns Effort index between -1 and 1
 */
export async function calculateAthleteEffortIndex(atletaId: string): Promise<number> {
  try {
    // Get all attendance records for the athlete
    const { data, error } = await supabase
      .from('treinos_presencas')
      .select(`presente, justificativa_tipo`)
      .eq('atleta_id', atletaId)
      .order('created_at', { ascending: false })
      .limit(20); // Consider last 20 trainings for calculation
      
    if (error || !data || data.length === 0) {
      console.error('Error fetching attendance for effort index:', error);
      return 0; // Default to neutral if no data or error
    }
    
    // Calculate score based on attendance and justification type
    let totalScore = 0;
    data.forEach(record => {
      if (record.presente) {
        totalScore += 1; // Present = +1
      } else {
        // Apply different weights based on justification type
        switch(record.justificativa_tipo) {
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
    return Math.max(-1, Math.min(1, effortIndex));
  } catch (error) {
    console.error('Error calculating effort index:', error);
    return 0; // Default to neutral if error
  }
}

/**
 * Function to save attendance records for athletes
 * @param treinoDoDiaId ID of the training day
 * @param presencas Array of attendance records to save
 */
export async function saveAthleteAttendance(
  treinoDoDiaId: string,
  presencas: {
    atleta_id: string;
    presente: boolean;
    justificativa?: string | null;
    justificativa_tipo?: JustificativaTipo | null;
    id?: string | null;
  }[]
) {
  // Separate existing records (with ID) from new ones
  const registrosExistentes = presencas.filter(p => p.id);
  const novosRegistros = presencas.filter(p => !p.id);
  
  const resultados = [];
  
  // Update existing records
  for (const registro of registrosExistentes) {
    const { id, ...dadosAtualizados } = registro;
    if (id) { // TypeScript type guard
      const { data, error } = await supabase
        .from('treinos_presencas')
        .update(dadosAtualizados)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      if (data) resultados.push(...data);
    }
  }
  
  // Insert new records
  if (novosRegistros.length > 0) {
    const { data, error } = await supabase
      .from('treinos_presencas')
      .insert(novosRegistros.map(registro => ({
        ...registro,
        treino_do_dia_id: treinoDoDiaId
      })))
      .select();
    
    if (error) throw error;
    if (data) resultados.push(...data);
  }
  
  // Update effort indices for all athletes in this batch
  const atletaIds = [...new Set(presencas.map(p => p.atleta_id))];
  for (const atletaId of atletaIds) {
    const indiceEsforco = await calculateAthleteEffortIndex(atletaId);
    
    // Update the effort index in the athletes table
    await supabase
      .from('athletes')
      .update({ indice_esforco: indiceEsforco })
      .eq('id', atletaId);
  }
  
  return resultados;
}
