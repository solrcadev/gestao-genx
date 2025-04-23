-- Script para desabilitar triggers na tabela perfis
-- Este script irá remover o trigger que está causando o erro 'record "new" has no field "atualizado_em"'

-- Remover triggers da tabela perfis
DROP TRIGGER IF EXISTS set_timestamp ON public.perfis;

-- Verificar se existem triggers na tabela perfis
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM 
  information_schema.triggers
WHERE 
  event_object_schema = 'public'
  AND event_object_table = 'perfis';

-- Mostrar a estrutura da tabela perfis
SELECT 
  column_name, 
  data_type
FROM 
  information_schema.columns 
WHERE 
  table_schema = 'public' 
  AND table_name = 'perfis' 
ORDER BY 
  ordinal_position; 