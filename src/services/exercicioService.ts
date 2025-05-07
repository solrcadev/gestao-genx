import { supabase } from '@/lib/supabase';

export interface Exercicio {
  id: string;
  nome: string;
  categoria: string;
  descricao: string;
  objetivo: string;
  numero_jogadores: number;
  tempo_estimado: number;
  imagem_url?: string;
  video_url?: string;
  video_inicio?: string;
  video_fim?: string;
  created_at?: string;
}

export const fetchExerciciosByTrainingId = async (trainingId: string) => {
  try {
    const { data, error } = await supabase
      .from('treinos_exercicios')
      .select(`
        *,
        exercicio:exercicio_id(*)
      `)
      .eq('treino_id', trainingId)
      .order('ordem', { ascending: true });

    if (error) {
      console.error('Error fetching exercises for training:', error);
      throw new Error('Erro ao buscar exercícios do treino: ' + error.message);
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchExerciciosByTrainingId:', error);
    throw error;
  }
};

export const fetchAllExercicios = async () => {
  try {
    const { data, error } = await supabase
      .from('exercicios')
      .select('*')
      .order('nome', { ascending: true });

    if (error) {
      console.error('Error fetching exercises:', error);
      throw new Error('Erro ao buscar exercícios: ' + error.message);
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchAllExercicios:', error);
    throw error;
  }
};

export const createExercicio = async (exercicio: Omit<Exercicio, 'id'>) => {
  try {
    const { data, error } = await supabase
      .from('exercicios')
      .insert([exercicio])
      .select()
      .single();

    if (error) {
      console.error('Error creating exercise:', error);
      throw new Error('Erro ao criar exercício: ' + error.message);
    }

    return data;
  } catch (error) {
    console.error('Error in createExercicio:', error);
    throw error;
  }
};

export const updateExercicio = async (id: string, exercicio: Partial<Exercicio>) => {
  try {
    const { data, error } = await supabase
      .from('exercicios')
      .update(exercicio)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating exercise:', error);
      throw new Error('Erro ao atualizar exercício: ' + error.message);
    }

    return data;
  } catch (error) {
    console.error('Error in updateExercicio:', error);
    throw error;
  }
};

export const deleteExercicio = async (id: string) => {
  try {
    const { error } = await supabase
      .from('exercicios')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting exercise:', error);
      throw new Error('Erro ao excluir exercício: ' + error.message);
    }

    return true;
  } catch (error) {
    console.error('Error in deleteExercicio:', error);
    throw error;
  }
};

export const fetchExercicioById = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('exercicios')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching exercise by ID:', error);
      throw new Error('Erro ao buscar exercício: ' + error.message);
    }

    return data;
  } catch (error) {
    console.error('Error in fetchExercicioById:', error);
    throw error;
  }
};

export const getExercicioCategories = async (): Promise<string[]> => {
  try {
    // Buscar categorias únicas dos exercícios existentes
    const { data, error } = await supabase
      .from('exercicios')
      .select('categoria')
      .not('categoria', 'is', null);

    if (error) throw error;

    // Criar um Set para eliminar duplicatas
    const uniqueCategories = new Set<string>();
    
    // Categorias padrão que sempre devem estar disponíveis
    const defaultCategories = [
      'Aquecimento',
      'Defesa',
      'Ataque',
      'Técnica',
      'Tática',
      'Condicionamento',
      'Jogo',
      'Outro'
    ];
    
    // Adicionar categorias padrão
    defaultCategories.forEach(cat => uniqueCategories.add(cat));
    
    // Adicionar categorias existentes no banco
    data.forEach(item => {
      if (item.categoria) uniqueCategories.add(item.categoria);
    });
    
    // Converter Set para array e ordenar
    return Array.from(uniqueCategories).sort();
  } catch (error) {
    console.error('Error fetching exercise categories:', error);
    // Em caso de erro, retornar ao menos as categorias padrão
    return [
      'Aquecimento',
      'Defesa',
      'Ataque',
      'Técnica',
      'Tática',
      'Condicionamento',
      'Jogo',
      'Outro'
    ];
  }
}; 