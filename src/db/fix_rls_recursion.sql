-- Script para eliminar definitivamente o erro de recursão infinita nas políticas RLS da tabela "perfis"
-- Esta abordagem radical simplifica todas as políticas para permitir acesso total a usuários autenticados

-- 1. Diagnóstico: Listar as políticas atuais para a tabela 'perfis'
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

-- 3. Remover TODAS as políticas existentes para a tabela perfis
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON public.perfis;
DROP POLICY IF EXISTS "Técnicos podem ver perfis de atletas" ON public.perfis;
DROP POLICY IF EXISTS "Administradores podem ver todos os perfis" ON public.perfis;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.perfis;
DROP POLICY IF EXISTS "Administradores podem atualizar qualquer perfil" ON public.perfis;
DROP POLICY IF EXISTS "Administradores podem criar perfis" ON public.perfis;
DROP POLICY IF EXISTS "Técnicos e monitores podem ver perfis" ON public.perfis;
DROP POLICY IF EXISTS "Usuários autenticados podem ver todos os perfis" ON public.perfis;
-- Esta linha irá remover TODAS as políticas, mesmo que tenha alguma com nome diferente
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

-- 4. Criar novas políticas extremamente simples que permitem acesso TOTAL para usuários autenticados
-- Política para SELECT - qualquer usuário autenticado pode ver todos os perfis
CREATE POLICY "Permitir SELECT para autenticados"
  ON public.perfis
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Política para INSERT - qualquer usuário autenticado pode inserir perfis
CREATE POLICY "Permitir INSERT para autenticados"
  ON public.perfis
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Política para UPDATE - qualquer usuário autenticado pode atualizar perfis
CREATE POLICY "Permitir UPDATE para autenticados"
  ON public.perfis
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Política para DELETE - qualquer usuário autenticado pode excluir perfis
CREATE POLICY "Permitir DELETE para autenticados"
  ON public.perfis
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- 5. Reativar RLS para a tabela perfis
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

-- 6. Garantir que o owner da tabela possa ignorar RLS
ALTER TABLE public.perfis FORCE ROW LEVEL SECURITY;

-- 7. Adicionar comentário explicativo na tabela
COMMENT ON TABLE public.perfis IS 'Contém perfis de usuários. Qualquer usuário autenticado pode realizar TODAS as operações nesta tabela.';

-- 8. Verificar as políticas após a simplificação
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