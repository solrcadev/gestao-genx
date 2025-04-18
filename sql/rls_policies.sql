/*
Este script SQL configura políticas de segurança em nível de linha (RLS) para a tabela avaliacoes_exercicios.
Para usar este script:

1. Acesse o dashboard do Supabase para seu projeto
2. Vá para a seção "SQL Editor"
3. Cole o conteúdo deste arquivo
4. Execute o script

O script configura:
- Habilitação do RLS para a tabela avaliacoes_exercicios
- Verifica a estrutura atual da tabela
- Cria políticas para permitir que usuários autenticados possam:
  * Inserir novas avaliações
  * Selecionar suas próprias avaliações
  * Atualizar suas próprias avaliações
  * Excluir suas próprias avaliações
- Verifica as políticas após a criação

Note: Caso as políticas já existam, remova-as primeiro usando:
DROP POLICY "nome_da_politica" ON public.avaliacoes_exercicios;
*/

-- Habilitar RLS na tabela avaliacoes_exercicios, caso não esteja habilitado
ALTER TABLE public.avaliacoes_exercicios ENABLE ROW LEVEL SECURITY;

-- Verificar a estrutura da tabela
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'avaliacoes_exercicios';

-- Criar política para permitir usuários autenticados inserir dados
CREATE POLICY "Usuarios autenticados podem inserir avaliacoes" 
ON public.avaliacoes_exercicios 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Criar política para usuários autenticados poderem selecionar suas próprias avaliações
CREATE POLICY "Usuarios autenticados podem selecionar suas avaliacoes" 
ON public.avaliacoes_exercicios 
FOR SELECT 
TO authenticated 
USING ((SELECT auth.uid()) = atleta_id);

-- Criar política para usuários autenticados poderem atualizar suas próprias avaliações
CREATE POLICY "Usuarios autenticados podem atualizar suas avaliacoes" 
ON public.avaliacoes_exercicios 
FOR UPDATE 
TO authenticated 
USING ((SELECT auth.uid()) = atleta_id) 
WITH CHECK ((SELECT auth.uid()) = atleta_id);

-- Criar política para usuários autenticados poderem excluir suas próprias avaliações
CREATE POLICY "Usuarios autenticados podem excluir suas avaliacoes" 
ON public.avaliacoes_exercicios 
FOR DELETE 
TO authenticated 
USING ((SELECT auth.uid()) = atleta_id);

-- Verificar as políticas existentes
SELECT *
FROM pg_policies
WHERE tablename = 'avaliacoes_exercicios'; 