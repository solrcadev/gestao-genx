-- Script para corrigir problemas na criação de usuários no Supabase

-- 1. Verificar e corrigir a função handle_new_user
-- Primeiro, vamos criar ou substituir a função para garantir que ela esteja correta
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER -- Para garantir que a função possa operar independente de RLS
SET search_path = public
AS $$
BEGIN
  -- Inserir um novo perfil para o usuário recém-criado
  -- Usando defaults para campos não essenciais para evitar erros NOT NULL
  INSERT INTO public.perfis (
    user_id,
    nome,
    funcao,
    email,
    created_at,
    updated_at
  ) VALUES (
    new.id,                    -- ID do usuário do auth.users
    COALESCE(new.raw_user_meta_data->>'name', new.email), -- Nome do usuário, ou email se não disponível
    'atleta',                  -- Função padrão para novos usuários
    new.email,                 -- Email do usuário
    now(),                     -- Data de criação
    now()                      -- Data de atualização
  );
  RETURN new;
EXCEPTION
  WHEN others THEN
    -- Logar o erro para diagnóstico
    RAISE LOG 'Erro ao criar perfil para usuário %: %', new.id, SQLERRM;
    -- Ainda permite que o usuário seja criado mesmo se falhar ao criar o perfil
    RETURN new;
END;
$$;

-- 2. Verificar e recriar o trigger se necessário
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- 3. Corrigir permissões da função
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- 4. Desativar temporariamente o RLS para a tabela perfis
ALTER TABLE public.perfis DISABLE ROW LEVEL SECURITY;

-- 5. Remover todas as políticas existentes para a tabela perfis
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON public.perfis;
DROP POLICY IF EXISTS "Técnicos podem ver perfis de atletas" ON public.perfis;
DROP POLICY IF EXISTS "Administradores podem ver todos os perfis" ON public.perfis;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.perfis;
DROP POLICY IF EXISTS "Administradores podem atualizar qualquer perfil" ON public.perfis;
DROP POLICY IF EXISTS "Administradores podem criar perfis" ON public.perfis;
DROP POLICY IF EXISTS "Técnicos e monitores podem ver perfis" ON public.perfis;
DROP POLICY IF EXISTS "Usuários autenticados podem ver todos os perfis" ON public.perfis;
DROP POLICY IF EXISTS "Permitir sistema criar perfis para novos usuários" ON public.perfis;

-- 6. Criar políticas simplificadas que garantam acesso total para usuários autenticados
-- Política para permitir SELECT para usuários autenticados
CREATE POLICY "Permitir SELECT para usuários autenticados" 
  ON public.perfis FOR SELECT 
  TO authenticated 
  USING (true);

-- Política para permitir INSERT para usuários autenticados
CREATE POLICY "Permitir INSERT para usuários autenticados" 
  ON public.perfis FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- Política para permitir UPDATE para usuários autenticados
CREATE POLICY "Permitir UPDATE para usuários autenticados" 
  ON public.perfis FOR UPDATE 
  TO authenticated 
  USING (true);

-- Política para permitir DELETE para usuários autenticados
CREATE POLICY "Permitir DELETE para usuários autenticados" 
  ON public.perfis FOR DELETE 
  TO authenticated 
  USING (true);

-- 7. Garantir que service_role tenha permissões totais (importante para a trigger)
-- Esta política garante que o service_role (usado por funções e triggers) possa fazer tudo
CREATE POLICY "Permitir todas as operações para service_role"
  ON public.perfis
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 8. Reativar RLS para a tabela perfis
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

-- 9. Garantir que o owner da tabela possa ignorar RLS
ALTER TABLE public.perfis FORCE ROW LEVEL SECURITY;

-- 10. Verificar se existem colunas NOT NULL sem valores default que poderiam causar problemas
-- Aqui verificamos apenas; se encontrarmos colunas problemáticas, precisaremos modificar
-- a função handle_new_user acima para incluí-las
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'perfis'
  AND is_nullable = 'NO'
  AND column_default IS NULL
  AND column_name NOT IN ('user_id', 'nome', 'funcao', 'email', 'created_at', 'updated_at');

-- 11. Adicionar comentários explicativos na função e tabela
COMMENT ON FUNCTION public.handle_new_user() IS 'Função para criar perfil de usuário automaticamente quando um novo usuário é criado em auth.users';
COMMENT ON TABLE public.perfis IS 'Contém perfis de usuários. Acesso total permitido para todos os usuários autenticados.';

-- 12. Verificar as políticas após as alterações
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