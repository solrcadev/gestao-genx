import { supabase } from '@/lib/supabase';
import { 
  AtaReuniao, 
  AtaReuniaoResumida, 
  FiltroAtasReuniao, 
  TopicoDaAta, 
  DecisaoDaAta, 
  ResumoAtas 
} from '@/types/atasReuniao';
import { toast } from 'sonner';
import { v4 as uuidv4 } from "uuid";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Nome da tabela no Supabase
const TABELA_ATAS = 'atas_reuniao';

// Buscar todas as atas de reunião
export const fetchAtasReuniao = async (): Promise<AtaReuniao[]> => {
  try {
    const { data, error } = await supabase
      .from(TABELA_ATAS)
      .select('*')
      .order('data', { ascending: false });

    if (error) {
      console.error('Erro ao buscar atas de reunião:', error);
      throw new Error(`Erro ao buscar atas de reunião: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar atas de reunião:', error);
    throw error;
  }
};

// Alias para buscarTodasAtas
export const buscarTodasAtas = fetchAtasReuniao;

// Buscar atas de reunião com filtros
export const fetchAtasReuniaoComFiltros = async (filtros: FiltroAtasReuniao): Promise<AtaReuniao[]> => {
  try {
    let query = supabase
      .from(TABELA_ATAS)
      .select('*');

    // Aplicar filtros se fornecidos
    if (filtros.titulo) {
      query = query.ilike('titulo', `%${filtros.titulo}%`);
    }

    if (filtros.dataInicio) {
      query = query.gte('data', filtros.dataInicio);
    }

    if (filtros.dataFim) {
      query = query.lte('data', filtros.dataFim);
    }

    if (filtros.participante) {
      // Filtrar por participante que esteja no array de participantes
      query = query.contains('participantes', [filtros.participante]);
    }

    // Ordenar por data decrescente
    query = query.order('data', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar atas de reunião com filtros:', error);
      throw new Error(`Erro ao buscar atas de reunião com filtros: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar atas com filtros:', error);
    throw error;
  }
};

// Buscar uma ata de reunião específica pelo ID
export const fetchAtaReuniao = async (id: string): Promise<AtaReuniao | null> => {
  try {
    const { data, error } = await supabase
      .from(TABELA_ATAS)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Ata não encontrada
      }
      console.error(`Erro ao buscar ata de reunião com ID ${id}:`, error);
      throw new Error(`Erro ao buscar ata de reunião: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error(`Erro ao buscar ata de reunião com ID ${id}:`, error);
    throw error;
  }
};

// Alias para buscarAtaPorId
export const buscarAtaPorId = fetchAtaReuniao;

// Criar uma nova ata de reunião
export const criarAtaReuniao = async (ata: AtaReuniao): Promise<AtaReuniao> => {
  try {
    // Formatar a data para ISO se for um objeto Date
    const dataFormatada = ata.data instanceof Date 
      ? ata.data.toISOString().split('T')[0] 
      : ata.data;

    // Garantir que participantes, tópicos e decisões sejam arrays
    const participantes = Array.isArray(ata.participantes) ? ata.participantes : [];
    const topicos = Array.isArray(ata.topicos) ? ata.topicos : [];
    const decisoes = Array.isArray(ata.decisoes) ? ata.decisoes : [];

    // Criar novo objeto para inserção
    const novaAta = {
      id: ata.id || uuidv4(),
      titulo: ata.titulo,
      data: dataFormatada,
      participantes,
      topicos,
      decisoes,
      observacoes: ata.observacoes,
      responsavelRegistro: ata.responsavelRegistro
    };

    const { data, error } = await supabase
      .from(TABELA_ATAS)
      .insert(novaAta)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar ata de reunião:', error);
      throw new Error(`Erro ao criar ata de reunião: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Erro ao criar ata de reunião:', error);
    throw error;
  }
};

// Alias simplificado para criarAtaReuniao
export const criarAta = async (ata: AtaReuniao): Promise<string | null> => {
  const novaAta = await criarAtaReuniao(ata);
  return novaAta?.id || null;
};

// Atualizar uma ata de reunião existente
export const atualizarAtaReuniao = async (ata: AtaReuniao): Promise<AtaReuniao> => {
  try {
    if (!ata.id) {
      throw new Error('ID da ata não fornecido para atualização');
    }

    // Verificar se a ata existe
    const existingAta = await fetchAtaReuniao(ata.id);
    if (!existingAta) {
      throw new Error(`Ata de reunião com ID ${ata.id} não encontrada`);
    }

    // Formatar a data para ISO se for um objeto Date
    const dataFormatada = ata.data instanceof Date 
      ? ata.data.toISOString().split('T')[0] 
      : ata.data;

    // Atualizar a ata
    const atualizada = {
      titulo: ata.titulo,
      data: dataFormatada,
      participantes: ata.participantes,
      topicos: ata.topicos,
      decisoes: ata.decisoes,
      observacoes: ata.observacoes,
      responsavelRegistro: ata.responsavelRegistro
    };

    const { data, error } = await supabase
      .from(TABELA_ATAS)
      .update(atualizada)
      .eq('id', ata.id)
      .select()
      .single();

    if (error) {
      console.error(`Erro ao atualizar ata de reunião com ID ${ata.id}:`, error);
      throw new Error(`Erro ao atualizar ata de reunião: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Erro ao atualizar ata de reunião:', error);
    throw error;
  }
};

// Alias simplificado para atualizarAtaReuniao
export const atualizarAta = async (id: string, ata: Partial<AtaReuniao>): Promise<boolean> => {
  const ataCompleta = await fetchAtaReuniao(id);
  if (!ataCompleta) return false;
  
  await atualizarAtaReuniao({ ...ataCompleta, ...ata, id });
  return true;
};

// Excluir uma ata de reunião
export const excluirAtaReuniao = async (id: string): Promise<boolean> => {
  try {
    // Verificar se a ata existe
    const existingAta = await fetchAtaReuniao(id);
    if (!existingAta) {
      console.warn(`Tentativa de excluir ata inexistente com ID ${id}`);
      return false;
    }

    const { error } = await supabase
      .from(TABELA_ATAS)
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Erro ao excluir ata de reunião com ID ${id}:`, error);
      throw new Error(`Erro ao excluir ata de reunião: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error('Erro ao excluir ata de reunião:', error);
    throw error;
  }
};

// Buscar resumo de atas para dashboard
export const fetchResumoAtas = async (): Promise<ResumoAtas> => {
  try {
    const { data, error } = await supabase
      .from(TABELA_ATAS)
      .select('*');

    if (error) {
      console.error('Erro ao buscar resumo de atas:', error);
      throw new Error(`Erro ao buscar resumo de atas: ${error.message}`);
    }

    const atas = data || [];
    
    // Calcular totais
    const totalAtas = atas.length;
    
    // Set para contar participantes únicos
    const participantesUnicos = new Set<string>();
    
    let totalTopicos = 0;
    let totalDecisoes = 0;
    
    atas.forEach(ata => {
      // Adicionar participantes ao set
      if (Array.isArray(ata.participantes)) {
        ata.participantes.forEach(p => participantesUnicos.add(p));
      }
      
      // Contar tópicos e decisões
      totalTopicos += Array.isArray(ata.topicos) ? ata.topicos.length : 0;
      totalDecisoes += Array.isArray(ata.decisoes) ? ata.decisoes.length : 0;
    });
    
    const totalParticipantes = participantesUnicos.size;
    
    return {
      totalAtas,
      totalParticipantes,
      totalTopicos,
      totalDecisoes
    };
  } catch (error) {
    console.error('Erro ao calcular resumo das atas:', error);
    return {
      totalAtas: 0,
      totalParticipantes: 0,
      totalTopicos: 0,
      totalDecisoes: 0
    };
  }
};

// Função para validar uma ata antes de criar/atualizar
export const validarAta = (ata: AtaReuniao): string[] => {
  const erros: string[] = [];
  
  if (!ata.titulo || ata.titulo.trim() === '') {
    erros.push('O título da ata é obrigatório');
  }
  
  if (!ata.data) {
    erros.push('A data da reunião é obrigatória');
  }
  
  if (!ata.participantes || ata.participantes.length === 0) {
    erros.push('É necessário adicionar pelo menos um participante');
  }

  if (!ata.topicos || ata.topicos.length === 0) {
    erros.push('É necessário adicionar pelo menos um tópico');
  } else {
    ata.topicos.forEach((topico, index) => {
      if (!topico.descricao || topico.descricao.trim() === '') {
        erros.push(`A descrição do tópico ${index + 1} é obrigatória`);
      }
    });
  }

  if (ata.decisoes && ata.decisoes.length > 0) {
    ata.decisoes.forEach((decisao, index) => {
      if (!decisao.descricao || decisao.descricao.trim() === '') {
        erros.push(`A descrição da decisão ${index + 1} é obrigatória`);
      }
    });
  }

  return erros;
};

// Verificar se a tabela existe e criar se necessário
export const verificarECriarTabelaAtas = async (): Promise<boolean> => {
  try {
    // Verificar se a tabela existe
    const { count, error: countError } = await supabase
      .from(TABELA_ATAS)
      .select('*', { count: 'exact', head: true });
    
    // Se não houve erro ao contar, a tabela existe
    if (countError === null) {
      console.log('Tabela de atas já existe');
      return true;
    }
    
    // Se o erro não for relacionado à inexistência da tabela
    if (countError.code !== '42P01') {
      console.error('Erro ao verificar tabela de atas:', countError);
      return false;
    }
    
    // Criar a tabela usando o SQL
    const sql = getSQLCriacaoTabela();
    const { error } = await supabase.rpc('executar_sql', { sql_command: sql });
    
    if (error) {
      console.error('Erro ao criar tabela de atas:', error);
      return false;
    }
    
    console.log('Tabela de atas criada com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao verificar/criar tabela de atas:', error);
    return false;
  }
};

// SQL para criar a tabela de atas
export const getSQLCriacaoTabela = (): string => {
  return `
  CREATE TABLE IF NOT EXISTS ${TABELA_ATAS} (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo TEXT NOT NULL,
    data DATE NOT NULL,
    participantes TEXT[] NOT NULL DEFAULT '{}',
    topicos JSONB NOT NULL DEFAULT '[]',
    decisoes JSONB NOT NULL DEFAULT '[]',
    observacoes TEXT,
    responsavelRegistro TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Criar função para atualizar o timestamp de updated_at
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  -- Criar trigger para atualizar o timestamp automaticamente
  DROP TRIGGER IF EXISTS update_atas_reuniao_updated_at ON ${TABELA_ATAS};
  CREATE TRIGGER update_atas_reuniao_updated_at
  BEFORE UPDATE ON ${TABELA_ATAS}
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

  -- Configurar Row Level Security
  ALTER TABLE ${TABELA_ATAS} ENABLE ROW LEVEL SECURITY;

  -- Criar política para permitir acesso a usuários autenticados
  DROP POLICY IF EXISTS "Usuários autenticados podem gerenciar atas" ON ${TABELA_ATAS};
  CREATE POLICY "Usuários autenticados podem gerenciar atas"
  ON ${TABELA_ATAS}
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
  `;
};

// Buscar estatísticas sobre as atas de reunião
export const fetchEstatisticasAtas = async (): Promise<ResumoAtas> => {
  try {
    const { data, error } = await supabase
      .from(TABELA_ATAS)
      .select(`
        id,
        data,
        participantes,
        topicos,
        decisoes
      `);

    if (error) {
      console.error('Erro ao buscar estatísticas de atas:', error);
      throw new Error(error.message);
    }

    const atas = data || [];
    const totalAtas = atas.length;
    
    if (totalAtas === 0) {
      return {
        totalAtas: 0,
        totalParticipantes: 0,
        totalTopicos: 0,
        totalDecisoes: 0
      };
    }

    // Calcular o total de participantes únicos
    const participantesUnicos = new Set<string>();
    atas.forEach(ata => {
      if (Array.isArray(ata.participantes)) {
        ata.participantes.forEach(p => participantesUnicos.add(p));
      }
    });

    const totalParticipantes = participantesUnicos.size;

    // Calcular o total de tópicos e decisões
    let totalTopicos = 0;
    let totalDecisoes = 0;
    
    atas.forEach(ata => {
      totalTopicos += Array.isArray(ata.topicos) ? ata.topicos.length : 0;
      totalDecisoes += Array.isArray(ata.decisoes) ? ata.decisoes.length : 0;
    });

    return {
      totalAtas,
      totalParticipantes,
      totalTopicos,
      totalDecisoes
    };
  } catch (error) {
    console.error('Erro ao calcular estatísticas das atas:', error);
    toast.error('Erro ao carregar estatísticas');
    
    return {
      totalAtas: 0,
      totalParticipantes: 0,
      totalTopicos: 0,
      totalDecisoes: 0
    };
  }
};

/**
 * Busca atas de reunião onde um determinado participante está incluído
 */
export const buscarAtasPorParticipante = async (participante: string): Promise<AtaReuniao[]> => {
  try {
    const { data, error } = await supabase
      .from(TABELA_ATAS)
      .select('*')
      .contains('participantes', [participante])
      .order('data', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar atas por participante:', error);
    toast.error('Erro ao carregar atas de reunião');
    return [];
  }
};

/**
 * Exporta uma ata de reunião para JSON
 */
export const exportarAtaParaJSON = (ata: AtaReuniao): string => {
  return JSON.stringify(ata, null, 2);
};

/**
 * Exporta uma ata de reunião para PDF
 */
export const exportarAtaParaPDF = (ata: AtaReuniao): jsPDF => {
  const doc = new jsPDF();
  
  // Título do documento
  doc.setFontSize(18);
  doc.text('Ata de Reunião', 105, 15, { align: 'center' });
  
  // Data de geração
  doc.setFontSize(10);
  doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 105, 22, { align: 'center' });
  
  // Informações básicas
  doc.setFontSize(14);
  doc.text(ata.titulo, 14, 35);
  
  doc.setFontSize(11);
  doc.text(`Data: ${format(new Date(ata.data), 'dd/MM/yyyy', { locale: ptBR })}`, 14, 45);
  
  if (ata.responsavelRegistro) {
    doc.text(`Responsável: ${ata.responsavelRegistro}`, 14, 52);
  }
  
  // Participantes
  doc.setFontSize(12);
  doc.text('Participantes:', 14, 62);
  
  let y = 69;
  doc.setFontSize(10);
  
  // Lista de participantes em até 3 colunas
  const participantesPorLinha = 3;
  const participantes = [...ata.participantes];
  
  for (let i = 0; i < participantes.length; i += participantesPorLinha) {
    const linha = participantes.slice(i, i + participantesPorLinha);
    const posicoes = [14, 105 / 2, 105 + 14];
    
    linha.forEach((participante, index) => {
      if (index < posicoes.length) {
        doc.text(`• ${participante}`, posicoes[index], y);
      }
    });
    
    y += 7;
  }
  
  y += 5;
  
  // Tópicos discutidos
  doc.setFontSize(12);
  doc.text('Tópicos Discutidos:', 14, y);
  y += 10;
  
  // Tabela de tópicos
  if (ata.topicos.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Descrição']],
      body: ata.topicos.map(topico => [
        topico.descricao
      ]),
      headStyles: {
        fillColor: [83, 83, 83],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: {
        overflow: 'linebreak',
        cellPadding: 4
      }
    });
    
    y = (doc as any).lastAutoTable.finalY + 10;
  } else {
    doc.setFontSize(10);
    doc.text('Nenhum tópico registrado.', 14, y);
    y += 10;
  }
  
  // Decisões tomadas
  doc.setFontSize(12);
  doc.text('Decisões Tomadas:', 14, y);
  y += 10;
  
  // Tabela de decisões
  if (ata.decisoes && ata.decisoes.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Descrição', 'Responsável']],
      body: ata.decisoes.map(decisao => [
        decisao.descricao,
        decisao.responsavel || '-'
      ]),
      headStyles: {
        fillColor: [83, 83, 83],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 40 }
      },
      styles: {
        overflow: 'linebreak',
        cellPadding: 4
      }
    });
    
    y = (doc as any).lastAutoTable.finalY + 10;
  } else {
    doc.setFontSize(10);
    doc.text('Nenhuma decisão registrada.', 14, y);
    y += 10;
  }
  
  // Observações
  if (ata.observacoes) {
    doc.setFontSize(12);
    doc.text('Observações:', 14, y);
    y += 8;
    
    doc.setFontSize(10);
    
    // Quebrar o texto em linhas para não ultrapassar a largura da página
    const observacoesLinhas = doc.splitTextToSize(ata.observacoes, 180);
    doc.text(observacoesLinhas, 14, y);
  }
  
  return doc;
};

/**
 * Importa uma ata a partir de um objeto JSON
 */
export const importarAtaDeJSON = async (json: string): Promise<AtaReuniao | null> => {
  try {
    const ata = JSON.parse(json) as AtaReuniao;
    
    // Validar se o objeto tem a estrutura esperada
    if (!ata.titulo || !ata.data || !Array.isArray(ata.participantes) || !Array.isArray(ata.topicos)) {
      toast.error('O arquivo JSON não contém uma ata de reunião válida');
      return null;
    }
    
    // Remover o ID para criar uma nova ata
    const { id, ...ataSemId } = ata;
    
    // Criar nova ata baseada no JSON importado
    return await criarAtaReuniao(ataSemId as AtaReuniao);
  } catch (error) {
    console.error('Erro ao importar ata de JSON:', error);
    toast.error('Erro ao importar ata de reunião');
    return null;
  }
};

/*
// Para implementações futuras:

// Exportar ata para PDF
export const exportarAtaParaPDF = async (id: string): Promise<Blob> => {
  // Implementação futura
};

// Adicionar tarefas derivadas de uma ata
export const adicionarTarefasDeAta = async (ataId: string, tarefas: any[]): Promise<void> => {
  // Implementação futura
};

// Notificar participantes sobre uma nova ata
export const notificarParticipantes = async (ataId: string): Promise<void> => {
  // Implementação futura
};
*/ 