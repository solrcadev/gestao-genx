-- Adicionar coluna checklist_tecnico à tabela exercicios
ALTER TABLE public.exercicios
ADD COLUMN IF NOT EXISTS checklist_tecnico TEXT[] DEFAULT '{}';
 
-- Adicionar comentário para documentação
COMMENT ON COLUMN public.exercicios.checklist_tecnico IS 'Lista de pontos técnicos importantes para a execução correta do exercício'; 