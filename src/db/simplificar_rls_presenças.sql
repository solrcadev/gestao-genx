-- Script para simplificar as políticas RLS da tabela "treinos_presencas"
-- Esta alteração permite que qualquer usuário autenticado possa visualizar os dados de presença

-- Primeiro, listar as políticas atuais para a tabela 'treinos_presencas'
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'treinos_presencas';

-- Desativar temporariamente o RLS para a tabela treinos_presencas
ALTER TABLE public.treinos_presencas DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes para a tabela treinos_presencas
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'treinos_presencas' AND schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.treinos_presencas', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- Criar política simplificada que permite acesso para qualquer usuário autenticado
-- Política para visualização - qualquer usuário autenticado pode visualizar todas as presenças
CREATE POLICY "Usuários autenticados podem ver todas as presenças"
  ON public.treinos_presencas
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Política para inserção - qualquer usuário autenticado pode registrar presenças
CREATE POLICY "Usuários autenticados podem registrar presenças"
  ON public.treinos_presencas
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Política para atualização - qualquer usuário autenticado pode atualizar presenças
CREATE POLICY "Usuários autenticados podem atualizar presenças"
  ON public.treinos_presencas
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Política para exclusão - qualquer usuário autenticado pode excluir presenças
CREATE POLICY "Usuários autenticados podem excluir presenças"
  ON public.treinos_presencas
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Reativar RLS para a tabela treinos_presencas
ALTER TABLE public.treinos_presencas ENABLE ROW LEVEL SECURITY;

-- Garantir que o owner da tabela possa ignorar RLS
ALTER TABLE public.treinos_presencas FORCE ROW LEVEL SECURITY;

-- Adicionar comentário explicativo na tabela
COMMENT ON TABLE public.treinos_presencas IS 'Contém registros de presença de atletas nos treinos. Qualquer usuário autenticado pode visualizar, inserir, atualizar e excluir registros.';

-- Verificar as políticas após a simplificação
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'treinos_presencas'; 