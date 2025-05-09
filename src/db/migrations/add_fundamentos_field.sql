-- Adicionar campo fundamentos (array de strings) à tabela exercicios
ALTER TABLE IF EXISTS public.exercicios
ADD COLUMN IF NOT EXISTS fundamentos TEXT[] DEFAULT '{}';

-- Comentário na coluna para documentação
COMMENT ON COLUMN public.exercicios.fundamentos IS 'Array de fundamentos técnicos abordados no exercício (levantamento, recepção, defesa, etc)';

-- Criar índice para melhorar performance de buscas por fundamento
CREATE INDEX IF NOT EXISTS idx_exercicios_fundamentos
ON public.exercicios USING GIN (fundamentos);

-- Instruções para Supabase:
-- Execute este script no editor SQL do Supabase
-- Ou através da CLI do Supabase com o comando:
-- supabase db push 