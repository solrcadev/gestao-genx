
import { supabase } from '@/lib/supabase';
import { Athlete, Team } from '@/types';

export const getAthletes = async (team?: Team) => {
  let query = supabase.from('athletes').select('*');
  
  if (team) {
    query = query.eq('team', team);
  }
  
  const { data, error } = await query.order('name');
  
  if (error) {
    console.error('Error fetching athletes:', error);
    throw error;
  }
  
  return data as Athlete[];
};

export const getAthleteById = async (id: string) => {
  const { data, error } = await supabase
    .from('athletes')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(`Error fetching athlete with id ${id}:`, error);
    throw error;
  }
  
  return data as Athlete;
};

export const createAthlete = async (athlete: Omit<Athlete, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('athletes')
    .insert(athlete)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating athlete:', error);
    throw error;
  }
  
  return data as Athlete;
};

export const updateAthlete = async (id: string, athlete: Partial<Athlete>) => {
  const { data, error } = await supabase
    .from('athletes')
    .update(athlete)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error(`Error updating athlete with id ${id}:`, error);
    throw error;
  }
  
  return data as Athlete;
};

export const deleteAthlete = async (id: string) => {
  const { error } = await supabase
    .from('athletes')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error(`Error deleting athlete with id ${id}:`, error);
    throw error;
  }
  
  return true;
};

export const uploadAthletePhoto = async (file: File) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
  const filePath = `athlete-photos/${fileName}`;
  
  const { error: uploadError } = await supabase.storage
    .from('athlete-photos')
    .upload(filePath, file);
  
  if (uploadError) {
    console.error('Error uploading photo:', uploadError);
    throw uploadError;
  }
  
  const { data } = supabase.storage.from('athlete-photos').getPublicUrl(filePath);
  
  return data.publicUrl;
};
