-- Script para corrigir os nomes de campos usados nos triggers
-- O problema é que a função trigger_set_timestamp está tentando atualizar um campo chamado 'atualizado_em'
-- mas na tabela perfis o campo se chama 'updated_at'

-- Atualizar a função trigger_set_timestamp para usar o campo updated_at
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Verifica qual campo existe na tabela e usa o nome apropriado
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = TG_TABLE_SCHEMA 
    AND table_name = TG_TABLE_NAME 
    AND column_name = 'updated_at'
  ) THEN
    NEW.updated_at = NOW();
  ELSIF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = TG_TABLE_SCHEMA 
    AND table_name = TG_TABLE_NAME 
    AND column_name = 'atualizado_em'
  ) THEN
    NEW.atualizado_em = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verificar triggers na tabela perfis
DO $$
BEGIN
  RAISE NOTICE 'Verificando triggers na tabela perfis...';
  
  -- Verificar se o trigger existe
  IF EXISTS (
    SELECT FROM pg_trigger 
    WHERE tgname = 'set_timestamp' 
    AND tgrelid = 'public.perfis'::regclass
  ) THEN
    RAISE NOTICE 'Trigger set_timestamp encontrado na tabela perfis';
  ELSE
    RAISE NOTICE 'Trigger set_timestamp NÃO ENCONTRADO na tabela perfis, criando...';
    
    -- Criar o trigger
    CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON public.perfis
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_set_timestamp();
  END IF;
END $$;

-- Fazer consulta para verificar a estrutura da tabela perfis
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM 
  information_schema.columns 
WHERE 
  table_schema = 'public' 
  AND table_name = 'perfis' 
ORDER BY 
  ordinal_position; 