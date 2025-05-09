
-- Script alternativo para corrigir o problema de recursão infinita nas políticas RLS da tabela "perfis"
-- Esta abordagem usa uma função auxiliar para determinar o papel do usuário sem consultar novamente a tabela 'perfis'

-- Criar ou substituir função auxiliar para verificar o papel do usuário sem recursão
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Usando conexão direta à tabela perfis sem passar pela política RLS
    -- Esta função será marcada como SECURITY DEFINER para ignorar as políticas RLS
    SELECT funcao INTO user_role
    FROM public.perfis
    WHERE user_id = auth.uid()
    LIMIT 1;
    
    RETURN COALESCE(user_role, 'sem_perfil');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Desabilitar temporariamente RLS
ALTER TABLE public.perfis DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON public.perfis;
DROP POLICY IF EXISTS "Técnicos podem ver perfis de atletas" ON public.perfis;
DROP POLICY IF EXISTS "Administradores podem ver todos os perfis" ON public.perfis;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.perfis;
DROP POLICY IF EXISTS "Administradores podem atualizar qualquer perfil" ON public.perfis;
DROP POLICY IF EXISTS "Administradores podem criar perfis" ON public.perfis;

-- Criar novas políticas usando a função auxiliar
-- Política para visualização de todos os perfis por administradores
CREATE POLICY "Administradores podem ver todos os perfis"
ON public.perfis
FOR SELECT
USING (public.get_user_role() = 'admin');

-- Política para visualização de perfis por técnicos e monitores
CREATE POLICY "Técnicos e monitores podem ver perfis"
ON public.perfis
FOR SELECT
USING (public.get_user_role() IN ('tecnico', 'monitor'));

-- Política para visualização do próprio perfil
CREATE POLICY "Usuários podem ver seu próprio perfil"
ON public.perfis
FOR SELECT
USING (auth.uid()::text = user_id::text);

-- Política para atualização do próprio perfil
CREATE POLICY "Usuários podem atualizar seu próprio perfil"
ON public.perfis
FOR UPDATE
USING (auth.uid()::text = user_id::text);

-- Política para administradores atualizarem qualquer perfil
CREATE POLICY "Administradores podem atualizar qualquer perfil"
ON public.perfis
FOR UPDATE
USING (public.get_user_role() = 'admin');

-- Política para administradores criarem perfis
CREATE POLICY "Administradores podem criar perfis"
ON public.perfis
FOR INSERT
WITH CHECK (public.get_user_role() = 'admin');

-- Reativar RLS
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

-- Garantir que o owner da tabela possa ignorar RLS
ALTER TABLE public.perfis FORCE ROW LEVEL SECURITY;

-- Comentários explicativos para futura referência
COMMENT ON FUNCTION public.get_user_role() IS 'Função para obter o papel do usuário atual sem passar por políticas RLS, evitando recursão infinita.';
COMMENT ON TABLE public.perfis IS 'Contém perfis de usuários, incluindo seus papéis no sistema (tecnico, monitor, atleta, admin). Esta tabela usa políticas RLS otimizadas para evitar recursão.';

-- Verificar as políticas após a correção
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
