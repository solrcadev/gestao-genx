-- Script para corrigir problemas de recursão infinita nas políticas RLS

-- 1. Criar uma função auxiliar SECURITY DEFINER para obter o papel do usuário
-- Esta abordagem evita o problema de recursão infinita que ocorre quando
-- políticas RLS tentam acessar a própria tabela que estão protegendo
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Esta função é SECURITY DEFINER para ignorar RLS
    -- Isso evita a recursão infinita ao consultar a tabela perfis
    SELECT funcao INTO user_role
    FROM public.perfis
    WHERE user_id = auth.uid()
    LIMIT 1;
    
    RETURN COALESCE(user_role, 'sem_perfil');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Dar permissões adequadas à função
ALTER FUNCTION public.get_user_role() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.get_user_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO service_role;

-- 3. Adicionar comentário explicativo
COMMENT ON FUNCTION public.get_user_role() IS 'Função para obter o papel do usuário atual sem passar por políticas RLS, evitando recursão infinita.';

-- 4. Opcionalmente, criar função para verificar se o usuário tem determinado papel
-- Isso pode ser útil em outras partes do código
CREATE OR REPLACE FUNCTION public.user_has_role(role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.get_user_role() = role_name;
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = public;

-- 5. Adicionar permissões para a função auxiliar
ALTER FUNCTION public.user_has_role(TEXT) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.user_has_role(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_has_role(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_role(TEXT) TO service_role;

-- 6. Adicionar comentário explicativo
COMMENT ON FUNCTION public.user_has_role(TEXT) IS 'Verifica se o usuário atual tem determinado papel. Usa get_user_role() para evitar problemas de recursão.';

-- 7. Relembrar o administrador de usar estas funções nas políticas RLS
SELECT '⚠️ LEMBRETE: Agora use public.get_user_role() nas políticas RLS para evitar recursão infinita!' AS message; 