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
  fundamentos?: string[];
  dificuldade?: string;
  checklist_tecnico?: string[];
  // Estatísticas de uso
  contagem_uso?: number;
  ultima_vez_usado?: string | null;
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
  fundamentos?: string[];
  dificuldade?: string;
  checklist_tecnico?: string[];
}

export interface ExerciseFilterOptions {
  time?: string;
  periodo?: {
    inicio?: Date;
    fim?: Date;
  };
}

export const fetchExercises = async (): Promise<Exercise[]> => {
  try {
    // Buscar primeiro todos os exercícios
    const { data: exercicios, error: exerciciosError } = await supabase
    .from('exercicios')
    .select('*')
    .order('created_at', { ascending: false });

    if (exerciciosError) {
      console.error('Error fetching exercises:', exerciciosError);
      throw new Error(exerciciosError.message);
  }

    // Se não houver exercícios, retornar array vazio
    if (!exercicios || exercicios.length === 0) {
      return [];
    }
    
    // Buscar separadamente as estatísticas de uso
    const { data: estatisticas, error: estatisticasError } = await supabase
      .from('exercicio_uso_estatisticas')
      .select('*');
      
    if (estatisticasError) {
      console.error('Error fetching usage statistics:', estatisticasError);
      // Mesmo com erro nas estatísticas, retornamos os exercícios básicos
      return exercicios;
    }
    
    // Criar um mapa para facilitar a busca de estatísticas por ID de exercício
    const estatisticasPorExercicio = (estatisticas || []).reduce((acc, stat) => {
      acc[stat.exercicio_id] = {
        contagem_uso: stat.contagem_uso || 0,
        ultima_vez_usado: stat.ultima_vez_usado || null
      };
      return acc;
    }, {});
    
    // Combinar os dados manualmente
    return exercicios.map(exercicio => ({
      ...exercicio,
      contagem_uso: estatisticasPorExercicio[exercicio.id]?.contagem_uso || 0,
      ultima_vez_usado: estatisticasPorExercicio[exercicio.id]?.ultima_vez_usado || null
    }));
  } catch (error) {
    console.error('Error in fetchExercises:', error);
    throw error;
  }
};

/**
 * Busca exercícios com estatísticas de uso filtradas por gênero e período
 * @param options Opções de filtro (gênero e período)
 * @returns Lista de exercícios com estatísticas filtradas
 */
export const fetchExercisesWithFilteredStats = async (options: ExerciseFilterOptions = {}): Promise<Exercise[]> => {
  try {
    // Buscar todos os exercícios primeiro
    const { data: exercicios, error: exerciciosError } = await supabase
      .from('exercicios')
      .select('*')
      .order('created_at', { ascending: false });

    if (exerciciosError) {
      console.error('Error fetching exercises:', exerciciosError);
      throw new Error(exerciciosError.message);
    }

    // Se não houver exercícios, retornar array vazio
    if (!exercicios || exercicios.length === 0) {
      return [];
    }

    // Construir consulta para buscar os treinos com base nos filtros
    let query = supabase.from('treinos').select('id, data, time');
    
    // Aplicar filtro de gênero se especificado
    if (options.time && options.time !== 'Todos') {
      query = query.eq('time', options.time);
    }

    // Aplicar filtro de período se especificado
    if (options.periodo?.inicio) {
      const dataInicio = options.periodo.inicio.toISOString().split('T')[0];
      query = query.gte('data', dataInicio);
    }
    
    if (options.periodo?.fim) {
      const dataFim = options.periodo.fim.toISOString().split('T')[0];
      query = query.lte('data', dataFim);
    }

    // Executar a consulta para buscar os treinos
    const { data: treinos, error: treinosError } = await query;

    if (treinosError) {
      console.error('Error fetching trainings:', treinosError);
      return exercicios.map(ex => ({ ...ex, contagem_uso: 0, ultima_vez_usado: null }));
    }

    // Se não houver treinos com os filtros aplicados, retornar exercícios sem estatísticas
    if (!treinos || treinos.length === 0) {
      return exercicios.map(ex => ({ ...ex, contagem_uso: 0, ultima_vez_usado: null }));
    }

    // Buscar os exercícios utilizados nos treinos filtrados
    const treinoIds = treinos.map(treino => treino.id);
    
    // Consultar a tabela treinos_exercicios para obter as estatísticas
    const { data: treinosExercicios, error: treinosExerciciosError } = await supabase
      .from('treinos_exercicios')
      .select('exercicio_id, treino_id')
      .in('treino_id', treinoIds);

    if (treinosExerciciosError) {
      console.error('Error fetching training exercises:', treinosExerciciosError);
      return exercicios.map(ex => ({ ...ex, contagem_uso: 0, ultima_vez_usado: null }));
    }

    // Criar um mapa para associar cada treino à sua data
    const treinosDatas = treinos.reduce((acc, treino) => {
      acc[treino.id] = treino.data;
      return acc;
    }, {});

    // Processar os resultados para calcular contagem e última data por exercício
    const estatisticasPorExercicio: Record<string, { contagem: number, ultimaData: string | null }> = {};

    // Iterar sobre os treinos_exercicios e contar usos de exercícios
    treinosExercicios?.forEach(te => {
      const exercicioId = te.exercicio_id;
      const treinoData = treinosDatas[te.treino_id];
      
      if (!estatisticasPorExercicio[exercicioId]) {
        estatisticasPorExercicio[exercicioId] = { contagem: 0, ultimaData: null };
      }
      
      estatisticasPorExercicio[exercicioId].contagem += 1;
      
      // Atualizar a última data se for mais recente
      if (!estatisticasPorExercicio[exercicioId].ultimaData || 
          treinoData > estatisticasPorExercicio[exercicioId].ultimaData) {
        estatisticasPorExercicio[exercicioId].ultimaData = treinoData;
      }
    });

    // Combinar os dados de exercícios com as estatísticas filtradas
    return exercicios.map(exercicio => ({
      ...exercicio,
      contagem_uso: estatisticasPorExercicio[exercicio.id]?.contagem || 0,
      ultima_vez_usado: estatisticasPorExercicio[exercicio.id]?.ultimaData || null
    }));
  } catch (error) {
    console.error('Error in fetchExercisesWithFilteredStats:', error);
    throw error;
  }
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

/**
 * Exclui uma imagem do bucket 'exercises-images' no Supabase Storage
 * @param imageUrl URL completa da imagem a ser excluída
 * @returns true se a exclusão foi bem-sucedida, false caso contrário
 */
export const deleteExerciseImage = async (imageUrl: string): Promise<boolean> => {
  try {
    if (!imageUrl) return false;
    
    // Extrair o caminho do arquivo da URL
    const bucketName = 'exercises-images';
    const urlObj = new URL(imageUrl);
    const pathname = urlObj.pathname;
    
    // O caminho no Storage geralmente tem o formato: /storage/v1/object/public/{bucket}/{path}
    // Precisamos extrair apenas a parte do {path}
    const pathRegex = new RegExp(`/storage/v1/object/public/${bucketName}/(.+)`);
    const match = pathname.match(pathRegex);
    
    if (!match || !match[1]) {
      console.error('Formato de URL inválido:', imageUrl);
      return false;
    }
    
    const filePath = decodeURIComponent(match[1]);
    
    // Excluir o arquivo do Storage
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);
    
    if (error) {
      console.error('Erro ao excluir imagem do Storage:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao processar exclusão da imagem:', error);
    return false;
  }
};

/**
 * Retorna a lista de fundamentos técnicos disponíveis para exercícios
 * @returns Array com os fundamentos técnicos de voleibol
 */
export const getFundamentosTecnicos = (): string[] => {
  return [
    'Levantamento',
    'Recepção',
    'Defesa',
    'Saque',
    'Ataque',
    'Bloqueio',
    'Deslocamento',
    'Comunicação'
  ];
};

/**
 * Retorna a lista de níveis de dificuldade disponíveis para exercícios
 * @returns Array com os níveis de dificuldade
 */
export const getNiveisDificuldade = (): string[] => {
  return [
    'Iniciante',
    'Intermediário',
    'Avançado'
  ];
};

/**
 * Formata a data para exibição em formato DD/MM/YYYY
 * @param dateStr Data em formato string
 * @returns Data formatada ou string vazia se a data for inválida
 */
export const formatExerciseDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};
