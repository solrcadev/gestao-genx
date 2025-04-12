import { supabase } from '@/lib/supabase';
import { Training } from '@/types';

export interface TrainingInput {
  nome: string;
  local: string;
  data: Date | string;
  descricao: string;
  time: "Masculino" | "Feminino";
}

export interface TrainingUpdateInput {
  id: string;
  nome: string;
  local: string;
  data: Date | string;
  descricao?: string;
  time: "Masculino" | "Feminino";
}

// Existing functions

export const fetchTreinos = async () => {
  try {
    const { data, error } = await supabase
      .from('treinos')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      throw new Error('Erro ao buscar treinos: ' + error.message);
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching treinos:', error);
    throw error;
  }
};

export const createTraining = async (trainingData: TrainingInput) => {
  try {
    console.log("Criando treino com dados:", trainingData);
    
    // Verificar sessão do usuário
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      console.error("Erro: Usuário não está autenticado");
      throw new Error('Você precisa estar autenticado para criar um treino.');
    }
    
    console.log("Usuário autenticado:", sessionData.session.user.email);
    
    // Garantir que a data está no formato correto para o Supabase (YYYY-MM-DD)
    let formattedDate = trainingData.data;
    if (trainingData.data instanceof Date) {
      formattedDate = trainingData.data.toISOString().split('T')[0];
    }
    
    console.log("Data formatada para inserção:", formattedDate);
    
    // Objeto que será inserido no Supabase
    const trainingObject = {
      nome: trainingData.nome,
      local: trainingData.local,
      data: formattedDate,
      descricao: trainingData.descricao || '',
      time: trainingData.time
    };
    
    console.log("Objeto final para inserção:", trainingObject);
    
    let data;
    let error;
    
    try {
      // Chamada ao Supabase
      console.log("Iniciando chamada ao Supabase...");
      const result = await supabase
        .from('treinos')
        .insert([trainingObject])
        .select()
        .single();
      
      data = result.data;
      error = result.error;
      console.log("Chamada ao Supabase concluída:", { data, error });
    } catch (supabaseError) {
      console.error("Erro ao executar chamada ao Supabase:", supabaseError);
      throw new Error('Erro na chamada ao Supabase: ' + (supabaseError as Error).message);
    }

    if (error) {
      console.error("Erro do Supabase ao criar treino:", error);
      throw new Error('Erro ao criar treino: ' + error.message);
    }

    console.log("Treino criado com sucesso:", data);
    return data;
  } catch (error) {
    console.error('Erro detalhado ao criar treino:', error);
    throw error;
  }
};

export const addExercisesToTraining = async ({ trainingId, exercises }) => {
  try {
    const { error } = await supabase
      .from('treinos_exercicios')
      .insert(
        exercises.map(ex => ({
          treino_id: trainingId,
          exercicio_id: ex.exercicio_id,
          ordem: ex.ordem,
          observacao: ex.observacao
        }))
      );

    if (error) {
      throw new Error('Erro ao adicionar exercícios: ' + error.message);
    }

    return true;
  } catch (error) {
    console.error('Error adding exercises to training:', error);
    throw error;
  }
};

export const fetchTrainings = async (): Promise<Training[]> => {
  try {
    const { data, error } = await supabase
      .from('treinos')
      .select('*')
      .order('data', { ascending: false });
      
    if (error) {
      throw new Error('Erro ao buscar treinos: ' + error.message);
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching trainings:', error);
    throw error;
  }
};

export const getTrainingById = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('treinos')
      .select(`
        *,
        treinos_exercicios(
          *,
          exercicio:exercicio_id(*)
        )
      `)
      .eq('id', id)
      .single();
      
    if (error) {
      throw new Error('Erro ao buscar treino: ' + error.message);
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching training:', error);
    throw error;
  }
};

export const updateTraining = async (trainingData: TrainingUpdateInput) => {
  try {
    const { id, ...updateData } = trainingData;
    
    const { data, error } = await supabase
      .from('treinos')
      .update({
        nome: updateData.nome,
        local: updateData.local,
        data: updateData.data,
        descricao: updateData.descricao,
        time: updateData.time
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error('Erro ao atualizar treino: ' + error.message);
    }

    return data;
  } catch (error) {
    console.error('Error updating training:', error);
    throw error;
  }
};

export const deleteTraining = async (id: string): Promise<boolean> => {
  try {
    // First delete related exercises
    const { error: exercisesError } = await supabase
      .from('treinos_exercicios')
      .delete()
      .eq('treino_id', id);
      
    if (exercisesError) {
      throw new Error('Erro ao excluir exercícios do treino: ' + exercisesError.message);
    }
    
    // Then delete the training
    const { error } = await supabase
      .from('treinos')
      .delete()
      .eq('id', id);
      
    if (error) {
      throw new Error('Erro ao excluir treino: ' + error.message);
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting training:', error);
    throw error;
  }
};
