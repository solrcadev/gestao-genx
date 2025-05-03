
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Types
export enum JustificativaTipo {
  MOTIVO_PESSOAL = 'motivo_pessoal',
  MOTIVO_ACADEMICO = 'motivo_academico',
  MOTIVO_LOGISTICO = 'motivo_logistico', 
  MOTIVO_SAUDE = 'motivo_saude',
  SEM_JUSTIFICATIVA = 'sem_justificativa'
}

export interface AtletaPresenca {
  id: string;
  nome: string;
  posicao: string;
  time: string;
  foto_url?: string;
  presente: boolean;
  justificativa?: string;
  justificativa_tipo?: JustificativaTipo;
  indice_esforco?: number;
}

export interface TreinoComPresenca {
  id: string;
  data: string;
  nome: string;
  atletas: AtletaPresenca[];
}

// Função para buscar treinos com dados de presença
export const useTreinosComPresenca = (limit: number = 20) => {
  return useQuery({
    queryKey: ['treinos-presenca', limit],
    queryFn: async (): Promise<TreinoComPresenca[]> => {
      // 1. Buscar treinos do dia
      const { data: treinosDoDia, error: treinosError } = await supabase
        .from('treinos_do_dia')
        .select(`
          id,
          data,
          treino:treino_id (
            id, 
            nome,
            time
          )
        `)
        .order('data', { ascending: false })
        .limit(limit);
        
      if (treinosError) throw treinosError;
      if (!treinosDoDia) return [];
      
      // 2. Para cada treino, buscar dados de presença
      const treinosComPresenca: TreinoComPresenca[] = [];
      
      for (const treinoDoDia of treinosDoDia) {
        // Buscar registros de presença para este treino
        const { data: presencas, error: presencasError } = await supabase
          .from('treinos_presencas')
          .select(`
            id,
            presente,
            justificativa,
            justificativa_tipo,
            indice_esforco,
            atleta:atleta_id (
              id,
              nome,
              posicao,
              time,
              foto_url,
              indice_esforco
            )
          `)
          .eq('treino_do_dia_id', treinoDoDia.id);
          
        if (presencasError) {
          console.error('Erro ao buscar presenças:', presencasError);
          continue;
        }
        
        if (!presencas || presencas.length === 0) {
          // Se não há registros de presença, buscar atletas do time para criar registros padrão
          if (!treinoDoDia.treino) continue;
          
          const timeDoTreino = (treinoDoDia.treino as any).time;
          if (!timeDoTreino) continue;
          
          const { data: atletas, error: atletasError } = await supabase
            .from('athletes')
            .select('id, nome, posicao, time, foto_url, indice_esforco')
            .eq('time', timeDoTreino);
            
          if (atletasError || !atletas) continue;
          
          treinosComPresenca.push({
            id: treinoDoDia.id,
            data: treinoDoDia.data,
            nome: (treinoDoDia.treino as any).nome || 'Treino sem nome',
            atletas: atletas.map(atleta => ({
              id: atleta.id,
              nome: atleta.nome,
              posicao: atleta.posicao,
              time: atleta.time,
              foto_url: atleta.foto_url,
              presente: true, // Valor padrão quando não há registro
              indice_esforco: atleta.indice_esforco
            }))
          });
        } else {
          // Se há registros de presença, usar esses dados
          treinosComPresenca.push({
            id: treinoDoDia.id,
            data: treinoDoDia.data,
            nome: (treinoDoDia.treino as any).nome || 'Treino sem nome',
            atletas: presencas.map(presenca => ({
              id: (presenca.atleta as any).id,
              nome: (presenca.atleta as any).nome,
              posicao: (presenca.atleta as any).posicao,
              time: (presenca.atleta as any).time,
              foto_url: (presenca.atleta as any).foto_url,
              presente: presenca.presente,
              justificativa: presenca.justificativa,
              justificativa_tipo: presenca.justificativa_tipo as JustificativaTipo,
              indice_esforco: (presenca.atleta as any).indice_esforco
            }))
          });
        }
      }
      
      return treinosComPresenca;
    }
  });
};

// Função para salvar dados de presença
export const useSalvarPresenca = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      treinoId, 
      atletaId, 
      presente, 
      justificativa, 
      justificativaTipo 
    }: { 
      treinoId: string; 
      atletaId: string; 
      presente: boolean; 
      justificativa?: string;
      justificativaTipo?: JustificativaTipo;
    }) => {
      // 1. Verificar se já existe registro
      const { data: existente, error: checkError } = await supabase
        .from('treinos_presencas')
        .select('id')
        .eq('treino_do_dia_id', treinoId)
        .eq('atleta_id', atletaId)
        .maybeSingle();
        
      if (checkError) throw checkError;
      
      // Preparar dados para inserção/atualização
      const presencaData = {
        treino_do_dia_id: treinoId,
        atleta_id: atletaId,
        presente: presente,
        justificativa: presente ? null : justificativa,
        justificativa_tipo: presente ? null : justificativaTipo
      };
      
      // 2. Inserir ou atualizar
      if (existente) {
        // Atualizar registro existente
        const { error: updateError } = await supabase
          .from('treinos_presencas')
          .update(presencaData)
          .eq('id', existente.id);
          
        if (updateError) throw updateError;
      } else {
        // Inserir novo registro
        const { error: insertError } = await supabase
          .from('treinos_presencas')
          .insert([presencaData]);
          
        if (insertError) throw insertError;
      }
      
      // 3. Atualizar índice de esforço do atleta
      await atualizarIndiceEsforco(atletaId);
      
      return { success: true };
    },
    onSuccess: () => {
      toast.success('Presença salva com sucesso');
      queryClient.invalidateQueries({ queryKey: ['treinos-presenca'] });
    },
    onError: (error) => {
      console.error('Erro ao salvar presença:', error);
      toast.error('Erro ao salvar presença');
    }
  });
};

// Função para calcular e atualizar o índice de esforço do atleta
export const atualizarIndiceEsforco = async (atletaId: string) => {
  try {
    // Buscar os últimos 10 treinos do atleta
    const { data: presencas, error } = await supabase
      .from('treinos_presencas')
      .select('presente, justificativa_tipo')
      .eq('atleta_id', atletaId)
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (error) throw error;
    if (!presencas || presencas.length === 0) return;
    
    // Calcular índice
    let pontuacaoTotal = 0;
    presencas.forEach(presenca => {
      if (presenca.presente) {
        // Presente = +1
        pontuacaoTotal += 1;
      } else {
        // Ausente com justificativa
        switch (presenca.justificativa_tipo) {
          case JustificativaTipo.MOTIVO_LOGISTICO:
            pontuacaoTotal += 0.5; // Meio ponto
            break;
          case JustificativaTipo.MOTIVO_ACADEMICO:
          case JustificativaTipo.MOTIVO_PESSOAL:
          case JustificativaTipo.MOTIVO_SAUDE:
            pontuacaoTotal += 0; // Neutro
            break;
          case JustificativaTipo.SEM_JUSTIFICATIVA:
          default:
            pontuacaoTotal -= 1; // Negativo
            break;
        }
      }
    });
    
    // Calcular índice normalizado entre -1 e 1
    const indiceEsforco = pontuacaoTotal / presencas.length;
    const indiceNormalizado = Math.max(-1, Math.min(1, indiceEsforco));
    
    // Atualizar no banco de dados
    const { error: updateError } = await supabase
      .from('athletes')
      .update({ indice_esforco: indiceNormalizado })
      .eq('id', atletaId);
      
    if (updateError) throw updateError;
    
    return indiceNormalizado;
  } catch (error) {
    console.error('Erro ao atualizar índice de esforço:', error);
    return null;
  }
};
