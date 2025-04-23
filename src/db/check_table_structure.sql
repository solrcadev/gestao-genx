-- Script para verificar a estrutura da tabela perfis
-- Este script ajuda a diagnosticar problemas com campos e triggers

-- Verificar os campos da tabela perfis
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM 
  information_schema.columns 
WHERE 
  table_schema = 'public' 
  AND table_name = 'perfis' 
ORDER BY 
  ordinal_position;

-- Verificar todos os triggers na tabela perfis
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM 
  information_schema.triggers
WHERE 
  event_object_schema = 'public'
  AND event_object_table = 'perfis';

-- Verificar a função trigger_set_timestamp
SELECT 
  proname, 
  prosrc 
FROM 
  pg_proc 
WHERE 
  proname = 'trigger_set_timestamp';

-- Mostrar uma amostra de dados da tabela perfis (limitado a 5 registros)
SELECT * FROM public.perfis LIMIT 5; 