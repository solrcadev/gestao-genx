
-- Script para simplificar as políticas RLS da tabela "perfis"
-- Esta alteração permite que qualquer usuário autenticado possa visualizar os dados, sem verificação de perfis

-- Primeiro, listar as políticas atuais para a tabela 'perfis'
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

-- Desativar temporariamente o RLS para a tabela perfis
ALTER TABLE public.perfis DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes para a tabela perfis
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON public.perfis;
DROP POLICY IF EXISTS "Técnicos podem ver perfis de atletas" ON public.perfis;
DROP POLICY IF EXISTS "Administradores podem ver todos os perfis" ON public.perfis;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.perfis;
DROP POLICY IF EXISTS "Administradores podem atualizar qualquer perfil" ON public.perfis;
DROP POLICY IF EXISTS "Administradores podem criar perfis" ON public.perfis;
DROP POLICY IF EXISTS "Técnicos e monitores podem ver perfis" ON public.perfis;

-- Criar políticas simplificadas que permitem acesso para qualquer usuário autenticado
-- Política para visualização - qualquer usuário autenticado pode visualizar todos os perfis
CREATE POLICY "Usuários autenticados podem ver todos os perfis"
  ON public.perfis
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Política para usuários atualizarem seu próprio perfil (mantida para segurança)
CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.perfis
  FOR UPDATE
  USING (auth.uid()::text = user_id::text);

-- Política para administradores atualizarem qualquer perfil (mantida para segurança)
CREATE POLICY "Administradores podem atualizar qualquer perfil"
  ON public.perfis
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.perfis p
      WHERE p.user_id = auth.uid() AND p.funcao = 'admin'
    )
  );

-- Política para administradores criarem perfis (mantida para segurança)
CREATE POLICY "Administradores podem criar perfis"
  ON public.perfis
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.perfis p
      WHERE p.user_id = auth.uid() AND p.funcao = 'admin'
    )
  );

-- Reativar RLS para a tabela perfis
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

-- Garantir que o owner da tabela possa ignorar RLS
ALTER TABLE public.perfis FORCE ROW LEVEL SECURITY;

-- Adicionar comentário explicativo na tabela
COMMENT ON TABLE public.perfis IS 'Contém perfis de usuários. Qualquer usuário autenticado pode visualizar todos os perfis.';

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
WHERE tablename = 'perfis';
