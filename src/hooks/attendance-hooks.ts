import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  dataFormatada: string;
  nome: string;
  atletas: AtletaPresenca[];
}

// Função para formatar data
const formatarData = (dataString: string | null | undefined): string => {
  if (!dataString) return 'Data não disponível';
  
  try {
    const data = new Date(dataString);
    return format(data, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch (e) {
    console.error('Erro ao formatar data:', e);
    return dataString || 'Data inválida';
  }
};

// Função para buscar treinos com dados de presença
export const useTreinosComPresenca = (limit: number = 20) => {
  return useQuery({
    queryKey: ['treinos-presenca', limit],
    queryFn: async (): Promise<TreinoComPresenca[]> => {
      try {
      // 1. Buscar treinos do dia
      const { data: treinosDoDia, error: treinosError } = await supabase
        .from('treinos_do_dia')
        .select(`
          id,
          data,
          treino:treino_id (
            id, 
            nome,
              time,
              data
          )
        `)
        .order('data', { ascending: false })
        .limit(limit);
        
        if (treinosError) {
          console.error('[DEBUG] Erro ao buscar treinos do dia:', treinosError);
          return [];
        }
        
        if (!treinosDoDia || treinosDoDia.length === 0) {
          console.log('[DEBUG] Nenhum treino do dia encontrado');
          return [];
        }
        
        console.log(`[DEBUG] Encontrados ${treinosDoDia.length} treinos do dia`);
      
      // 2. Para cada treino, buscar dados de presença
      const treinosComPresenca: TreinoComPresenca[] = [];
      
      for (const treinoDoDia of treinosDoDia) {
          if (!treinoDoDia.id) {
            console.log('[DEBUG] Treino do dia sem ID válido, pulando...');
            continue;
          }
          
          // Garantir que temos uma data válida, usando a data do treino ou do treino do dia
          const dataTreino = treinoDoDia.data || (treinoDoDia.treino as any)?.data;
          console.log(`[DEBUG] Processando treino do dia ${treinoDoDia.id} de ${dataTreino}`);
          
          if (!dataTreino) {
            console.log('[DEBUG] Data não encontrada para o treino, pulando...');
            continue;
          }
          
          try {
        // Buscar registros de presença para este treino
        const { data: presencas, error: presencasError } = await supabase
          .from('treinos_presencas')
          .select(`
            id,
            presente,
            justificativa,
            justificativa_tipo,
            indice_esforco,
                atleta_id
          `)
          .eq('treino_do_dia_id', treinoDoDia.id);
          
        if (presencasError) {
              console.error('[DEBUG] Erro ao buscar presenças:', presencasError);
          continue;
        }
        
            console.log(`[DEBUG] Encontradas ${presencas?.length || 0} presenças para o treino ${treinoDoDia.id}`);
            
            // Se não há registros de presença OU presencas é null/undefined
        if (!presencas || presencas.length === 0) {
              // Buscar atletas do time para criar registros padrão
              if (!treinoDoDia.treino) {
                console.log(`[DEBUG] Treino não encontrado para treino_do_dia ${treinoDoDia.id}`);
                continue;
              }
          
          const timeDoTreino = (treinoDoDia.treino as any).time;
              if (!timeDoTreino) {
                console.log(`[DEBUG] Time não encontrado para treino ${treinoDoDia.id}`);
                continue;
              }
              
              console.log(`[DEBUG] Buscando atletas do time ${timeDoTreino}`);
          
          const { data: atletas, error: atletasError } = await supabase
            .from('athletes')
            .select('id, nome, posicao, time, foto_url, indice_esforco')
            .eq('time', timeDoTreino);
            
              if (atletasError) {
                console.error('[DEBUG] Erro ao buscar atletas:', atletasError);
                continue;
              }
              
              if (!atletas || atletas.length === 0) {
                console.log(`[DEBUG] Nenhum atleta encontrado para o time ${timeDoTreino}`);
                continue;
              }
              
              console.log(`[DEBUG] Encontrados ${atletas.length} atletas para o time ${timeDoTreino}`);
          
          treinosComPresenca.push({
            id: treinoDoDia.id,
                data: dataTreino,
                dataFormatada: formatarData(dataTreino),
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
              // Se há registros de presença, precisamos buscar os dados dos atletas
              // Coletar todos os IDs de atletas
              const atletaIds = [...new Set(presencas.map(p => p.atleta_id))];
              
              if (atletaIds.length === 0) {
                console.log(`[DEBUG] Nenhum ID de atleta encontrado para o treino ${treinoDoDia.id}`);
                continue;
              }
              
              // Buscar detalhes dos atletas
              const { data: atletas, error: atletasError } = await supabase
                .from('athletes')
                .select('id, nome, posicao, time, foto_url, indice_esforco')
                .in('id', atletaIds);
                
              if (atletasError) {
                console.error('[DEBUG] Erro ao buscar detalhes dos atletas:', atletasError);
                continue;
              }
              
              if (!atletas || atletas.length === 0) {
                console.log(`[DEBUG] Nenhum detalhes de atleta encontrado`);
                continue;
              }
              
              // Criar um mapa para acesso rápido aos atletas
              const atletasMap = new Map(atletas.map(a => [a.id, a]));
              
              // Combinar dados de presença com detalhes dos atletas
              const atletasComPresenca = presencas.map(presenca => {
                const atleta = atletasMap.get(presenca.atleta_id);
                if (!atleta) return null;
                
                return {
                  id: atleta.id,
                  nome: atleta.nome,
                  posicao: atleta.posicao,
                  time: atleta.time,
                  foto_url: atleta.foto_url,
              presente: presenca.presente,
              justificativa: presenca.justificativa,
              justificativa_tipo: presenca.justificativa_tipo as JustificativaTipo,
                  indice_esforco: atleta.indice_esforco
                } as AtletaPresenca;
              }).filter(Boolean) as AtletaPresenca[];
              
              if (atletasComPresenca.length > 0) {
                console.log(`[DEBUG] Usando ${atletasComPresenca.length} registros de presença existentes`);
                
                treinosComPresenca.push({
                  id: treinoDoDia.id,
                  data: dataTreino,
                  dataFormatada: formatarData(dataTreino),
                  nome: (treinoDoDia.treino as any).nome || 'Treino sem nome',
                  atletas: atletasComPresenca
          });
        }
      }
          } catch (error) {
            console.error(`[DEBUG] Erro ao processar treino ${treinoDoDia.id}:`, error);
            continue;
          }
        }
        
        // Ordenar treinos por data (mais recentes primeiro)
        treinosComPresenca.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
        
        console.log(`[DEBUG] Total de treinos com presença: ${treinosComPresenca.length}`);
        console.log('[DEBUG] Exemplo de treino formatado:', treinosComPresenca[0]);
      
      return treinosComPresenca;
      } catch (error) {
        console.error('[DEBUG] Erro geral ao buscar treinos com presença:', error);
        return [];
      }
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
