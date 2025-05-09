-- Adicionar campo dificuldade à tabela exercicios
ALTER TABLE IF EXISTS public.exercicios
ADD COLUMN IF NOT EXISTS dificuldade TEXT DEFAULT 'Intermediário';

-- Adicionar constraint para garantir valores válidos
ALTER TABLE IF EXISTS public.exercicios
ADD CONSTRAINT check_dificuldade CHECK (dificuldade IN ('Iniciante', 'Intermediário', 'Avançado'));

-- Adicionar comentário na coluna para documentação
COMMENT ON COLUMN public.exercicios.dificuldade IS 'Nível de dificuldade do exercício (Iniciante, Intermediário, Avançado)';

-- Instruções para Supabase:
-- Execute este script no editor SQL do Supabase
-- Ou através da CLI do Supabase com o comando:
-- supabase db push 