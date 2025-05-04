
import { supabase } from '@/lib/supabase';

/**
 * Fetches all athletes from the database
 * @returns Promise with array of athlete objects
 */
export const fetchAthletes = async () => {
  try {
    const { data, error } = await supabase
      .from('athletes')
      .select('*')
      .order('nome');
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching athletes:', error);
    return [];
  }
};

/**
 * Fetches an athlete by ID
 * @param id Athlete ID
 * @returns Promise with athlete object or null
 */
export const fetchAthleteById = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('athletes')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching athlete by ID:', error);
    return null;
  }
};

/**
 * Fetches athletes by team
 * @param team Team name
 * @returns Promise with array of athlete objects
 */
export const fetchAthletesByTeam = async (team: string) => {
  try {
    const { data, error } = await supabase
      .from('athletes')
      .select('*')
      .eq('time', team)
      .order('nome');
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching athletes by team:', error);
    return [];
  }
};

/**
 * Fetches training history for an athlete
 * @param athleteId Athlete ID
 * @returns Promise with training history data
 */
export const fetchAthleteTrainingHistory = async (athleteId: string) => {
  try {
    // Get training presences for athlete
    const { data: presencasData, error: presencasError } = await supabase
      .from('treinos_presencas')
      .select(`
        id,
        presente,
        justificativa,
        justificativa_tipo,
        created_at,
        treino_do_dia:treino_do_dia_id (
          id,
          data,
          treino:treino_id (
            id,
            nome,
            local
          )
        )
      `)
      .eq('atleta_id', athleteId)
      .order('created_at', { ascending: false });
      
    if (presencasError) throw presencasError;
    
    return presencasData || [];
  } catch (error) {
    console.error('Error fetching athlete training history:', error);
    return [];
  }
};

/**
 * Creates a new athlete
 * @param athlete Athlete data
 * @returns Promise with created athlete or null
 */
export const createAthlete = async (athlete: any) => {
  try {
    const { data, error } = await supabase
      .from('athletes')
      .insert([athlete])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating athlete:', error);
    return null;
  }
};

/**
 * Updates an existing athlete
 * @param id Athlete ID
 * @param updates Updates to apply
 * @returns Promise with updated athlete or null
 */
export const updateAthlete = async (id: string, updates: any) => {
  try {
    const { data, error } = await supabase
      .from('athletes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating athlete:', error);
    return null;
  }
};

/**
 * Deletes an athlete
 * @param id Athlete ID
 * @returns Promise with boolean indicating success
 */
export const deleteAthlete = async (id: string) => {
  try {
    const { error } = await supabase
      .from('athletes')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting athlete:', error);
    return false;
  }
};
