-- Script para ajustar a estrutura da tabela perfis

-- 1. Verificar se a tabela existe e criar caso não exista
CREATE TABLE IF NOT EXISTS public.perfis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  funcao TEXT NOT NULL DEFAULT 'atleta',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2. Adicionar valores padrão em colunas que não devem ser NULL
-- Isso ajuda a evitar erros ao inserir novos registros
-- Vamos verificar e adicionar defaults onde estiverem faltando
DO $$
DECLARE
  col_exists boolean;
BEGIN
  -- Verificar a coluna 'nome' e adicionar valor padrão se existir e não tiver
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'perfis' 
    AND column_name = 'nome'
    AND column_default IS NULL
  ) INTO col_exists;
  
  IF col_exists THEN
    EXECUTE 'ALTER TABLE public.perfis ALTER COLUMN nome SET DEFAULT ''Nome não informado''';
  END IF;
  
  -- Verificar a coluna 'email' e adicionar valor padrão se existir e não tiver
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'perfis' 
    AND column_name = 'email'
    AND column_default IS NULL
  ) INTO col_exists;
  
  IF col_exists THEN
    EXECUTE 'ALTER TABLE public.perfis ALTER COLUMN email SET DEFAULT ''email@exemplo.com''';
  END IF;
  
  -- Verificar a coluna 'funcao' e ajustar se necessário
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'perfis' 
    AND column_name = 'funcao'
    AND column_default IS NULL
  ) INTO col_exists;
  
  IF col_exists THEN
    EXECUTE 'ALTER TABLE public.perfis ALTER COLUMN funcao SET DEFAULT ''atleta''';
  END IF;
END
$$;

-- 3. Verificar e ajustar a trigger de atualização de timestamps se necessária
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger se já existir para evitar duplicação
DROP TRIGGER IF EXISTS update_perfis_updated_at ON public.perfis;

-- Criar trigger para atualizar o campo updated_at automaticamente
CREATE TRIGGER update_perfis_updated_at
BEFORE UPDATE ON public.perfis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Mostrar a estrutura atual da tabela para verificação
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'perfis'
ORDER BY ordinal_position; 