
import { supabase } from '@/lib/supabase';

export interface Training {
  id: string;
  nome: string;
  local: string;
  data: string | Date;
  descricao?: string;
  created_at?: string;
  status?: string;
  created_by?: string;
}

export interface TrainingExercise {
  id: string;
  treino_id: string;
  exercicio_id: string;
  ordem: number;
  observacao?: string;
}

export interface TrainingInput {
  nome: string;
  local: string;
  data: Date;
  descricao?: string;
}

// Fetch trainings
export const fetchTrainings = async (): Promise<Training[]> => {
  const { data, error } = await supabase
    .from('treinos')
    .select('*')
    .order('data', { ascending: false });

  if (error) {
    console.error('Error fetching trainings:', error);
    throw new Error(error.message);
  }

  return data || [];
};

// Fetch a specific training with its exercises
export const fetchTrainingWithExercises = async (trainingId: string) => {
  // Fetch training details
  const { data: training, error: trainingError } = await supabase
    .from('treinos')
    .select('*')
    .eq('id', trainingId)
    .single();

  if (trainingError) {
    console.error(`Error fetching training with ID ${trainingId}:`, trainingError);
    throw new Error(trainingError.message);
  }

  // Fetch exercises for this training
  const { data: trainingExercises, error: exercisesError } = await supabase
    .from('treinos_exercicios')
    .select(`
      *,
      exercicio:exercicio_id (*)
    `)
    .eq('treino_id', trainingId)
    .order('ordem', { ascending: true });

  if (exercisesError) {
    console.error(`Error fetching exercises for training ${trainingId}:`, exercisesError);
    throw new Error(exercisesError.message);
  }

  return {
    ...training,
    exercises: trainingExercises || [],
  };
};

// Create a new training
export const createTraining = async (trainingData: TrainingInput): Promise<Training> => {
  // For demo purposes, we're hardcoding a user ID
  // In a real app, this would come from authentication
  const mockUserId = '00000000-0000-0000-0000-000000000000';
  
  const { data, error } = await supabase
    .from('treinos')
    .insert([{
      nome: trainingData.nome,
      local: trainingData.local,
      data: trainingData.data,
      descricao: trainingData.descricao || null,
      created_by: mockUserId // Add mock user ID to satisfy not-null constraint
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating training:', error);
    throw new Error(error.message);
  }

  return data;
};

// Add exercises to a training
export const addExercisesToTraining = async ({ 
  trainingId, 
  exercises 
}: { 
  trainingId: string, 
  exercises: { exercicio_id: string; ordem: number; observacao?: string }[] 
}) => {
  // Format exercises for insertion
  const exercisesToInsert = exercises.map(exercise => ({
    treino_id: trainingId,
    exercicio_id: exercise.exercicio_id,
    ordem: exercise.ordem,
    observacao: exercise.observacao
  }));

  const { data, error } = await supabase
    .from('treinos_exercicios')
    .insert(exercisesToInsert);

  if (error) {
    console.error('Error adding exercises to training:', error);
    throw new Error(error.message);
  }

  return true;
};

// Update a training
export const updateTraining = async (training: Training): Promise<Training> => {
  const { data, error } = await supabase
    .from('treinos')
    .update({
      nome: training.nome,
      local: training.local,
      data: training.data,
      descricao: training.descricao || null
    })
    .eq('id', training.id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating training with ID ${training.id}:`, error);
    throw new Error(error.message);
  }

  return data;
};

// Delete a training
export const deleteTraining = async (id: string): Promise<void> => {
  // First delete related exercises
  const { error: exercisesError } = await supabase
    .from('treinos_exercicios')
    .delete()
    .eq('treino_id', id);

  if (exercisesError) {
    console.error(`Error deleting exercises for training with ID ${id}:`, exercisesError);
    throw new Error(exercisesError.message);
  }

  // Then delete the training
  const { error } = await supabase
    .from('treinos')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Error deleting training with ID ${id}:`, error);
    throw new Error(error.message);
  }
};
