import { supabase } from '@/lib/supabase';

export interface Exercise {
  id: string;
  nome: string;
  categoria: string;
  tempo_estimado: number;
  numero_jogadores: number;
  objetivo: string;
  descricao: string;
  video_url?: string;
  video_inicio?: string;
  video_fim?: string;
  imagem_url?: string;
}

export interface ExerciseInput {
  nome: string;
  categoria: string;
  tempo_estimado: number;
  numero_jogadores: number;
  objetivo: string;
  descricao: string;
  video_url?: string;
  video_inicio?: string;
  video_fim?: string;
  imagem_url?: string;
}

export const fetchExercises = async (): Promise<Exercise[]> => {
  const { data, error } = await supabase
    .from('exercicios')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching exercises:', error);
    throw new Error(error.message);
  }

  return data || [];
};

export const fetchExerciseById = async (id: string): Promise<Exercise> => {
  const { data, error } = await supabase
    .from('exercicios')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching exercise with ID ${id}:`, error);
    throw new Error(error.message);
  }

  return data;
};

export const createExercise = async (exercise: ExerciseInput): Promise<Exercise> => {
  const { data, error } = await supabase
    .from('exercicios')
    .insert([exercise])
    .select()
    .single();

  if (error) {
    console.error('Error creating exercise:', error);
    throw new Error(error.message);
  }

  return data;
};

export const updateExercise = async ({ id, ...exercise }: Exercise): Promise<Exercise> => {
  const { data, error } = await supabase
    .from('exercicios')
    .update(exercise)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating exercise with ID ${id}:`, error);
    throw new Error(error.message);
  }

  return data;
};

export const deleteExercise = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('exercicios')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Error deleting exercise with ID ${id}:`, error);
    throw new Error(error.message);
  }
};

/**
 * Faz o upload de uma imagem para um exercício no bucket 'exercises-images'
 * @param file Arquivo de imagem a ser enviado
 * @param exerciseId ID do exercício (opcional, usado para nomear o arquivo)
 * @returns URL pública da imagem
 */
export const uploadExerciseImage = async (file: File, exerciseId?: string): Promise<string> => {
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
    
    // Gerar um nome de arquivo baseado no ID do exercício (se disponível) e timestamp
    const fileExt = file.name.split('.').pop();
    const timestamp = new Date().getTime();
    const fileName = exerciseId
      ? `exercise_${exerciseId}_${timestamp}.${fileExt}`
      : `exercise_${timestamp}_${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
    
    const filePath = `exercises/${fileName}`;
    
    // Upload do arquivo para o bucket 'exercises-images'
    const { error: uploadError } = await supabase.storage
      .from('exercises-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true // Permite substituir se já existir
      });
    
    if (uploadError) {
      console.error('Erro no upload da imagem:', uploadError);
      throw uploadError;
    }
    
    // Obter a URL pública
    const { data } = supabase.storage
      .from('exercises-images')
      .getPublicUrl(filePath);
    
    if (!data || !data.publicUrl) {
      throw new Error('Não foi possível obter a URL pública da imagem');
    }
    
    return data.publicUrl;
  } catch (error) {
    console.error('Erro no upload da imagem:', error);
    throw error;
  }
};
