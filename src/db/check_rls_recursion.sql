-- Script para diagnóstico de problemas de recursão em políticas RLS
-- Este script ajuda a identificar políticas que podem causar recursão infinita

-- 1. Verificar se o RLS está habilitado para a tabela 'perfis'
SELECT 
  relname AS tablename,
  relrowsecurity AS "rls_enabled",
  relforcerowsecurity AS "rls_forced"
FROM pg_class
JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
WHERE nspname = 'public' AND relname = 'perfis';

-- 2. Listar todas as políticas da tabela 'perfis'
-- A consulta pg_policies é segura pois é uma view do sistema
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

-- 3. Identificar políticas que podem estar causando recursão
-- Verifica políticas que fazem referência à própria tabela em suas definições
SELECT 
  n.nspname AS schemaname,
  c.relname AS tablename,
  p.polname AS policyname,
  p.polcmd AS cmd,
  pg_get_expr(p.polqual, p.polrelid) as policy_using_clause,
  pg_get_expr(p.polwithcheck, p.polrelid) as policy_with_check_clause
FROM pg_policy p
JOIN pg_class c ON c.oid = p.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'perfis'
  AND (
    pg_get_expr(p.polqual, p.polrelid) LIKE '%perfis%' OR 
    pg_get_expr(p.polwithcheck, p.polrelid) LIKE '%perfis%'
  );

-- 4. Verificar se existem funções definidas para uso em políticas de RLS
-- que podem estar causando a recursão
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND pg_get_functiondef(p.oid) LIKE '%perfis%';

-- 5. Verificar outras tabelas com possíveis problemas de recursão nas políticas
-- Identifica todas as políticas que fazem referência a uma tabela nela mesma
SELECT 
  n.nspname AS schemaname,
  c.relname AS tablename,
  p.polname AS policyname,
  p.polcmd AS cmd,
  pg_get_expr(p.polqual, p.polrelid) as policy_using_clause,
  pg_get_expr(p.polwithcheck, p.polrelid) as policy_with_check_clause
FROM pg_policy p
JOIN pg_class c ON c.oid = p.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND (
    pg_get_expr(p.polqual, p.polrelid) LIKE '%' || c.relname || '%' OR 
    pg_get_expr(p.polwithcheck, p.polrelid) LIKE '%' || c.relname || '%'
  );

-- 6. Verificar tabelas referenciadas por perfis que podem estar causando ciclos de referência
SELECT 
  f.attname AS foreign_column,
  m.relname AS referenced_table,
  o.attname AS referenced_column,
  pg_get_constraintdef(c.oid) as constraint_definition
FROM pg_constraint c
JOIN pg_class m ON m.oid = c.confrelid -- referenced table
JOIN pg_class r ON r.oid = c.conrelid  -- referencing table
JOIN pg_attribute f ON f.attnum = ANY(c.conkey) AND f.attrelid = c.conrelid
JOIN pg_attribute o ON o.attnum = ANY(c.confkey) AND o.attrelid = c.confrelid
JOIN pg_namespace n ON n.oid = c.connamespace
WHERE c.contype = 'f'  -- f = foreign key constraint
  AND r.relname = 'perfis'
  AND n.nspname = 'public'; 