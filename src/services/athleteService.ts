
import { supabase } from '@/lib/supabase';
import { Athlete, Team } from '@/types';

export const getAthletes = async (team?: "Masculino" | "Feminino"): Promise<Athlete[]> => {
  let query = supabase
    .from('athletes')
    .select('*')
    .order('nome', { ascending: true });
    
  if (team) {
    query = query.eq('time', team);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching athletes:', error);
    throw new Error(error.message);
  }

  return data || [];
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

// Add an alias to support the previous import name
export const getAthleteDetails = getAthleteById;

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

export const uploadAthletePhoto = async (file: File, athleteId?: string) => {
  try {
    // Validar o tipo do arquivo
    const validImageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      throw new Error('Formato de arquivo inválido. Por favor, use JPG, PNG, GIF ou WebP.');
    }
    
    // Verificar tamanho do arquivo (limitado a 2MB)
    if (file.size > 2 * 1024 * 1024) {
      throw new Error('O arquivo deve ter no máximo 2MB');
    }
    
    // Gerar um nome de arquivo baseado no ID do atleta (se disponível) e timestamp
    const fileExt = file.name.split('.').pop();
    const timestamp = new Date().getTime();
    const fileName = athleteId
      ? `athlete_${athleteId}_${timestamp}.${fileExt}`
      : `athlete_${timestamp}_${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
    
    const filePath = `athletes/${fileName}`;
    
    // Upload do arquivo para o bucket 'athletes-images'
    const { error: uploadError } = await supabase.storage
      .from('athletes-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true // Permite substituir se já existir
      });
    
    if (uploadError) {
      console.error('Erro no upload da foto:', uploadError);
      throw uploadError;
    }
    
    // Obter a URL pública
    const { data } = supabase.storage
      .from('athletes-images')
      .getPublicUrl(filePath);
    
    if (!data || !data.publicUrl) {
      throw new Error('Não foi possível obter a URL pública da imagem');
    }
    
    return data.publicUrl;
  } catch (error) {
    console.error('Erro no upload da foto:', error);
    throw error;
  }
};
