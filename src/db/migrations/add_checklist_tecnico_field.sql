-- Adicionar campo checklist_tecnico (array de strings) à tabela exercicios
ALTER TABLE IF EXISTS public.exercicios
ADD COLUMN IF NOT EXISTS checklist_tecnico TEXT[] DEFAULT '{}';

-- Adicionar comentário ao campo
COMMENT ON COLUMN public.exercicios.checklist_tecnico IS 'Array de pontos de atenção técnicos para a execução correta do exercício';

-- Adicionar índice GIN para pesquisa eficiente no array
CREATE INDEX IF NOT EXISTS idx_exercicios_checklist_tecnico
ON public.exercicios USING GIN (checklist_tecnico); 