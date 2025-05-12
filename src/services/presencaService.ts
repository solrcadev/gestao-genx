import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import dayjs from 'dayjs';
import { JustificativaTipo } from '@/hooks/attendance-hooks';
import { HistoricoPresenca } from '@/components/presenca/DetalhePresencaModal';

// Interface revisada para alinhar com a estrutura da tabela treinos_presencas
export interface Presenca {
  id: string;
  atleta_id?: string;
  treino_id?: string;
  treino_do_dia_id?: string;
  status: 'presente' | 'ausente';
  justificativa?: string;
  created_at?: string;
  // Dados relacionados
  atleta?: {
    id: string;
    nome: string;
    posicao: string;
    time: string;
  };
  treino?: {
    id: string;
    nome: string;
    data: string;
    local?: string;
  };
}

export interface FiltroPresenca {
  atletaId?: string;
  time?: string;
  status?: 'presente' | 'ausente';
  dataInicial?: Date;
  dataFinal?: Date;
}

/**
 * Busca presenças com filtros aplicados
 */
export async function buscarPresencas(filtros?: FiltroPresenca): Promise<Presenca[]> {
  try {
    // Validar que o atletaId não é 'undefined' como string
    if (filtros?.atletaId === 'undefined' || filtros?.atletaId === undefined) {
      delete filtros?.atletaId;
    }

    console.log('[DEBUG] Buscando presenças com filtros:', filtros);

    // Consulta simplificada para evitar erros 500
    let query = supabase
      .from('treinos_presencas')
      .select(`
        id,
        atleta_id,
        treino_do_dia_id,
        presente,
        justificativa,
        justificativa_tipo,
        created_at
      `);

    // Aplicar filtros se existirem
    if (filtros?.atletaId) {
      query = query.eq('atleta_id', filtros.atletaId);
    }

    if (filtros?.status === 'presente') {
      query = query.eq('presente', true);
    } else if (filtros?.status === 'ausente') {
      query = query.eq('presente', false);
    }

    const { data: presencas, error } = await query.order('created_at', { ascending: false }).limit(100);

    if (error) {
      console.error('[DEBUG] Erro ao buscar presenças:', error);
      return [];
    }

    // Se não temos dados, retornar array vazio
    if (!presencas || presencas.length === 0) {
      console.log('[DEBUG] Nenhuma presença encontrada');
      return [];
    }

    console.log(`[DEBUG] Encontradas ${presencas.length} presenças básicas`);
    
    // Buscar dados relacionados separadamente
    const atletaIds = [...new Set(presencas.map(p => p.atleta_id).filter(Boolean))];
    const treinoDoDiaIds = [...new Set(presencas.map(p => p.treino_do_dia_id).filter(Boolean))];

    // Verificar se os arrays não estão vazios antes de usar .in()
    let atletas = [];
    if (atletaIds.length > 0) {
      const { data } = await supabase
        .from('athletes')
        .select('id, nome, posicao, time')
        .in('id', atletaIds);
      
      atletas = data || [];
    }
    
    let treinosDosDia = [];
    if (treinoDoDiaIds.length > 0) {
      const { data } = await supabase
        .from('treinos_do_dia')
        .select(`
          id, 
          data,
          treino_id
        `)
        .in('id', treinoDoDiaIds);
      
      treinosDosDia = data || [];
    }
    
    // Buscar treinos se necessário
    const treinoIds = [...new Set(treinosDosDia.map(t => t.treino_id).filter(Boolean))];
    let treinos = [];
    
    if (treinoIds.length > 0) {
      const { data } = await supabase
        .from('treinos')
        .select('id, nome, data, local')
        .in('id', treinoIds);
      
      treinos = data || [];
    }
    
    // Mapear para acesso mais rápido
    const atletasMap = new Map(atletas.map(a => [a.id, a]));
    const treinosDoDiaMap = new Map(treinosDosDia.map(t => [t.id, t]));
    const treinosMap = new Map(treinos.map(t => [t.id, t]));
    
    // Transformar dados para o formato esperado
    const resultado = presencas.map(p => {
      // Buscar dados relacionados
      const atleta = atletasMap.get(p.atleta_id);
      const treinoDoDia = treinosDoDiaMap.get(p.treino_do_dia_id);
      const treino = treinoDoDia ? treinosMap.get(treinoDoDia.treino_id) : null;
      
      // Aplicar filtro por time quando necessário
      if (filtros?.time && (!atleta || atleta.time?.toLowerCase() !== filtros.time?.toLowerCase())) {
        return null; // Será filtrado abaixo
      }
      
      // Aplicar filtro por data do treino
      if (treino?.data && (filtros?.dataInicial || filtros?.dataFinal)) {
        const dataTreino = new Date(treino.data);
        
        if (filtros?.dataInicial && dataTreino < filtros.dataInicial) {
          return null;
        }
        
        if (filtros?.dataFinal) {
          const dataFinal = new Date(filtros.dataFinal);
          dataFinal.setHours(23, 59, 59, 999);
          
          if (dataTreino > dataFinal) {
            return null;
          }
        }
      }
      
      // Mapear para o formato de retorno
      return {
        id: p.id,
        atleta_id: p.atleta_id,
        treino_id: treino?.id,
        treino_do_dia_id: p.treino_do_dia_id,
        status: p.presente ? 'presente' : 'ausente',
        justificativa: p.justificativa,
        created_at: p.created_at,
        atleta,
        treino
      } as Presenca;
    }).filter(Boolean) as Presenca[]; // Filtrar os nulos (excluídos pelos filtros)
    
    console.log(`[DEBUG] Retornando ${resultado.length} presenças após aplicar todos os filtros`);
    return resultado;
    
  } catch (error) {
    console.error('[DEBUG] Erro ao buscar presenças:', error);
    return [];
  }
}

/**
 * Abordagem alternativa para buscar presenças sem junções 
 * (usado como fallback quando as junções falham)
 */
async function buscarPresencasAlternativo(filtros?: FiltroPresenca): Promise<Presenca[]> {
  try {
    console.log('[DEBUG] Usando abordagem alternativa de busca de presenças');
    
    // 1. Buscar registros básicos de presença sem junções complexas
    let query = supabase
      .from('treinos_presencas')
      .select('id, atleta_id, treino_do_dia_id, presente, justificativa, created_at');
      
    // Aplicar filtros básicos
    if (filtros?.atletaId) {
      query = query.eq('atleta_id', filtros.atletaId);
    }
    
    if (filtros?.status === 'presente') {
      query = query.eq('presente', true);
    } else if (filtros?.status === 'ausente') {
      query = query.eq('presente', false);
    }
    
    const { data: presencas, error } = await query.order('created_at', { ascending: false }).limit(50);
    
    if (error) {
      console.error('[DEBUG] Erro ao buscar presenças (alternativo):', error);
      return [];
    }
    
    if (!presencas || presencas.length === 0) {
      console.log('[DEBUG] Nenhuma presença encontrada (alternativo)');
      return [];
    }
    
    console.log(`[DEBUG] Encontradas ${presencas.length} presenças (alternativo)`);
    
    // Criar objetos simplificados para retorno
    return presencas.map(p => ({
        id: p.id,
        atleta_id: p.atleta_id,
        treino_do_dia_id: p.treino_do_dia_id,
        status: p.presente ? 'presente' : 'ausente',
        justificativa: p.justificativa,
      created_at: p.created_at
    } as Presenca));
    
  } catch (error) {
    console.error('[DEBUG] Erro na abordagem alternativa:', error);
    return [];
  }
}

/**
 * Busca todos os atletas para o filtro de autocomplete
 */
export async function buscarAtletas() {
  try {
    const { data, error } = await supabase
      .from('athletes')
      .select('id, nome, posicao, time')
      .order('nome');
    
    if (error) {
      console.error('Erro ao buscar atletas:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar atletas:', error);
    return [];
  }
}

/**
 * Registra uma alteração no log de auditoria
 */
export async function registrarAuditLog({
  presencaId,
  atletaId,
  treinoId,
  treinoDoDiaId,
  statusAnterior,
  statusNovo,
  justificativaAnterior,
  justificativaNova,
  tipoOperacao = 'edicao'
}: {
  presencaId: string;
  atletaId?: string;
  treinoId?: string;
  treinoDoDiaId?: string;
  statusAnterior?: 'presente' | 'ausente';
  statusNovo?: 'presente' | 'ausente';
  justificativaAnterior?: string | null;
  justificativaNova?: string | null;
  tipoOperacao?: 'edicao' | 'exclusao' | 'criacao';
}) {
  try {
    // Verificar se usuário está autenticado
    const { data: session } = await supabase.auth.getSession();
    const usuarioId = session?.session?.user?.id;
    
    if (!usuarioId) {
      console.error('Usuário não autenticado ao tentar registrar auditoria');
      return null;
    }
    
    // Inserir log na tabela de auditoria
    const { data, error } = await supabase
      .from('presencas_audit_log')
      .insert({
        presenca_id: presencaId,
        atleta_id: atletaId,
        treino_id: treinoId,
        treino_do_dia_id: treinoDoDiaId,
        status_anterior: statusAnterior === 'presente' ? true : statusAnterior === 'ausente' ? false : null,
        status_novo: statusNovo === 'presente' ? true : statusNovo === 'ausente' ? false : null,
        justificativa_anterior: justificativaAnterior,
        justificativa_nova: justificativaNova,
        usuario_id: usuarioId,
        tipo_operacao: tipoOperacao,
        data_alteracao: new Date().toISOString()
      })
      .select();
    
    if (error) {
      console.error('Erro ao registrar log de auditoria:', error);
      return null;
    }
    
    return data[0];
  } catch (error) {
    console.error('Erro ao registrar log de auditoria:', error);
    return null;
  }
}

/**
 * Interface para o histórico de alterações
 */
export interface HistoricoAlteracao {
  id: string;
  presenca_id: string;
  atleta_id?: string;
  treino_id?: string;
  treino_do_dia_id?: string;
  status_anterior: boolean | null;
  status_novo: boolean | null;
  justificativa_anterior?: string | null;
  justificativa_nova?: string | null;
  usuario_id: string;
  tipo_operacao: 'edicao' | 'exclusao' | 'criacao';
  data_alteracao: string;
  // Dados relacionados
  atleta?: {
    id: string;
    nome: string;
    posicao: string;
    time: string;
  };
  treino?: {
    id: string;
    nome: string;
    data: string;
  };
  usuario?: {
    id: string;
    email: string;
  };
}

/**
 * Busca histórico de alterações com filtros opcionais
 */
export async function buscarHistoricoAlteracoes({
  atletaId,
  treinoId,
  treinoDoDiaId,
  dataInicial,
  dataFinal,
  tipoOperacao
}: {
  atletaId?: string;
  treinoId?: string;
  treinoDoDiaId?: string;
  dataInicial?: Date;
  dataFinal?: Date;
  tipoOperacao?: 'edicao' | 'exclusao' | 'criacao';
} = {}): Promise<HistoricoAlteracao[]> {
  try {
    // Consulta principal com junções para atletas, treinos e usuários
    let query = supabase
      .from('presencas_audit_log')
      .select(`
        *,
        atleta:atleta_id(id, nome, posicao, time),
        treino:treino_id(id, nome, data),
        usuario:usuario_id(id, email)
      `)
      .order('data_alteracao', { ascending: false });
    
    // Aplicar filtros se existirem
    if (atletaId) {
      query = query.eq('atleta_id', atletaId);
    }
    
    if (treinoId) {
      query = query.eq('treino_id', treinoId);
    }
    
    if (treinoDoDiaId) {
      query = query.eq('treino_do_dia_id', treinoDoDiaId);
    }
    
    if (tipoOperacao) {
      query = query.eq('tipo_operacao', tipoOperacao);
    }
    
    if (dataInicial) {
      const dataInicialFormatada = dataInicial.toISOString();
      query = query.gte('data_alteracao', dataInicialFormatada);
    }
    
    if (dataFinal) {
      const dataFinalAjustada = new Date(dataFinal);
      dataFinalAjustada.setHours(23, 59, 59, 999);
      const dataFinalFormatada = dataFinalAjustada.toISOString();
      query = query.lte('data_alteracao', dataFinalFormatada);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Erro ao buscar histórico de alterações:', error);
      return [];
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    return data as HistoricoAlteracao[];
  } catch (error) {
    console.error('Erro ao buscar histórico de alterações:', error);
    return [];
  }
}

/**
 * Atualiza o status de presença (presente/ausente) com justificativa opcional 
 * Atualizado para incluir registro de auditoria
 */
export async function atualizarStatusPresenca(
  presencaId: string, 
  status: 'presente' | 'ausente', 
  justificativa?: string
) {
  try {
    if (!presencaId) {
      console.error("ID da presença inválido");
      return null;
    }
    
    // Primeiro, buscar o registro atual para comparar depois
    const { data: registroAtual, error: erroConsulta } = await supabase
      .from('treinos_presencas')
      .select('*')
      .eq('id', presencaId)
      .single();
    
    if (erroConsulta) {
      console.error('Erro ao buscar registro atual para auditoria:', erroConsulta);
      return null;
    }
    
    // Se status é 'presente', limpar justificativa
    const dadosAtualizacao = {
      presente: status === 'presente',
      justificativa: status === 'presente' ? null : justificativa
    };
    
    const { data, error } = await supabase
      .from('treinos_presencas')
      .update(dadosAtualizacao)
      .eq('id', presencaId)
      .select();
    
    if (error) {
      console.error("Erro ao atualizar status de presença:", error);
      return null;
    }
    
    // Registrar alteração no log de auditoria
    await registrarAuditLog({
      presencaId,
      atletaId: registroAtual.atleta_id,
      treinoId: registroAtual.treino_id,
      treinoDoDiaId: registroAtual.treino_do_dia_id,
      statusAnterior: registroAtual.presente ? 'presente' : 'ausente',
      statusNovo: status,
      justificativaAnterior: registroAtual.justificativa,
      justificativaNova: dadosAtualizacao.justificativa,
      tipoOperacao: 'edicao'
    });
    
    return data;
  } catch (error) {
    console.error('Erro ao atualizar status de presença:', error);
    return null;
  }
}

/**
 * Atualiza a justificativa de uma presença
 * Atualizado para incluir registro de auditoria
 */
export async function atualizarJustificativa(presencaId: string, justificativa: string) {
  try {
    if (!presencaId) {
      console.error("ID da presença inválido");
      return null;
    }
    
    // Primeiro, buscar o registro atual para comparar depois
    const { data: registroAtual, error: erroConsulta } = await supabase
      .from('treinos_presencas')
      .select('*')
      .eq('id', presencaId)
      .single();
    
    if (erroConsulta) {
      console.error('Erro ao buscar registro atual para auditoria:', erroConsulta);
      return null;
    }
    
    const { data, error } = await supabase
      .from('treinos_presencas')
      .update({ justificativa })
      .eq('id', presencaId)
      .select();
    
    if (error) {
      console.error("Erro ao atualizar justificativa:", error);
      return null;
    }
    
    // Registrar alteração no log de auditoria
    await registrarAuditLog({
      presencaId,
      atletaId: registroAtual.atleta_id,
      treinoId: registroAtual.treino_id,
      treinoDoDiaId: registroAtual.treino_do_dia_id,
      statusAnterior: registroAtual.presente ? 'presente' : 'ausente',
      statusNovo: registroAtual.presente ? 'presente' : 'ausente', // Não muda o status
      justificativaAnterior: registroAtual.justificativa,
      justificativaNova: justificativa,
      tipoOperacao: 'edicao'
    });
    
    return data;
  } catch (error) {
    console.error('Erro ao atualizar justificativa:', error);
    return null;
  }
}

/**
 * Exclui um registro de presença
 * Atualizado para incluir registro de auditoria
 */
export async function excluirPresenca(presencaId: string) {
  try {
    if (!presencaId) {
      console.error("ID da presença inválido");
      return false;
    }
    
    // Primeiro, buscar o registro atual para manter no histórico
    const { data: registroAtual, error: erroConsulta } = await supabase
      .from('treinos_presencas')
      .select('*')
      .eq('id', presencaId)
      .single();
    
    if (erroConsulta) {
      console.error('Erro ao buscar registro atual para auditoria:', erroConsulta);
      return false;
    }
    
    // Registrar exclusão no log antes de excluir
    await registrarAuditLog({
      presencaId,
      atletaId: registroAtual.atleta_id,
      treinoId: registroAtual.treino_id,
      treinoDoDiaId: registroAtual.treino_do_dia_id,
      statusAnterior: registroAtual.presente ? 'presente' : 'ausente',
      statusNovo: undefined, // excluído
      justificativaAnterior: registroAtual.justificativa,
      justificativaNova: undefined, // excluído
      tipoOperacao: 'exclusao'
    });
    
    // Agora sim exclui o registro
    const { error } = await supabase
      .from('treinos_presencas')
      .delete()
      .eq('id', presencaId);
    
    if (error) {
      console.error("Erro ao excluir presença:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao excluir presença:', error);
    return false;
  }
}

/**
 * Formata uma data para exibição
 */
export const formatarData = (dataString: string | Date | null | undefined): string => {
  if (!dataString) return 'Data não disponível';
  
  try {
    const data = new Date(dataString);
    return format(data, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch (e) {
    console.error('Erro ao formatar data:', e);
    return dataString instanceof Date ? dataString.toString() : (dataString || 'Data inválida');
  }
};

/**
 * Busca contagem de faltas por atleta no último mês
 */
export async function buscarFaltasPorAtleta(atletaId: string): Promise<number> {
  try {
    // Definir período do último mês
    const hoje = new Date();
    const umMesAtras = new Date();
    umMesAtras.setMonth(hoje.getMonth() - 1);
    
    const { data, error } = await supabase
      .from('treinos_presencas')
      .select('*')
      .eq('atleta_id', atletaId)
      .eq('presente', false)
      .gte('created_at', umMesAtras.toISOString())
      .lte('created_at', hoje.toISOString());
    
    if (error) {
      console.error('Erro ao buscar faltas por atleta:', error);
      return 0;
    }
    
    return data?.length || 0;
  } catch (error) {
    console.error('Erro ao buscar faltas por atleta:', error);
    return 0;
  }
}

/**
 * Verifica se já existe um registro de presença para o atleta no treino especificado
 */
export async function verificarPresencaDuplicada(atletaId: string, treinoDoDiaId: string) {
  try {
    if (!atletaId || !treinoDoDiaId) {
      return { duplicada: false, presencaExistente: null };
    }
    
    const { data, error } = await supabase
      .from('treinos_presencas')
      .select('*')
      .eq('atleta_id', atletaId)
      .eq('treino_do_dia_id', treinoDoDiaId);
    
    if (error) {
      console.error("Erro ao verificar presença duplicada:", error);
      return { duplicada: false, presencaExistente: null };
    }
    
    return { 
      duplicada: data && data.length > 0,
      presencaExistente: data && data.length > 0 ? data[0] : null
    };
  } catch (error) {
    console.error('Erro ao verificar presença duplicada:', error);
    return { duplicada: false, presencaExistente: null };
  }
}

/**
 * Verifica se um treino está finalizado (não pode mais ser editado)
 */
export async function verificarTreinoFinalizado(treinoDoDiaId: string) {
  try {
    if (!treinoDoDiaId) {
      return false;
    }
    
    const { data, error } = await supabase
      .from('treinos_do_dia')
      .select('aplicado')
      .eq('id', treinoDoDiaId)
      .single();
    
    if (error) {
      console.error("Erro ao verificar se treino está finalizado:", error);
      return false;
    }
    
    return data?.aplicado || false;
  } catch (error) {
    console.error('Erro ao verificar se treino está finalizado:', error);
    return false;
  }
}

// Constantes para pesos das justificativas
export const PESOS_JUSTIFICATIVA = {
  presente: 1.0,
  motivo_saude: 0.8,
  motivo_academico: 0.7,
  motivo_logistico: 0.5,
  motivo_pessoal: 0.3,
  sem_justificativa: 0.0
};

// Interface para resumo de presença de atleta
export interface ResumoPresencaAtleta {
  id: string;
  nome: string;
  time: string;
  posicao: string;
  foto_url?: string;
  indice_esforco: number;
  total_treinos: number;
  total_presencas: number;
  total_ausencias: number;
  faltas_sem_justificativa: number;
  faltas_justificadas: number;
}

// Função para buscar o resumo de presença de todos os atletas
export const buscarResumoPresencas = async (
  timeFilter?: string
): Promise<ResumoPresencaAtleta[]> => {
  try {
    // Usar a view que criamos para obter os resumos
    let query = supabase
      .from('atleta_presenca_resumo')
      .select('*');
    
    // Aplicar filtro de time se fornecido
    if (timeFilter) {
      query = query.eq('time', timeFilter);
    }
      
    const { data, error } = await query;
    
    if (error) {
      console.error('Erro ao buscar resumo de presenças:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Exceção ao buscar resumo de presenças:', error);
    return [];
  }
};

// Função para buscar histórico detalhado de presenças de um atleta
export const buscarHistoricoPresenca = async (
  atletaId: string,
  limit: number = 100
): Promise<HistoricoPresenca[]> => {
  try {
    // Usar a view que criamos para obter histórico detalhado
    const { data, error } = await supabase
      .from('atleta_presenca_detalhada')
      .select('*')
      .eq('atleta_id', atletaId)
      .order('data_treino', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error(`Erro ao buscar histórico de presenças para atleta ${atletaId}:`, error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error(`Exceção ao buscar histórico de presenças para atleta ${atletaId}:`, error);
    return [];
  }
};

// Função para atualizar presença de um atleta
export const atualizarPresenca = async (
  atletaId: string,
  treinoId: string,
  presente: boolean,
  justificativa?: string,
  justificativaTipo?: JustificativaTipo
): Promise<boolean> => {
  try {
    // Primeiro verificar se já existe um registro
    const { data: existingData, error: checkError } = await supabase
      .from('treinos_presencas')
      .select('id')
      .eq('atleta_id', atletaId)
      .eq('treino_do_dia_id', treinoId)
      .maybeSingle();
    
    if (checkError) {
      console.error('Erro ao verificar registro de presença existente:', checkError);
      return false;
    }
    
    // Preparar o payload
    const payload = {
      atleta_id: atletaId,
      treino_do_dia_id: treinoId,
      presente,
      justificativa: presente ? null : justificativa,
      justificativa_tipo: presente ? null : (justificativaTipo || JustificativaTipo.SEM_JUSTIFICATIVA)
    };
    
    if (existingData?.id) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('treinos_presencas')
        .update(payload)
        .eq('id', existingData.id);
      
      if (updateError) {
        console.error('Erro ao atualizar registro de presença:', updateError);
        return false;
      }
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from('treinos_presencas')
        .insert([payload]);
      
      if (insertError) {
        console.error('Erro ao inserir registro de presença:', insertError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Exceção ao atualizar presença:', error);
    return false;
  }
};

// Função para buscar o índice de esforço de um atleta
export const buscarIndiceEsforco = async (atletaId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('athletes')
      .select('indice_esforco')
      .eq('id', atletaId)
      .single();
    
    if (error) {
      console.error(`Erro ao buscar índice de esforço para atleta ${atletaId}:`, error);
      return 0;
    }
    
    return data?.indice_esforco || 0;
  } catch (error) {
    console.error(`Exceção ao buscar índice de esforço para atleta ${atletaId}:`, error);
    return 0;
  }
};

// Função para formatar a descrição da justificativa
export const formatarJustificativa = (tipo?: JustificativaTipo): string => {
  switch (tipo) {
    case JustificativaTipo.MOTIVO_SAUDE:
      return 'Motivo de Saúde';
    case JustificativaTipo.MOTIVO_ACADEMICO:
      return 'Motivo Acadêmico';
    case JustificativaTipo.MOTIVO_LOGISTICO:
      return 'Motivo Logístico';
    case JustificativaTipo.MOTIVO_PESSOAL:
      return 'Motivo Pessoal';
    case JustificativaTipo.SEM_JUSTIFICATIVA:
      return 'Sem Justificativa';
    default:
      return 'Não informado';
  }
};

// Função para calcular a cor baseada no índice de esforço
export const getIndiceEsforcoColor = (indice: number): string => {
  if (indice >= 0.9) return 'bg-green-500';
  if (indice >= 0.75) return 'bg-emerald-500';
  if (indice >= 0.6) return 'bg-blue-500';
  if (indice >= 0.4) return 'bg-yellow-500';
  if (indice >= 0.2) return 'bg-orange-500';
  return 'bg-red-500';
}; 