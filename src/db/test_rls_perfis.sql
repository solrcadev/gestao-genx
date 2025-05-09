-- Script para testar as políticas RLS da tabela "perfis" após a correção

-- 1. Verificar se a função get_user_role está retornando corretamente o papel do usuário
DO $$
BEGIN
  RAISE NOTICE 'Testando função get_user_role()...';
  RAISE NOTICE 'Papel do usuário atual: %', public.get_user_role();
END $$;

-- 2. Testar acesso do usuário ao seu próprio perfil
DO $$
DECLARE
  perfil_count INTEGER;
  usuario_atual UUID;
BEGIN
  -- Obter ID do usuário atual
  SELECT auth.uid() INTO usuario_atual;
  
  RAISE NOTICE 'Testando acesso do usuário ao próprio perfil...';
  RAISE NOTICE 'ID do usuário atual: %', usuario_atual;
  
  -- Executar query como usuário atual
  SELECT COUNT(*) INTO perfil_count 
  FROM public.perfis 
  WHERE user_id = usuario_atual;
  
  RAISE NOTICE 'Perfis encontrados para o usuário atual: %', perfil_count;
  
  IF perfil_count > 0 THEN
    RAISE NOTICE 'SUCESSO: Usuário consegue ver seu próprio perfil.';
  ELSE
    RAISE NOTICE 'Nenhum perfil encontrado para o usuário atual.';
  END IF;
END $$;

-- 3. Testar acesso de administrador a todos os perfis
DO $$
DECLARE
  perfil_count INTEGER;
  eh_admin BOOLEAN;
BEGIN
  -- Verificar se o usuário atual é administrador
  SELECT (public.get_user_role() = 'admin') INTO eh_admin;
  
  RAISE NOTICE 'Testando acesso de administrador a todos perfis...';
  
  IF eh_admin THEN
    -- Executar query como administrador
    SELECT COUNT(*) INTO perfil_count 
    FROM public.perfis;
    
    RAISE NOTICE 'Total de perfis visíveis para o administrador: %', perfil_count;
    RAISE NOTICE 'SUCESSO: Administrador consegue ver todos os perfis.';
  ELSE
    RAISE NOTICE 'IGNORADO: Usuário atual não é administrador.';
  END IF;
END $$;

-- 4. Testar acesso de técnico/monitor a perfis de atletas
DO $$
DECLARE
  perfil_count INTEGER;
  papel TEXT;
BEGIN
  -- Obter papel do usuário atual
  SELECT public.get_user_role() INTO papel;
  
  RAISE NOTICE 'Testando acesso de técnico/monitor a perfis de atletas...';
  RAISE NOTICE 'Papel do usuário atual: %', papel;
  
  IF papel IN ('tecnico', 'monitor') THEN
    -- Executar query como técnico/monitor
    SELECT COUNT(*) INTO perfil_count 
    FROM public.perfis
    WHERE funcao = 'atleta';
    
    RAISE NOTICE 'Total de perfis de atletas visíveis: %', perfil_count;
    RAISE NOTICE 'SUCESSO: Técnico/monitor consegue ver perfis de atletas.';
  ELSE
    RAISE NOTICE 'IGNORADO: Usuário atual não é técnico ou monitor.';
  END IF;
END $$;

-- 5. Testar permissão para alteração de perfil
DO $$
DECLARE
  usuario_atual UUID;
  perfil_record RECORD;
  posso_editar BOOLEAN := FALSE;
BEGIN
  -- Obter ID do usuário atual
  SELECT auth.uid() INTO usuario_atual;
  
  RAISE NOTICE 'Testando permissão para alteração de perfil...';
  
  -- Buscar um perfil que o usuário deveria poder editar
  BEGIN
    -- Primeiro tenta editar o próprio perfil
    SELECT * INTO perfil_record 
    FROM public.perfis 
    WHERE user_id = usuario_atual
    LIMIT 1;
    
    IF FOUND THEN
      posso_editar := TRUE;
      RAISE NOTICE 'SUCESSO: Usuário pode editar seu próprio perfil.';
    END IF;
    
    -- Se for admin, tenta editar outro perfil
    IF public.get_user_role() = 'admin' AND NOT FOUND THEN
      SELECT * INTO perfil_record 
      FROM public.perfis 
      WHERE user_id != usuario_atual
      LIMIT 1;
      
      IF FOUND THEN
        posso_editar := TRUE;
        RAISE NOTICE 'SUCESSO: Administrador pode editar outros perfis.';
      END IF;
    END IF;
    
    IF NOT posso_editar THEN
      RAISE NOTICE 'Nenhum perfil encontrado que o usuário possa editar.';
    END IF;
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'FALHA: Erro de permissão ao tentar editar perfil: %', SQLERRM;
    WHEN others THEN
      RAISE NOTICE 'FALHA: Erro ao testar edição de perfil: %', SQLERRM;
  END;
END $$;

-- 6. Verificar se as políticas estão realmente aplicadas na tabela
SELECT 
  schemaname,
  tablename,
  polname,
  format('FOR %s TO %s USING (%s)', cmd, roles, qual) as policy_details
FROM pg_policy
WHERE tablename = 'perfis'
ORDER BY polname;

-- 7. Verificar erros de política RLS (executar este comando separadamente se ocorrerem erros)
/*
EXPLAIN ANALYZE
SELECT * 
FROM public.perfis 
WHERE user_id = auth.uid() 
LIMIT 1;
*/ 