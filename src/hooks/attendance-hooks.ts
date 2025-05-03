
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Hook para buscar presenças dos atletas para um treino específico
 * @param treinoDoDiaId ID do treino do dia para buscar presenças
 * @returns Lista de atletas com status de presença
 */
export function useGetAthleteAttendance(treinoDoDiaId: string | undefined) {
  return useQuery({
    queryKey: ['attendance', treinoDoDiaId],
    queryFn: async () => {
      if (!treinoDoDiaId) {
        return [];
      }
      
      // Buscar dados de presença do Supabase
      const { data: presencas, error: presencasError } = await supabase
        .from('treinos_presencas')
        .select(`
          id,
          atleta_id,
          presente,
          justificativa,
          created_at,
          atleta:athletes(id, nome, posicao, time)
        `)
        .eq('treino_do_dia_id', treinoDoDiaId);
      
      if (presencasError) {
        throw new Error(`Erro ao buscar presenças: ${presencasError.message}`);
      }

      // Se não houver presença registrada, buscar atletas disponíveis para o treino
      if (presencas.length === 0) {
        // Primeiro buscar dados do treino para saber o time
        const { data: treinoDoDia, error: treinoError } = await supabase
          .from('treinos_do_dia')
          .select(`
            treino:treino_id(id, time)
          `)
          .eq('id', treinoDoDiaId)
          .single();
          
        if (treinoError) {
          throw new Error(`Erro ao buscar treino: ${treinoError.message}`);
        }
          
        // Buscar todos os atletas do time correspondente
        const time = treinoDoDia?.treino?.time;
        
        if (!time) {
          throw new Error('Não foi possível determinar o time do treino');
        }

        const { data: atletas, error: atletasError } = await supabase
          .from('athletes')
          .select('id, nome, posicao, time')
          .eq('time', time);
          
        if (atletasError) {
          throw new Error(`Erro ao buscar atletas: ${atletasError.message}`);
        }

        // Formatar atletas como registros de presença (todos presentes por padrão)
        return atletas.map(atleta => ({
          id: null, // ID será gerado ao salvar
          atleta_id: atleta.id,
          presente: true, // Padrão é presente
          justificativa: null,
          created_at: new Date().toISOString(),
          atleta
        }));
      }
      
      return presencas;
    },
    enabled: !!treinoDoDiaId,
  });
}

/**
 * Hook para buscar treinos do dia disponíveis
 * @param options Opções de filtragem como data ou time
 * @returns Lista de treinos do dia
 */
export function useGetAvailableTrainings(options: { 
  date?: Date | null;
  team?: 'Masculino' | 'Feminino' | null;
} = {}) {
  return useQuery({
    queryKey: ['available-trainings', options],
    queryFn: async () => {
      let query = supabase
        .from('treinos_do_dia')
        .select(`
          id,
          data,
          treino:treino_id(id, nome, local, horario, time)
        `)
        .order('data', { ascending: false });
        
      // Filtrar por data específica se fornecida
      if (options.date) {
        const dateStr = options.date.toISOString().split('T')[0];
        query = query.eq('data', dateStr);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Filtrar por time se necessário
      let filteredData = data || [];
      if (options.team) {
        filteredData = filteredData.filter(item => 
          item.treino && item.treino.time === options.team
        );
      }
      
      return filteredData.map(item => ({
        id: item.id,
        data: item.data,
        nome: item.treino?.nome || 'Treino sem nome',
        local: item.treino?.local || 'Local não especificado',
        horario: item.treino?.horario || 'Horário não especificado',
        time: item.treino?.time || 'Time não especificado'
      }));
    }
  });
}

/**
 * Função para salvar presenças de atletas
 * @param treinoDoDiaId ID do treino do dia
 * @param presencas Array de presenças para salvar
 */
export async function saveAthleteAttendance(
  treinoDoDiaId: string,
  presencas: {
    atleta_id: string;
    presente: boolean;
    justificativa?: string | null;
    id?: string | null;
  }[]
) {
  // Separar registros existentes (com ID) dos novos
  const registrosExistentes = presencas.filter(p => p.id);
  const novosRegistros = presencas.filter(p => !p.id);
  
  const resultados = [];
  
  // Atualizar registros existentes
  for (const registro of registrosExistentes) {
    const { id, ...dadosAtualizados } = registro;
    if (id) { // Typescript type guard
      const { data, error } = await supabase
        .from('treinos_presencas')
        .update(dadosAtualizados)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      if (data) resultados.push(...data);
    }
  }
  
  // Inserir novos registros
  if (novosRegistros.length > 0) {
    const { data, error } = await supabase
      .from('treinos_presencas')
      .insert(novosRegistros.map(registro => ({
        ...registro,
        treino_do_dia_id: treinoDoDiaId
      })))
      .select();
    
    if (error) throw error;
    if (data) resultados.push(...data);
  }
  
  return resultados;
}
