-- Script para adicionar colunas de marcadores de tempo de vídeo
-- à tabela de exercícios

-- Verificar se as colunas já existem antes de adicioná-las
DO $$ 
BEGIN
  -- Adicionar coluna video_inicio se não existir
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'exercicios' 
    AND column_name = 'video_inicio'
  ) THEN
    ALTER TABLE public.exercicios ADD COLUMN video_inicio VARCHAR(20);
  END IF;

  -- Adicionar coluna video_fim se não existir
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'exercicios' 
    AND column_name = 'video_fim'
  ) THEN
    ALTER TABLE public.exercicios ADD COLUMN video_fim VARCHAR(20);
  END IF;
END $$; 