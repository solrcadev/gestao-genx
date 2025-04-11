
import { supabase } from '@/lib/supabase';
import { TeamType } from '@/types';

export interface TreinoDoDia {
  id: string;
  treino_id: string;
  data: string;
  aplicado: boolean;
  created_at: string;
  treino?: any;
  exercicios?: any[];
  presencas?: any[];
}

export interface Presenca {
  id: string;
  treino_do_dia_id: string;
  atleta_id: string;
  presente: boolean;
  justificativa?: string;
  created_at: string;
  atleta?: any;
}

export interface ExercicioAvaliacao {
  id: string;
  treino_do_dia_id: string;
  exercicio_id: string;
  atleta_id: string;
  fundamento: string;
  acertos: number;
  erros: number;
  created_at: string;
}

// Fetch all treinos do dia
export const fetchTreinosDosDia = async (): Promise<TreinoDoDia[]> => {
  const { data, error } = await supabase
    .from('treinos_do_dia')
    .select(`
      *,
      treino:treino_id (*)
    `)
    .order('data', { ascending: false });

  if (error) {
    console.error('Error fetching treinos do dia:', error);
    throw new Error(error.message);
  }

  return data || [];
};

// Fetch current active treino do dia
export const fetchTreinoAtual = async (id: string): Promise<TreinoDoDia> => {
  // First, get the treino do dia
  const { data: treinoDoDia, error: treinoError } = await supabase
    .from('treinos_do_dia')
    .select(`
      *,
      treino:treino_id (*)
    `)
    .eq('id', id)
    .single();

  if (treinoError) {
    console.error('Error fetching treino do dia:', treinoError);
    throw new Error(treinoError.message);
  }

  // Next, get the exercises
  const { data: exercicios, error: exerciciosError } = await supabase
    .from('treinos_exercicios')
    .select(`
      *,
      exercicio:exercicio_id (*)
    `)
    .eq('treino_id', treinoDoDia.treino_id)
    .order('ordem', { ascending: true });

  if (exerciciosError) {
    console.error('Error fetching exercises for treino:', exerciciosError);
    throw new Error(exerciciosError.message);
  }

  // Finally, get the presences
  const { data: presencas, error: presencasError } = await supabase
    .from('treinos_presencas')
    .select('*')
    .eq('treino_do_dia_id', id);

  if (presencasError) {
    console.error('Error fetching presences for treino do dia:', presencasError);
    throw new Error(presencasError.message);
  }

  return {
    ...treinoDoDia,
    exercicios: exercicios || [],
    presencas: presencas || []
  };
};

// Set a treino for the current day
export const setTreinoParaDia = async (treinoId: string, data: Date = new Date()): Promise<TreinoDoDia> => {
  const formattedDate = data.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  // Check if there is already a treino for this date
  const { data: existingTreino, error: checkError } = await supabase
    .from('treinos_do_dia')
    .select('*')
    .eq('data', formattedDate);
    
  if (checkError) {
    console.error('Error checking existing treino do dia:', checkError);
    throw new Error(checkError.message);
  }
  
  // If there's already a treino for this date, return an error
  if (existingTreino && existingTreino.length > 0) {
    throw new Error('Já existe um treino definido para esta data.');
  }
  
  // Insert new treino do dia
  const { data: newTreinoDoDia, error } = await supabase
    .from('treinos_do_dia')
    .insert([
      {
        treino_id: treinoId,
        data: formattedDate,
        aplicado: false
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Error setting treino do dia:', error);
    throw new Error(error.message);
  }

  return newTreinoDoDia;
};

// Conclude a treino do dia
export const concluirTreinoDoDia = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('treinos_do_dia')
    .update({ aplicado: true })
    .eq('id', id);

  if (error) {
    console.error('Error concluding treino do dia:', error);
    throw new Error(error.message);
  }
};

// Fetch presences for a treino do dia
export const fetchPresencas = async (treinoDoDiaId: string): Promise<Presenca[]> => {
  const { data, error } = await supabase
    .from('treinos_presencas')
    .select('*')
    .eq('treino_do_dia_id', treinoDoDiaId);

  if (error) {
    console.error('Error fetching presences:', error);
    throw new Error(error.message);
  }

  return data || [];
};

// Fetch athletes with attendance
export const fetchPresencasAtletas = async (treinoDoDiaId: string) => {
  // First, get the treino do dia to determine the team (masculine or feminine)
  const { data: treinoDoDia, error: treinoError } = await supabase
    .from('treinos_do_dia')
    .select(`
      *,
      treino:treino_id (time)
    `)
    .eq('id', treinoDoDiaId)
    .single();

  if (treinoError) {
    console.error('Error fetching treino do dia:', treinoError);
    throw new Error(treinoError.message);
  }

  // Get all athletes for the team
  const { data: athletes, error: athletesError } = await supabase
    .from('athletes')
    .select('*')
    .eq('time', treinoDoDia.treino.time)
    .order('nome');

  if (athletesError) {
    console.error('Error fetching athletes:', athletesError);
    throw new Error(athletesError.message);
  }

  // Get existing presences
  const { data: presencas, error: presencasError } = await supabase
    .from('treinos_presencas')
    .select('*')
    .eq('treino_do_dia_id', treinoDoDiaId);

  if (presencasError) {
    console.error('Error fetching presences:', presencasError);
    throw new Error(presencasError.message);
  }

  // Map athletes with their presence status
  const result = athletes.map(athlete => {
    const presence = presencas?.find(p => p.atleta_id === athlete.id);
    return {
      atleta: athlete,
      presente: presence ? presence.presente : true, // Default to present
      justificativa: presence?.justificativa || '',
      id: presence?.id
    };
  });

  return result;
};

// Register presence for an athlete
export const registrarPresenca = async ({
  treinoDoDiaId,
  atletaId,
  presente,
  justificativa
}: {
  treinoDoDiaId: string;
  atletaId: string;
  presente: boolean;
  justificativa?: string;
}): Promise<void> => {
  // Check if presence already exists
  const { data: existingPresence, error: checkError } = await supabase
    .from('treinos_presencas')
    .select('id')
    .eq('treino_do_dia_id', treinoDoDiaId)
    .eq('atleta_id', atletaId);

  if (checkError) {
    console.error('Error checking existing presence:', checkError);
    throw new Error(checkError.message);
  }

  if (existingPresence && existingPresence.length > 0) {
    // Update existing presence
    const { error } = await supabase
      .from('treinos_presencas')
      .update({
        presente,
        justificativa: presente ? null : justificativa
      })
      .eq('id', existingPresence[0].id);

    if (error) {
      console.error('Error updating presence:', error);
      throw new Error(error.message);
    }
  } else {
    // Insert new presence
    const { error } = await supabase
      .from('treinos_presencas')
      .insert([
        {
          treino_do_dia_id: treinoDoDiaId,
          atleta_id: atletaId,
          presente,
          justificativa: presente ? null : justificativa
        }
      ]);

    if (error) {
      console.error('Error registering presence:', error);
      throw new Error(error.message);
    }
  }
};

// Register presences in batch
export const registrarPresencasEmLote = async ({
  treinoDoDiaId,
  presences
}: {
  treinoDoDiaId: string;
  presences: Array<{
    atleta_id: string;
    presente: boolean;
    justificativa?: string;
    id?: string;
  }>;
}): Promise<void> => {
  // Process each presence separately (upsert)
  for (const presence of presences) {
    if (presence.id) {
      // Update existing presence
      const { error } = await supabase
        .from('treinos_presencas')
        .update({
          presente: presence.presente,
          justificativa: presence.presente ? null : presence.justificativa
        })
        .eq('id', presence.id);

      if (error) {
        console.error('Error updating presence in batch:', error);
        throw new Error(error.message);
      }
    } else {
      // Insert new presence
      const { error } = await supabase
        .from('treinos_presencas')
        .insert([
          {
            treino_do_dia_id: treinoDoDiaId,
            atleta_id: presence.atleta_id,
            presente: presence.presente,
            justificativa: presence.presente ? null : presence.justificativa
          }
        ]);

      if (error) {
        console.error('Error inserting presence in batch:', error);
        throw new Error(error.message);
      }
    }
  }
};

// Start an exercise
export const iniciarExercicio = async ({ 
  treinoDoDiaId, 
  exercicioId 
}: { 
  treinoDoDiaId: string;
  exercicioId: string;
}): Promise<void> => {
  // We just need to mark that the exercise is being executed
  // The actual timing will be tracked on the client side
  // Nothing to update in the database at this point
};

// Complete an exercise
export const concluirExercicio = async ({ 
  treinoDoDiaId, 
  exercicioId,
  tempoReal
}: { 
  treinoDoDiaId: string;
  exercicioId: string;
  tempoReal: number;
}): Promise<void> => {
  const { error } = await supabase
    .from('treinos_exercicios')
    .update({
      concluido: true,
      tempo_real: tempoReal
    })
    .eq('id', exercicioId);

  if (error) {
    console.error('Error concluding exercise:', error);
    throw new Error(error.message);
  }
};

// Save exercise evaluation
export const salvarAvaliacaoExercicio = async ({
  treinoDoDiaId,
  exercicioId,
  atletaId,
  fundamento,
  acertos,
  erros
}: {
  treinoDoDiaId: string;
  exercicioId: string;
  atletaId: string;
  fundamento: string;
  acertos: number;
  erros: number;
}): Promise<void> => {
  // First, get the corresponding treino id
  const { data: treinoDoDia, error: treinoError } = await supabase
    .from('treinos_do_dia')
    .select('treino_id')
    .eq('id', treinoDoDiaId)
    .single();

  if (treinoError) {
    console.error('Error fetching treino do dia for evaluation:', treinoError);
    throw new Error(treinoError.message);
  }

  // Check if an evaluation already exists
  const { data: existingEval, error: checkError } = await supabase
    .from('avaliacoes_fundamento')
    .select('id')
    .eq('treino_id', treinoDoDia.treino_id)
    .eq('exercicio_id', exercicioId)
    .eq('atleta_id', atletaId)
    .eq('fundamento', fundamento);

  if (checkError) {
    console.error('Error checking existing evaluation:', checkError);
    throw new Error(checkError.message);
  }

  if (existingEval && existingEval.length > 0) {
    // Update existing evaluation
    const { error } = await supabase
      .from('avaliacoes_fundamento')
      .update({
        acertos,
        erros
      })
      .eq('id', existingEval[0].id);

    if (error) {
      console.error('Error updating evaluation:', error);
      throw new Error(error.message);
    }
  } else {
    // Create new evaluation
    const { error } = await supabase
      .from('avaliacoes_fundamento')
      .insert([
        {
          treino_id: treinoDoDia.treino_id,
          exercicio_id: exercicioId,
          atleta_id: atletaId,
          fundamento,
          acertos,
          erros
        }
      ]);

    if (error) {
      console.error('Error saving evaluation:', error);
      throw new Error(error.message);
    }
  }
};
