-- Script para verificar triggers e funções relacionadas à criação de usuários

-- 1. Verificar triggers na tabela auth.users
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
ORDER BY action_timing, event_manipulation;

-- 2. Buscar funções potencialmente relacionadas à criação de perfis
SELECT 
  routine_schema,
  routine_name,
  routine_type,
  data_type,
  security_type
FROM information_schema.routines
WHERE routine_name ILIKE '%user%'
  OR routine_name ILIKE '%perfil%'
  OR routine_name ILIKE '%profile%'
ORDER BY routine_schema, routine_name;

-- 3. Verificar definição da função handle_new_user (se existir)
SELECT pg_get_functiondef(oid)
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 4. Verificar colunas da tabela perfis para entender constraints
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'perfis'
ORDER BY ordinal_position;

-- 5. Verificar constraints da tabela perfis
SELECT 
  con.conname AS constraint_name,
  con.contype AS constraint_type,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE nsp.nspname = 'public'
  AND rel.relname = 'perfis';

-- 6. Verificar políticas RLS na tabela perfis
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

-- 7. Verificar permissões na tabela perfis
SELECT 
  grantee,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name = 'perfis'
ORDER BY grantee, privilege_type; 