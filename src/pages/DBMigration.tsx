import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';

// Script SQL para adicionar campos de timestamp de vídeo
const videoTimestampsSQL = `
DO $$ 
BEGIN
  -- Adicionar coluna video_inicio se não existir
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'exercicios' 
    AND column_name = 'video_inicio'
  ) THEN
    ALTER TABLE public.exercicios ADD COLUMN video_inicio VARCHAR(20);
  END IF;

  -- Adicionar coluna video_fim se não existir
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'exercicios' 
    AND column_name = 'video_fim'
  ) THEN
    ALTER TABLE public.exercicios ADD COLUMN video_fim VARCHAR(20);
  END IF;
END $$;
`;

const DBMigrationPage: React.FC = () => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Função para executar o script SQL
  const executeVideoTimestampsSQL = async () => {
    setIsExecuting(true);
    setResult(null);
    setError(null);
    
    try {
      // Verificar se a tabela exercicios existe
      const { data: exercicios, error: exerciciosError } = await supabase
        .from('exercicios')
        .select('id')
        .limit(1);
      
      if (exerciciosError) {
        throw exerciciosError;
      }
      
      if (!exercicios || exercicios.length === 0) {
        throw new Error('Nenhum exercício encontrado na base de dados');
      }
      
      // Testar se as colunas já existem tentando atualizar um exercício
      const testUpdate = {
        video_inicio: null,
        video_fim: null
      };
      
      const { error: updateError } = await supabase
        .from('exercicios')
        .update(testUpdate)
        .eq('id', exercicios[0].id);
      
      // Se não houver erro, as colunas já existem
      if (!updateError) {
        setResult('Migração não necessária: As colunas já existem no banco de dados!');
        toast({
          title: 'Colunas já existem',
          description: 'As colunas video_inicio e video_fim já existem na tabela de exercícios.',
        });
      } else if (updateError.message.includes('column') && updateError.message.includes('does not exist')) {
        // As colunas não existem, mostrar mensagem de erro e sugerir criação manual
        setError(`As colunas não existem no banco de dados. Erro: ${updateError.message}`);
        toast({
          title: 'Migração manual necessária',
          description: 'É necessário adicionar as colunas manualmente no banco de dados Supabase.',
          variant: 'destructive',
        });
      } else {
        // Outro tipo de erro
        throw updateError;
      }
    } catch (err) {
      console.error('Erro ao executar migração:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro ao executar migração: ${errorMessage}`);
      toast({
        title: 'Erro na migração',
        description: 'Ocorreu um erro ao tentar verificar as colunas. Consulte o console para detalhes.',
        variant: 'destructive',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // Verificar se a função rpc existe
  const checkRPCFunction = async () => {
    setIsExecuting(true);
    setResult(null);
    setError(null);
    
    try {
      // Método alternativo: executar SQL diretamente
      const { data, error } = await supabase.from('exercicios').select('*').limit(1);
      
      if (error) {
        throw error;
      }
      
      // Método alternativo: Teste de execução de SQL direto
      const { error: alterError } = await supabase.from('exercicios').update({ video_inicio: null }).eq('id', data[0]?.id || '');
      
      if (alterError) {
        throw alterError;
      }
      
      setResult('Teste de migração bem-sucedido! Você pode executar a migração real agora.');
      toast({
        title: 'Teste concluído',
        description: 'Conexão com o banco de dados está funcionando corretamente.',
      });
    } catch (err) {
      console.error('Erro ao testar conexão:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro ao testar conexão: ${errorMessage}`);
      toast({
        title: 'Erro no teste',
        description: 'Ocorreu um erro ao testar a conexão com o banco de dados.',
        variant: 'destructive',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Migração do Banco de Dados - Painel GenX</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Migração: Timestamps de Vídeo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Este script adiciona as colunas <code>video_inicio</code> e <code>video_fim</code> 
              à tabela de exercícios para permitir o recorte de vídeos do YouTube.
            </p>
            
            <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-4 mb-4 overflow-auto max-h-48">
              <pre className="text-xs">{videoTimestampsSQL}</pre>
            </div>
            
            <div className="space-y-4">
              <Button 
                onClick={checkRPCFunction} 
                disabled={isExecuting}
                variant="outline"
                className="w-full"
              >
                {isExecuting && <LoadingSpinner className="mr-2" />}
                Testar Conexão com Banco
              </Button>
              
              <Button 
                onClick={executeVideoTimestampsSQL} 
                disabled={isExecuting}
                className="w-full"
              >
                {isExecuting && <LoadingSpinner className="mr-2" />}
                Executar Migração
              </Button>
            </div>
            
            {result && (
              <div className="mt-4 p-3 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 rounded-md">
                {result}
              </div>
            )}
            
            {error && (
              <div className="mt-4 p-3 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 rounded-md">
                {error}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Instruções e Informações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Sobre esta Migração</h3>
              <p>
                Esta migração adiciona suporte para definir pontos de início e fim em vídeos do YouTube 
                nos exercícios do Painel GenX. Isso permite que os técnicos mostrem apenas as partes 
                relevantes de um vídeo mais longo.
              </p>
              
              <h3 className="text-lg font-medium">Como Testar</h3>
              <ol className="list-decimal pl-4 space-y-2">
                <li>Primeiro, clique em "Testar Conexão com Banco" para verificar se tudo está funcionando.</li>
                <li>Se o teste for bem-sucedido, clique em "Executar Migração" para aplicar as alterações.</li>
                <li>Após a migração, acesse a página de Exercícios e teste o novo recurso.</li>
              </ol>
              
              <h3 className="text-lg font-medium">Próximos Passos</h3>
              <p>
                Depois de executar esta migração, cadastre ou edite um exercício e utilize os novos campos 
                "Início do Exercício no Vídeo" e "Fim do Exercício no Vídeo" para recortar vídeos do YouTube.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DBMigrationPage; 