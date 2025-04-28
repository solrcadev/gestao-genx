import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

// Tipo para evento qualificado
export interface EventoQualificado {
  id?: string;
  atleta_id: string;
  treino_id?: string;
  fundamento: string;
  tipo_evento: string;
  peso: number;
  timestamp?: string;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

// Tipo para filtros de busca
export interface FiltroEventosQualificados {
  atleta_id?: string;
  treino_id?: string;
  fundamento?: string;
  tipo_evento?: string;
  data_inicio?: string;
  data_fim?: string;
}

// Estrutura para armazenar os tipos predefinidos por fundamento
export interface ConfigFundamento {
  fundamento: string;
  eventos: {
    tipo: string;
    peso: number;
    descricao?: string;
  }[];
}

// Lista de fundamentos disponíveis
export const FUNDAMENTOS = ['Saque', 'Recepção', 'Levantamento', 'Ataque', 'Bloqueio', 'Defesa'];

// Configuração padrão de eventos qualificados por fundamento
export const CONFIG_EVENTOS_QUALIFICADOS: ConfigFundamento[] = [
  {
    fundamento: 'Saque',
    eventos: [
      { tipo: 'Ace', peso: 3.0, descricao: 'Saque direto, sem recepção do adversário' },
      { tipo: 'Eficiente', peso: 1.0, descricao: 'Saque que dificulta a construção do adversário' },
      { tipo: 'Regular', peso: 0.5, descricao: 'Saque que não gera dificuldade ao adversário' },
      { tipo: 'Erro', peso: -2.0, descricao: 'Erro de saque' }
    ]
  },
  {
    fundamento: 'Recepção',
    eventos: [
      { tipo: 'Perfeita', peso: 3.0, descricao: 'Recepção que permite todas as opções de ataque' },
      { tipo: 'Boa', peso: 1.5, descricao: 'Recepção que limita algumas opções de ataque' },
      { tipo: 'Ruim', peso: -0.5, descricao: 'Recepção que permite apenas uma opção de ataque' },
      { tipo: 'Erro', peso: -2.0, descricao: 'Erro de recepção' }
    ]
  },
  {
    fundamento: 'Levantamento',
    eventos: [
      { tipo: 'Excelente', peso: 2.5, descricao: 'Levantamento que cria situação ideal para o atacante' },
      { tipo: 'Bom', peso: 1.0, descricao: 'Levantamento que permite ataque em condições favoráveis' },
      { tipo: 'Ruim', peso: -0.5, descricao: 'Levantamento que dificulta a ação do atacante' },
      { tipo: 'Erro', peso: -2.0, descricao: 'Erro de levantamento' }
    ]
  },
  {
    fundamento: 'Ataque',
    eventos: [
      { tipo: 'Ponto', peso: 3.0, descricao: 'Ataque que resulta em ponto direto' },
      { tipo: 'Eficiente', peso: 1.5, descricao: 'Ataque que dificulta a defesa adversária' },
      { tipo: 'Bloqueado', peso: -1.0, descricao: 'Ataque bloqueado pelo adversário' },
      { tipo: 'Erro', peso: -2.0, descricao: 'Erro de ataque' }
    ]
  },
  {
    fundamento: 'Bloqueio',
    eventos: [
      { tipo: 'Ponto', peso: 3.0, descricao: 'Bloqueio que resulta em ponto direto' },
      { tipo: 'Eficiente', peso: 1.5, descricao: 'Bloqueio que facilita a defesa' },
      { tipo: 'Ineficiente', peso: -0.5, descricao: 'Bloqueio que não cumpre sua função' },
      { tipo: 'Erro', peso: -1.5, descricao: 'Erro de bloqueio' }
    ]
  },
  {
    fundamento: 'Defesa',
    eventos: [
      { tipo: 'Excelente', peso: 3.0, descricao: 'Defesa que permite contra-ataque organizado' },
      { tipo: 'Boa', peso: 1.5, descricao: 'Defesa que permite alguma organização de jogo' },
      { tipo: 'Ruim', peso: -0.5, descricao: 'Defesa que dificulta a continuidade da jogada' },
      { tipo: 'Erro', peso: -1.5, descricao: 'Erro de defesa' }
    ]
  }
];

// Função para verificar e criar a tabela se não existir
export async function verificarECriarTabelaEventosQualificados(): Promise<boolean> {
  try {
    // Tentar acessar a tabela diretamente ao invés de verificar pg_proc
    const { data, error } = await supabase
      .from('avaliacoes_eventos_qualificados')
      .select('id')
      .limit(1);
    
    // Se não houver erro, a tabela existe
    if (!error) {
      console.log("Tabela avaliacoes_eventos_qualificados já existe");
      return true;
    }

    // Se houver erro de tipo "não existe", tentar criar a tabela
    if (error.message.includes("relation") && error.message.includes("does not exist")) {
      console.log("Tabela avaliacoes_eventos_qualificados não existe, tentando criar...");
      
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('criar_tabela_eventos_qualificados');
      
      if (rpcError) {
        console.error("Erro ao criar tabela:", rpcError);
        toast({
          title: "Erro",
          description: "Não foi possível criar a tabela no banco de dados. Funcionando em modo offline.",
          duration: 6000
        });
        return false;
      }
      
      toast({
        title: "Sucesso",
        description: "Tabela de avaliações qualitativas criada com sucesso!",
        duration: 4000
      });
      return true;
    }
    
    // Outro tipo de erro
    console.error("Erro ao verificar tabela:", error);
    toast({
      title: "Aviso",
      description: "Verificação da tabela falhou. Funcionando em modo offline.",
      duration: 5000
    });
    return false;
  } catch (error) {
    console.error("Erro ao verificar/criar tabela de eventos qualificados:", error);
    toast({
      title: "Aviso",
      description: "Erro de conexão. Funcionando em modo offline.",
      duration: 5000
    });
    return false;
  }
}

// Função para salvar um evento qualificado no banco de dados
export const salvarEventoQualificado = async (evento: EventoQualificado): Promise<string | null> => {
  try {
    if (!evento.atleta_id || !evento.fundamento || !evento.tipo_evento) {
      console.error("Dados incompletos para salvar evento qualificado:", evento);
      throw new Error("Dados incompletos para salvar evento qualificado");
    }
    
    // Garante que o timestamp existe
    if (!evento.timestamp) {
      evento.timestamp = new Date().toISOString();
    }
    
    // Tenta salvar no Supabase
    const { data, error } = await supabase
      .from('avaliacoes_eventos_qualificados')
      .insert([evento])
      .select()
      .single();
    
    if (error) {
      console.error("Erro ao salvar evento qualificado:", error);
      
      // Salvar localmente como fallback com ID único
      const eventoLocal = {
        ...evento,
        id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      };
      
      salvarEventoQualificadoLocalStorage(eventoLocal);
      throw error;
    }
    
    console.log("Evento qualificado salvo com sucesso:", data);
    return data.id;
  } catch (erro) {
    console.error("Exceção ao salvar evento qualificado:", erro);
    toast({
      title: "Erro ao salvar evento",
      description: "O evento foi salvo localmente e será sincronizado quando possível.",
      variant: "destructive"
    });
    
    // Retorna null para indicar que não foi possível salvar no banco
    return null;
  }
};

// Função auxiliar para salvar eventos no localStorage (fallback)
export const salvarEventoQualificadoLocalStorage = (evento: EventoQualificado): void => {
  try {
    // Obter eventos existentes
    const eventosStr = localStorage.getItem('eventos_qualificados_offline');
    const eventos = eventosStr ? JSON.parse(eventosStr) : [];
    
    // Gerar um ID único com timestamp e string aleatória para evitar colisões
    const uniqueId = evento.id || `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Adicionar novo evento com timestamp atual se não existir
    eventos.push({
      ...evento,
      timestamp: evento.timestamp || new Date().toISOString(),
      id: uniqueId
    });
    
    // Salvar de volta no localStorage
    localStorage.setItem('eventos_qualificados_offline', JSON.stringify(eventos));
    console.log("Evento qualificado salvo no localStorage");
  } catch (erro) {
    console.error("Erro ao salvar evento no localStorage:", erro);
  }
};

// Função para buscar eventos qualificados com filtros
export async function buscarEventosQualificados(filtros?: FiltroEventosQualificados): Promise<EventoQualificado[]> {
  try {
    // Verificar se a tabela existe, mas não impedir a operação se falhar
    let tabelaExiste = false;
    try {
      tabelaExiste = await verificarECriarTabelaEventosQualificados();
    } catch (error) {
      console.error("Erro ao verificar tabela, continuando com armazenamento local:", error);
    }
    
    // Se a tabela existir e tivermos conexão, tentar buscar do Supabase
    if (tabelaExiste) {
      let query = supabase
        .from('avaliacoes_eventos_qualificados')
        .select('*');
      
      // Aplicar filtros se existirem
      if (filtros) {
        if (filtros.atleta_id) query = query.eq('atleta_id', filtros.atleta_id);
        if (filtros.data_inicio) query = query.gte('created_at', filtros.data_inicio);
        if (filtros.data_fim) query = query.lte('created_at', filtros.data_fim);
        if (filtros.fundamento) query = query.eq('fundamento', filtros.fundamento);
        if (filtros.tipo_evento) query = query.eq('tipo_evento', filtros.tipo_evento);
        if (filtros.treino_id) query = query.eq('treino_id', filtros.treino_id);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error("Erro ao buscar eventos do Supabase:", error);
        // Fallback para dados locais
        return obterEventosQualificadosLocalStorage(filtros);
      }
      
      // Se tudo correr bem, retornar dados do Supabase
      return data as EventoQualificado[];
    }
    
    // Se a tabela não existir, ou se houver problemas, usar dados locais
    return obterEventosQualificadosLocalStorage(filtros);
  } catch (error) {
    console.error("Erro ao buscar eventos qualificados:", error);
    // Em caso de erro, retornar dados do localStorage
    return obterEventosQualificadosLocalStorage(filtros);
  }
}

// Função para obter eventos qualificados do localStorage
export function obterEventosQualificadosLocalStorage(filtros?: FiltroEventosQualificados): EventoQualificado[] {
  try {
    const eventosStr = localStorage.getItem('eventos_qualificados_offline');
    let eventos: EventoQualificado[] = eventosStr ? JSON.parse(eventosStr) : [];
    
    // Aplicar filtros se fornecidos
    if (filtros) {
      if (filtros.atleta_id) {
        eventos = eventos.filter(e => e.atleta_id === filtros.atleta_id);
      }
      
      if (filtros.treino_id) {
        eventos = eventos.filter(e => e.treino_id === filtros.treino_id);
      }
      
      if (filtros.fundamento) {
        eventos = eventos.filter(e => e.fundamento === filtros.fundamento);
      }
      
      if (filtros.tipo_evento) {
        eventos = eventos.filter(e => e.tipo_evento === filtros.tipo_evento);
      }
      
      if (filtros.data_inicio) {
        eventos = eventos.filter(e => e.created_at && new Date(e.created_at) >= new Date(filtros.data_inicio));
      }
      
      if (filtros.data_fim) {
        eventos = eventos.filter(e => e.created_at && new Date(e.created_at) <= new Date(filtros.data_fim));
      }
    }
    
    // Ordenar por data de criação (mais recente primeiro)
    return eventos.sort((a, b) => {
      const dataA = new Date(a.created_at || "");
      const dataB = new Date(b.created_at || "");
      return dataB.getTime() - dataA.getTime();
    });
  } catch (erro) {
    console.error("Erro ao obter eventos do localStorage:", erro);
    return [];
  }
}

// Função para sincronizar eventos offline com o banco de dados
export const sincronizarEventosQualificados = async (): Promise<number> => {
  try {
    const eventosOffline = obterEventosQualificadosLocalStorage();
    
    if (eventosOffline.length === 0) {
      return 0;
    }
    
    let sincronizados = 0;
    
    for (const evento of eventosOffline) {
      // Remover propriedades locais
      const { id, ...eventoSemId } = evento;
      
      if (id?.startsWith('local_')) {
        // Tentar salvar no Supabase
        try {
          const { error } = await supabase
            .from('avaliacoes_eventos_qualificados')
            .insert([eventoSemId]);
          
          if (!error) {
            sincronizados++;
          }
        } catch (erroSalvar) {
          console.error("Erro ao sincronizar evento:", erroSalvar);
        }
      }
    }
    
    // Se algum evento foi sincronizado, atualizar localStorage
    if (sincronizados > 0) {
      const eventosFaltantes = eventosOffline.filter(e => 
        !e.id?.startsWith('local_') || 
        eventosOffline.indexOf(e) >= sincronizados
      );
      
      localStorage.setItem('eventos_qualificados_offline', JSON.stringify(eventosFaltantes));
    }
    
    return sincronizados;
  } catch (erro) {
    console.error("Erro ao sincronizar eventos offline:", erro);
    return 0;
  }
};

// Função para excluir um evento qualificado
export const excluirEventoQualificado = async (id: string): Promise<boolean> => {
  try {
    // Se for um ID local, remover do localStorage
    if (id.startsWith('local_')) {
      const eventosOffline = obterEventosQualificadosLocalStorage();
      const eventosAtualizados = eventosOffline.filter(e => e.id !== id);
      
      localStorage.setItem('eventos_qualificados_offline', JSON.stringify(eventosAtualizados));
      return true;
    }
    
    // Caso contrário, excluir do Supabase
    const { error } = await supabase
      .from('avaliacoes_eventos_qualificados')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error("Erro ao excluir evento qualificado:", error);
      return false;
    }
    
    return true;
  } catch (erro) {
    console.error("Exceção ao excluir evento qualificado:", erro);
    return false;
  }
};

// Função para calcular estatísticas de desempenho baseadas em eventos qualificados
export const calcularEstatisticasEventosQualificados = async (
  atletaId?: string,
  dataInicio?: string,
  dataFim?: string
): Promise<{ 
  totalEventos: number;
  pontuacaoTotal: number;
  mediaPorFundamento: { [fundamento: string]: number };
  eventosPositivos: number;
  eventosNegativos: number;
}> => {
  try {
    // Buscar eventos com os filtros fornecidos
    const eventos = await buscarEventosQualificados({
      atleta_id: atletaId,
      data_inicio: dataInicio,
      data_fim: dataFim
    });
    
    // Preparar objeto de resultado
    const resultado = {
      totalEventos: eventos.length,
      pontuacaoTotal: 0,
      mediaPorFundamento: {} as { [fundamento: string]: number },
      eventosPositivos: 0,
      eventosNegativos: 0
    };
    
    // Mapear eventos por fundamento para cálculo de médias
    const eventosPorFundamento: { [fundamento: string]: { total: number; soma: number } } = {};
    
    // Processar cada evento
    eventos.forEach(evento => {
      // Somar pontuação total
      resultado.pontuacaoTotal += evento.peso;
      
      // Contabilizar eventos positivos e negativos
      if (evento.peso > 0) {
        resultado.eventosPositivos++;
      } else if (evento.peso < 0) {
        resultado.eventosNegativos++;
      }
      
      // Agrupar por fundamento
      const fundamento = evento.fundamento;
      if (!eventosPorFundamento[fundamento]) {
        eventosPorFundamento[fundamento] = { total: 0, soma: 0 };
      }
      
      eventosPorFundamento[fundamento].total++;
      eventosPorFundamento[fundamento].soma += evento.peso;
    });
    
    // Calcular médias por fundamento
    Object.keys(eventosPorFundamento).forEach(fundamento => {
      const { total, soma } = eventosPorFundamento[fundamento];
      resultado.mediaPorFundamento[fundamento] = total > 0 ? soma / total : 0;
    });
    
    return resultado;
  } catch (erro) {
    console.error("Erro ao calcular estatísticas de eventos qualificados:", erro);
    return {
      totalEventos: 0,
      pontuacaoTotal: 0,
      mediaPorFundamento: {},
      eventosPositivos: 0,
      eventosNegativos: 0
    };
  }
}; 