import { supabase } from "@/lib/supabase";

// Função para sincronizar avaliações salvas localmente com o banco de dados
export async function syncLocalStorageWithDatabase(): Promise<void> {
  try {
    console.log("Iniciando sincronização de dados locais com o banco de dados");
    
    // Verificar se o usuário está autenticado
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log("Usuário não autenticado, sincronização cancelada");
      return;
    }
    
    // Sincronizar avaliações de fundamento
    await syncAvaliacoesFundamento();
    
    // Sincronizar avaliações de exercícios (formato de performance)
    await syncAvaliacoesExercicios();
    
    console.log("Sincronização concluída com sucesso");
  } catch (error) {
    console.error("Erro durante a sincronização:", error);
  }
}

// Sincroniza avaliações da tabela avaliacoes_fundamento
async function syncAvaliacoesFundamento(): Promise<void> {
  try {
    // Buscar avaliações do localStorage
    const avaliacoes = JSON.parse(localStorage.getItem('avaliacoes_fundamento') || '[]');
    
    if (avaliacoes.length === 0) {
      console.log("Nenhuma avaliação local para sincronizar (avaliacoes_fundamento)");
      return;
    }
    
    console.log(`Encontradas ${avaliacoes.length} avaliações locais para sincronizar (avaliacoes_fundamento)`);
    
    // Tentar sincronizar cada avaliação
    const successfulIds: string[] = [];
    
    for (const avaliacao of avaliacoes) {
      try {
        // Verificar se a avaliação já existe no banco
        const { data: existingEval, error: checkError } = await supabase
          .from('avaliacoes_fundamento')
          .select('id')
          .eq('treino_id', avaliacao.treino_id)
          .eq('exercicio_id', avaliacao.exercicio_id)
          .eq('atleta_id', avaliacao.atleta_id)
          .eq('fundamento', avaliacao.fundamento);
          
        if (checkError) {
          console.warn('Erro ao verificar avaliação existente:', checkError);
          continue;
        }
        
        let result;
        
        if (existingEval && existingEval.length > 0) {
          // Atualizar avaliação existente
          result = await supabase
            .from('avaliacoes_fundamento')
            .update({
              acertos: avaliacao.acertos,
              erros: avaliacao.erros
            })
            .eq('id', existingEval[0].id);
        } else {
          // Criar nova avaliação
          // Remover o ID local para que o banco gere um novo ID
          const { id, ...avaliacaoData } = avaliacao;
          
          result = await supabase
            .from('avaliacoes_fundamento')
            .insert([avaliacaoData]);
        }
        
        if (!result.error) {
          successfulIds.push(avaliacao.id);
          console.log(`Avaliação ${avaliacao.id} sincronizada com sucesso`);
        } else {
          console.warn(`Erro ao sincronizar avaliação ${avaliacao.id}:`, result.error);
        }
      } catch (error) {
        console.error(`Erro ao processar avaliação ${avaliacao.id}:`, error);
      }
    }
    
    // Remover avaliações sincronizadas com sucesso do localStorage
    if (successfulIds.length > 0) {
      const remainingAvaliacoes = avaliacoes.filter((a: any) => !successfulIds.includes(a.id));
      localStorage.setItem('avaliacoes_fundamento', JSON.stringify(remainingAvaliacoes));
      console.log(`${successfulIds.length} avaliações removidas do localStorage após sincronização`);
    }
  } catch (error) {
    console.error('Erro ao sincronizar avaliacoes_fundamento:', error);
  }
}

// Sincroniza avaliações da tabela avaliacoes_exercicios
async function syncAvaliacoesExercicios(): Promise<void> {
  try {
    // Buscar avaliações do localStorage
    const avaliacoes = JSON.parse(localStorage.getItem('avaliacoes_exercicios') || '[]');
    
    if (avaliacoes.length === 0) {
      console.log("Nenhuma avaliação local para sincronizar (avaliacoes_exercicios)");
      return;
    }
    
    console.log(`Encontradas ${avaliacoes.length} avaliações locais para sincronizar (avaliacoes_exercicios)`);
    
    // Tentar sincronizar cada avaliação
    const successfulIds: string[] = [];
    
    for (const avaliacao of avaliacoes) {
      try {
        // Verificar se a avaliação já existe no banco
        const { data: existingEval, error: checkError } = await supabase
          .from('avaliacoes_exercicios')
          .select('id')
          .eq('treino_id', avaliacao.treino_id)
          .eq('exercicio_id', avaliacao.exercicio_id)
          .eq('atleta_id', avaliacao.atleta_id)
          .eq('fundamento', avaliacao.fundamento);
          
        if (checkError) {
          console.warn('Erro ao verificar avaliação existente:', checkError);
          continue;
        }
        
        let result;
        
        if (existingEval && existingEval.length > 0) {
          // Atualizar avaliação existente
          result = await supabase
            .from('avaliacoes_exercicios')
            .update({
              acertos: avaliacao.acertos,
              erros: avaliacao.erros,
              timestamp: avaliacao.timestamp || new Date().toISOString()
            })
            .eq('id', existingEval[0].id);
        } else {
          // Criar nova avaliação
          // Remover o ID local para que o banco gere um novo ID
          const { id, ...avaliacaoData } = avaliacao;
          
          // Garantir que há um timestamp
          if (!avaliacaoData.timestamp) {
            avaliacaoData.timestamp = new Date().toISOString();
          }
          
          result = await supabase
            .from('avaliacoes_exercicios')
            .insert([avaliacaoData]);
        }
        
        if (!result.error) {
          successfulIds.push(avaliacao.id);
          console.log(`Avaliação ${avaliacao.id} sincronizada com sucesso`);
        } else {
          console.warn(`Erro ao sincronizar avaliação ${avaliacao.id}:`, result.error);
        }
      } catch (error) {
        console.error(`Erro ao processar avaliação ${avaliacao.id}:`, error);
      }
    }
    
    // Remover avaliações sincronizadas com sucesso do localStorage
    if (successfulIds.length > 0) {
      const remainingAvaliacoes = avaliacoes.filter((a: any) => !successfulIds.includes(a.id));
      localStorage.setItem('avaliacoes_exercicios', JSON.stringify(remainingAvaliacoes));
      console.log(`${successfulIds.length} avaliações removidas do localStorage após sincronização`);
    }
  } catch (error) {
    console.error('Erro ao sincronizar avaliacoes_exercicios:', error);
  }
} 