import { supabase } from '@/lib/supabase';

export interface Meta {
  id: string;
  atleta_id: string;
  titulo: string;
  descricao: string;
  progresso: number;
  data_alvo: string;
  created_at: string;
  updated_at?: string;
  observacoes?: string;
  nome_atleta?: string; // Para exibição na lista
}

export interface MetaInput {
  atleta_id: string;
  titulo: string;
  descricao: string;
  progresso: number;
  data_alvo: string;
  observacoes?: string;
}

// Obter todas as metas com filtros opcionais
export async function getMetas({
  atletaId,
  status,
  time
}: {
  atletaId?: string;
  status?: 'concluido' | 'pendente' | 'atrasado';
  time?: 'masculino' | 'feminino';
} = {}) {
  try {
    // Verificar e criar tabela se necessário
    try {
      const tabelaVerificada = await verificarECriarTabelaMetas();
      if (!tabelaVerificada) {
        console.log('Não foi possível verificar/criar a tabela metas. Retornando lista vazia.');
        return [];
      }
    } catch (initError) {
      console.error('Erro ao inicializar tabelas:', initError);
      // Continuar e tentar a consulta de qualquer forma
    }

    // 1. Buscar as metas com filtros básicos
    let query = supabase
      .from('metas')
      .select('*');

    // Aplicar filtros
    if (atletaId) {
      query = query.eq('atleta_id', atletaId);
    }

    if (status === 'concluido') {
      query = query.eq('progresso', 100);
    } else if (status === 'pendente') {
      query = query.lt('progresso', 100);
      // Verificar se não está atrasado (data_alvo >= hoje)
      const hoje = new Date().toISOString().split('T')[0];
      query = query.gte('data_alvo', hoje);
    } else if (status === 'atrasado') {
      query = query.lt('progresso', 100);
      // Verificar se está atrasado (data_alvo < hoje)
      const hoje = new Date().toISOString().split('T')[0];
      query = query.lt('data_alvo', hoje);
    }

    const { data: metas, error } = await query;

    if (error) {
      console.error('Erro ao buscar metas:', error);
      throw error;
    }

    // Se não há metas ou não precisa filtrar por time, retornar resultado
    if (!metas || metas.length === 0 || !time) {
      // 2. Para cada meta, buscar os dados do atleta separadamente
      const metasComAtletas = await Promise.all(
        (metas || []).map(async (meta) => {
          // Buscar informações do atleta
          const { data: atleta, error: atletaError } = await supabase
            .from('athletes')
            .select('id, nome, time')
            .eq('id', meta.atleta_id)
            .single();

          if (atletaError && atletaError.code !== 'PGRST116') {
            console.error('Erro ao buscar atleta para meta:', atletaError);
          }

          return {
            ...meta,
            nome_atleta: atleta?.nome || 'Atleta Desconhecido'
          };
        })
      );

      return metasComAtletas;
    }

    // 3. Se precisa filtrar por time, buscar os atletas do time
    const { data: atletasDoTime, error: atletasError } = await supabase
      .from('athletes')
      .select('id')
      .eq('time', time);

    if (atletasError) {
      console.error('Erro ao buscar atletas por time:', atletasError);
      throw atletasError;
    }

    // Criar um conjunto de IDs de atletas do time para verificação rápida
    const idsAtletasDoTime = new Set(atletasDoTime?.map(a => a.id) || []);

    // Filtrar metas para incluir apenas as de atletas do time especificado
    const metasDoTime = metas.filter(meta => idsAtletasDoTime.has(meta.atleta_id));

    // Para cada meta filtrada, buscar os dados do atleta
    const metasComAtletas = await Promise.all(
      metasDoTime.map(async (meta) => {
        // Buscar informações do atleta
        const { data: atleta, error: atletaError } = await supabase
          .from('athletes')
          .select('id, nome, time')
          .eq('id', meta.atleta_id)
          .single();

        if (atletaError && atletaError.code !== 'PGRST116') {
          console.error('Erro ao buscar atleta para meta:', atletaError);
        }

        return {
          ...meta,
          nome_atleta: atleta?.nome || 'Atleta Desconhecido'
        };
      })
    );

    return metasComAtletas;
  } catch (error) {
    console.error('Erro ao buscar metas:', error);
    throw error;
  }
}

// Obter uma meta específica pelo ID
export async function getMetaById(id: string) {
  try {
    // Verificar e criar tabela se necessário
    try {
      const tabelaVerificada = await verificarECriarTabelaMetas();
      if (!tabelaVerificada) {
        console.log('Não foi possível verificar/criar a tabela metas. Retornando erro.');
        throw new Error('Tabela de metas não configurada');
      }
    } catch (initError) {
      console.error('Erro ao inicializar tabelas:', initError);
      // Continuar e tentar a consulta de qualquer forma
    }

    // 1. Buscar a meta pelo ID
    const { data, error } = await supabase
      .from('metas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar meta:', error);
      throw error;
    }

    if (!data) {
      throw new Error('Meta não encontrada');
    }

    // 2. Buscar dados do atleta separadamente
    const { data: atleta, error: atletaError } = await supabase
      .from('athletes')
      .select('id, nome, time')
      .eq('id', data.atleta_id)
      .single();

    if (atletaError && atletaError.code !== 'PGRST116') {
      console.error('Erro ao buscar informações do atleta:', atletaError);
    }

    // 3. Combinar os dados
    return {
      ...data,
      nome_atleta: atleta?.nome || 'Atleta Desconhecido'
    };
  } catch (error) {
    console.error('Erro ao buscar meta por ID:', error);
    throw error;
  }
}

// Function to send push notification for new goals
export async function sendNewGoalNotification(atletaId: string, title: string) {
  try {
    // Get subscriptions for this athlete
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('subscription_data')
      .eq('atleta_id', atletaId);

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return;
    }

    // If there are no subscriptions, we don't need to do anything
    if (!subscriptions || subscriptions.length === 0) {
      return;
    }

    // Get athlete name
    const { data: atleta } = await supabase
      .from('athletes')
      .select('nome')
      .eq('id', atletaId)
      .single();

    // In a real application, you'd call a serverless function here
    // that would handle the Web Push protocol
    console.log(`Would send notification to ${atleta?.nome || 'Atleta'} about new goal: ${title}`);

    // In this example, we'll just log the details
    // In a real application, you would make an API call to your server
    // which would handle sending the actual push notification
    
    return { success: true };
  } catch (error) {
    console.error('Error sending goal notification:', error);
    return { success: false };
  }
}

// Criar uma nova meta
export async function criarMeta(meta: MetaInput) {
  try {
    // Verificar e criar tabela se necessário
    try {
      const tabelaVerificada = await verificarECriarTabelaMetas();
      if (!tabelaVerificada) {
        console.log('Não foi possível verificar/criar a tabela metas. Retornando erro.');
        throw new Error('Tabela de metas não configurada');
      }
    } catch (initError) {
      console.error('Erro ao inicializar tabelas:', initError);
      // Continuar e tentar a inserção de qualquer forma
    }

    // Validar dados
    if (meta.progresso < 0 || meta.progresso > 100) {
      throw new Error('O progresso deve estar entre 0 e 100');
    }

    const dataAlvo = new Date(meta.data_alvo);
    const hoje = new Date();
    if (dataAlvo < hoje) {
      throw new Error('A data alvo não pode ser anterior à data atual');
    }

    const { data, error } = await supabase
      .from('metas')
      .insert([{
        atleta_id: meta.atleta_id,
        titulo: meta.titulo,
        descricao: meta.descricao,
        progresso: meta.progresso,
        data_alvo: meta.data_alvo,
        observacoes: meta.observacoes || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar meta:', error);
      throw error;
    }

    // Send push notification for the new goal
    try {
      await sendNewGoalNotification(meta.atleta_id, meta.titulo);
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError);
      // Continue with the function even if notification fails
    }

    return data;
  } catch (error) {
    console.error('Erro ao criar meta:', error);
    throw error;
  }
}

// Atualizar uma meta existente
export async function atualizarMeta(id: string, meta: Partial<MetaInput>) {
  try {
    // Validar dados
    if (meta.progresso !== undefined && (meta.progresso < 0 || meta.progresso > 100)) {
      throw new Error('O progresso deve estar entre 0 e 100');
    }

    if (meta.data_alvo) {
      const dataAlvo = new Date(meta.data_alvo);
      const hoje = new Date();
      if (dataAlvo < hoje) {
        throw new Error('A data alvo não pode ser anterior à data atual');
      }
    }

    const { data, error } = await supabase
      .from('metas')
      .update({
        ...meta,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar meta:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erro ao atualizar meta:', error);
    throw error;
  }
}

// Excluir uma meta
export async function excluirMeta(id: string) {
  try {
    const { error } = await supabase
      .from('metas')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir meta:', error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao excluir meta:', error);
    throw error;
  }
}

// Obter o histórico de progresso de uma meta
export async function getHistoricoProgresso(metaId: string) {
  try {
    const { data, error } = await supabase
      .from('historico_metas')
      .select('*')
      .eq('meta_id', metaId)
      .order('created_at', { ascending: true });

    if (error) {
      // Se a tabela não existir, retornar array vazio
      if (error.code === '42P01') {
        return [];
      }
      console.error('Erro ao buscar histórico de progresso:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar histórico de progresso:', error);
    throw error;
  }
}

// Registrar uma atualização no progresso da meta
export async function registrarProgressoMeta(metaId: string, progresso: number, observacao?: string) {
  try {
    // Validar progresso
    if (progresso < 0 || progresso > 100) {
      throw new Error('O progresso deve estar entre 0 e 100');
    }

    // 1. Buscar a meta atual
    const { data: metaAtual, error: metaError } = await supabase
      .from('metas')
      .select('*')
      .eq('id', metaId)
      .single();

    if (metaError) {
      console.error('Erro ao buscar meta para atualizar progresso:', metaError);
      throw metaError;
    }

    // 2. Atualizar o progresso da meta
    const { error: updateError } = await supabase
      .from('metas')
      .update({
        progresso: progresso,
        updated_at: new Date().toISOString(),
        observacoes: observacao || metaAtual.observacoes
      })
      .eq('id', metaId);

    if (updateError) {
      console.error('Erro ao atualizar progresso da meta:', updateError);
      throw updateError;
    }

    // 3. Registrar no histórico (se a tabela existir)
    try {
      await supabase
        .from('historico_metas')
        .insert([{
          meta_id: metaId,
          progresso: progresso,
          observacao: observacao || '',
          created_at: new Date().toISOString()
        }]);
    } catch (historicoError) {
      // Se a tabela não existir, apenas ignorar
      console.log('Tabela de histórico não existe ou erro ao registrar:', historicoError);
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao registrar progresso da meta:', error);
    throw error;
  }
}

// Função para verificar e criar as tabelas necessárias
export async function verificarECriarTabelaMetas() {
  try {
    // Verificar se a tabela metas existe
    const { error: checkError } = await supabase
      .from('metas')
      .select('id')
      .limit(1);

    if (checkError && checkError.code === '42P01') {
      console.log('Tabela metas não existe. Criando...');
      
      // Criar tabela metas
      const { error: createError } = await supabase.rpc('create_metas_table');
      
      if (createError) {
        console.error('Erro ao criar tabela metas:', createError);
        
        // Tentar criar tabela usando SQL direto
        const { error: sqlError } = await supabase.rpc('execute_sql', {
          sql_query: `
            CREATE TABLE IF NOT EXISTS public.metas (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              atleta_id UUID NOT NULL,
              titulo TEXT NOT NULL,
              descricao TEXT,
              progresso INTEGER DEFAULT 0,
              data_alvo DATE NOT NULL,
              observacoes TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `
        });
        
        if (sqlError) {
          console.error('Falha ao criar tabela metas via SQL:', sqlError);
          return false;
        }
      }
      
      // Criar tabela historico_metas
      const { error: histError } = await supabase.rpc('execute_sql', {
        sql_query: `
          CREATE TABLE IF NOT EXISTS public.historico_metas (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            meta_id UUID NOT NULL,
            progresso INTEGER NOT NULL,
            observacao TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      
      if (histError) {
        console.error('Erro ao criar tabela historico_metas:', histError);
      }
      
      console.log('Tabelas criadas com sucesso.');
      return true;
    }
    
    return true; // A tabela já existe
  } catch (error) {
    console.error('Erro ao verificar/criar tabelas:', error);
    return false;
  }
}
