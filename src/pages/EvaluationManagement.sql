
-- Create a table for evaluation history
CREATE TABLE IF NOT EXISTS public.avaliacoes_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avaliacao_id UUID NOT NULL REFERENCES avaliacoes_fundamento(id) ON DELETE CASCADE,
  acertos_anterior INT NOT NULL,
  erros_anterior INT NOT NULL,
  tecnico_id UUID NOT NULL,
  data_modificacao TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create a table to log deletions
CREATE TABLE IF NOT EXISTS public.exclusoes_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tabela TEXT NOT NULL,
  registro_id UUID NOT NULL,
  usuario_id UUID NOT NULL,
  data_exclusao TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
