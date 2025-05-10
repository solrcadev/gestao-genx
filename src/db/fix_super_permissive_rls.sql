-- Script para tornar as políticas RLS da tabela "perfis" totalmente permissivas
-- Este é um script de diagnóstico para identificar se o problema de inicialização
-- está relacionado às políticas RLS da tabela perfis

-- 1. Verificar políticas atuais
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
WHERE tablename = 'perfis';

-- 2. Desativar temporariamente o RLS para a tabela perfis
ALTER TABLE public.perfis DISABLE ROW LEVEL SECURITY;

-- 3. Remover todas as políticas existentes para a tabela perfis
DO $$
DECLARE 
  policy_rec RECORD;
BEGIN
  FOR policy_rec IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'perfis' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.perfis', policy_rec.policyname);
  END LOOP;
END $$;

-- 4. Criar novas políticas SUPER permissivas que permitam acesso TOTAL para QUALQUER um
-- Política para SELECT - qualquer um pode ver todos os perfis
CREATE POLICY "Permitir SELECT para todos"
  ON public.perfis
  FOR SELECT
  USING (true);

-- Política para INSERT - qualquer um pode inserir perfis
CREATE POLICY "Permitir INSERT para todos"
  ON public.perfis
  FOR INSERT
  WITH CHECK (true);

-- Política para UPDATE - qualquer um pode atualizar perfis
CREATE POLICY "Permitir UPDATE para todos"
  ON public.perfis
  FOR UPDATE
  USING (true);

-- Política para DELETE - qualquer um pode excluir perfis
CREATE POLICY "Permitir DELETE para todos"
  ON public.perfis
  FOR DELETE
  USING (true);

-- 5. Reativar RLS para a tabela perfis
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

-- 6. Adicionar comentário explicativo na tabela
COMMENT ON TABLE public.perfis IS 'TEMPORARIAMENTE PERMISSIVO - DIAGNÓSTICO: Contém perfis de usuários. QUALQUER UM pode realizar TODAS as operações nesta tabela.';

-- 7. Verificar as políticas após a simplificação
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
WHERE tablename = 'perfis'; 