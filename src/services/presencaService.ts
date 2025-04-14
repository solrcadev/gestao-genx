import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import dayjs from 'dayjs';

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

    console.log('Buscando presenças com filtros:', filtros);

    // Consulta principal com junções para atletas e treinos
    let query = supabase
      .from('treinos_presencas')
      .select(`
        *,
        atleta:atleta_id(id, nome, posicao, time),
        treino_do_dia:treino_do_dia_id(
          id,
          treino:treino_id(
            id, 
            nome, 
            data, 
            local
          )
        )
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

    const { data: presencas, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar presenças:', error);
      
      // Se falhar a junção, tentar abordagem alternativa
      console.log('Tentando abordagem alternativa sem junções...');
      return buscarPresencasAlternativo(filtros);
    }

    // Se não temos dados, retornar array vazio
    if (!presencas || presencas.length === 0) {
      console.log('Nenhuma presença encontrada');
      return [];
    }

    console.log(`Encontradas ${presencas.length} presenças`);
    
    // Transformar dados para o formato esperado
    const resultado = presencas.map(p => {
      // Verificar se temos os dados relacionados
      const atleta = p.atleta;
      const treino = p.treino_do_dia?.treino;
      
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
    
    console.log(`Retornando ${resultado.length} presenças após aplicar todos os filtros`);
    return resultado;
    
  } catch (error) {
    console.error('Erro ao buscar presenças:', error);
    return [];
  }
}

/**
 * Abordagem alternativa para buscar presenças sem junções 
 * (usado como fallback quando as junções falham)
 */
async function buscarPresencasAlternativo(filtros?: FiltroPresenca): Promise<Presenca[]> {
  try {
    // 1. Buscar registros básicos de presença
    let query = supabase
      .from('treinos_presencas')
      .select('*');
      
    // Aplicar filtros básicos
    if (filtros?.atletaId) {
      query = query.eq('atleta_id', filtros.atletaId);
    }
    
    if (filtros?.status === 'presente') {
      query = query.eq('presente', true);
    } else if (filtros?.status === 'ausente') {
      query = query.eq('presente', false);
    }
    
    const { data: presencas, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar presenças (alternativo):', error);
      return [];
    }
    
    if (!presencas || presencas.length === 0) {
      return [];
    }
    
    // 2. Buscar atletas e treinos relacionados
    const atletaIds = [...new Set(presencas.map(p => p.atleta_id).filter(Boolean))];
    const treinoDoDiaIds = [...new Set(presencas.map(p => p.treino_do_dia_id).filter(Boolean))];
    
    // Buscar atletas
    const { data: atletas } = await supabase
      .from('athletes')
      .select('id, nome, posicao, time')
      .in('id', atletaIds);
      
    // Buscar treinos do dia
    const { data: treinosDosDia } = await supabase
      .from('treinos_do_dia')
      .select('id, treino_id')
      .in('id', treinoDoDiaIds);
      
    // Buscar treinos
    const treinoIds = treinosDosDia?.map(t => t.treino_id).filter(Boolean) || [];
    const { data: treinos } = await supabase
      .from('treinos')
      .select('id, nome, data, local')
      .in('id', treinoIds);
    
    // Criar mapas para acesso rápido
    const atletasMap = new Map(atletas?.map(a => [a.id, a]) || []);
    const treinosDoDiaMap = new Map(treinosDosDia?.map(t => [t.id, t]) || []);
    const treinosMap = new Map(treinos?.map(t => [t.id, t]) || []);
    
    // 3. Combinar os dados
    const resultado = presencas.map(p => {
      const atleta = p.atleta_id ? atletasMap.get(p.atleta_id) : undefined;
      
      // Para acessar o treino, precisamos ir através do treino_do_dia
      const treinoDoDia = p.treino_do_dia_id ? treinosDoDiaMap.get(p.treino_do_dia_id) : undefined;
      const treino = treinoDoDia?.treino_id ? treinosMap.get(treinoDoDia.treino_id) : undefined;
      
      // Aplicar filtro por time quando necessário
      if (filtros?.time && (!atleta || atleta.time?.toLowerCase() !== filtros.time?.toLowerCase())) {
        return null;
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
    }).filter(Boolean) as Presenca[];
    
    return resultado;
  } catch (error) {
    console.error('Erro na abordagem alternativa:', error);
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
export function formatarData(data: string | Date | null | undefined): string {
  if (!data) return 'Data não disponível';
  
  try {
    return format(new Date(data), 'dd/MM/yyyy', { locale: pt });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return 'Data inválida';
  }
}

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