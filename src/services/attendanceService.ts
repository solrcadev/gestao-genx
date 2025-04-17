import { supabase } from '@/lib/supabase';
import { format, parse, isAfter, isBefore } from 'date-fns';

export interface AttendanceRecord {
  id: string;
  atleta: {
    id: string;
    nome: string;
    time: string;
    posicao: string;
  };
  treino: {
    nome: string;
    data: string;
    local: string;
  };
  presente: boolean;
  justificativa?: string;
  treino_do_dia_id: string;
}

export interface AttendanceFilters {
  athleteName?: string;
  startDate?: Date;
  endDate?: Date;
  status?: 'present' | 'absent' | 'all';
  team?: 'Masculino' | 'Feminino' | 'all';
}

export const fetchAttendanceRecords = async (filters: AttendanceFilters = {}): Promise<AttendanceRecord[]> => {
  try {
    console.log('Fetching attendance with filters:', filters);
    
    let query = supabase
      .from('treinos_presencas')
      .select(`
        id,
        presente,
        justificativa,
        treino_do_dia_id,
        atleta:atleta_id(id, nome, time, posicao),
        treino_do_dia:treino_do_dia_id(
          data,
          treino:treino_id(nome, local)
        )
      `);
    
    // Get attendance records
    const { data: records, error } = await query;
    
    if (error) {
      console.error('Error fetching attendance records:', error);
      throw new Error('Failed to fetch attendance records');
    }
    
    if (!records) {
      return [];
    }
    
    // Transform and filter the records
    let filteredRecords: AttendanceRecord[] = records.map(record => {
      // Fix type issues by accessing nested properties correctly
      const atleta = record.atleta as any;
      const treino_do_dia = record.treino_do_dia as any;
      
      return {
        id: record.id,
        atleta: {
          id: atleta?.id,
          nome: atleta?.nome,
          time: atleta?.time,
          posicao: atleta?.posicao
        },
        treino: {
          nome: treino_do_dia?.treino?.nome,
          data: treino_do_dia?.data,
          local: treino_do_dia?.treino?.local
        },
        presente: record.presente,
        justificativa: record.justificativa,
        treino_do_dia_id: record.treino_do_dia_id
      };
    });

    // Apply client-side filters
    if (filters) {
      // Filter by athlete name
      if (filters.athleteName) {
        const searchTerm = filters.athleteName.toLowerCase();
        filteredRecords = filteredRecords.filter(record => 
          record.atleta.nome.toLowerCase().includes(searchTerm)
        );
      }
      
      // Filter by date range
      if (filters.startDate) {
        filteredRecords = filteredRecords.filter(record => {
          const recordDate = parse(record.treino.data, 'yyyy-MM-dd', new Date());
          return !isBefore(recordDate, filters.startDate!);
        });
      }
      
      if (filters.endDate) {
        filteredRecords = filteredRecords.filter(record => {
          const recordDate = parse(record.treino.data, 'yyyy-MM-dd', new Date());
          return !isAfter(recordDate, filters.endDate!);
        });
      }
      
      // Filter by status
      if (filters.status && filters.status !== 'all') {
        const isPresent = filters.status === 'present';
        filteredRecords = filteredRecords.filter(record => record.presente === isPresent);
      }
      
      // Filter by team
      if (filters.team && filters.team !== 'all') {
        filteredRecords = filteredRecords.filter(record => record.atleta.time === filters.team);
      }
    }
    
    // Sort by date (most recent first) and then by athlete name
    filteredRecords.sort((a, b) => {
      // Sort by date descending
      const dateA = parse(a.treino.data, 'yyyy-MM-dd', new Date());
      const dateB = parse(b.treino.data, 'yyyy-MM-dd', new Date());
      
      if (dateA > dateB) return -1;
      if (dateA < dateB) return 1;
      
      // If dates are the same, sort by athlete name
      return a.atleta.nome.localeCompare(b.atleta.nome);
    });
    
    return filteredRecords;
  } catch (error) {
    console.error('Error in fetchAttendanceRecords:', error);
    throw error;
  }
};

export const updateAttendanceJustification = async (
  id: string, 
  justificativa: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('treinos_presencas')
      .update({ justificativa })
      .eq('id', id);
      
    if (error) {
      console.error('Error updating justification:', error);
      throw new Error('Failed to update justification');
    }
  } catch (error) {
    console.error('Error in updateAttendanceJustification:', error);
    throw error;
  }
};

// Calculate absence rate for an athlete (used for highlighting frequent absences)
export const calculateAbsenceRate = (
  attendanceRecords: AttendanceRecord[],
  athleteId: string
): number => {
  const athleteRecords = attendanceRecords.filter(record => record.atleta.id === athleteId);
  
  if (athleteRecords.length === 0) {
    return 0;
  }
  
  const absences = athleteRecords.filter(record => !record.presente).length;
  return (absences / athleteRecords.length) * 100;
};

// Get athletes with high absence rates (e.g., missing more than 30% of trainings)
export const getHighAbsenceAthletes = (
  attendanceRecords: AttendanceRecord[],
  threshold: number = 30
): string[] => {
  // Get unique athlete IDs
  const athleteIds = [...new Set(attendanceRecords.map(record => record.atleta.id))];
  
  // Calculate absence rates and filter those above threshold
  return athleteIds.filter(id => calculateAbsenceRate(attendanceRecords, id) >= threshold);
};
