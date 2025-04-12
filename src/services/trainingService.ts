import { supabase } from '@/lib/supabase';
import { Training } from '@/types';

export interface TrainingInput {
  nome: string;
  local: string;
  data: Date;
  descricao: string;
  time: "Masculino" | "Feminino";
}

export interface TrainingUpdateInput {
  id: string;
  nome: string;
  local: string;
  data: Date;
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
    const { data, error } = await supabase
      .from('treinos')
      .insert([
        {
          nome: trainingData.nome,
          local: trainingData.local,
          data: trainingData.data,
          descricao: trainingData.descricao || '',
          time: trainingData.time
        }
      ])
      .select()
      .single();

    if (error) {
      throw new Error('Erro ao criar treino: ' + error.message);
    }

    return data;
  } catch (error) {
    console.error('Error creating training:', error);
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
