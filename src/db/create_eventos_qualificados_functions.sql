-- Function to check if a table exists
CREATE OR REPLACE FUNCTION public.check_table_exists(table_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE  table_schema = 'public'
    AND    table_name = check_table_exists.table_name
  ) INTO table_exists;
  
  RETURN table_exists;
END;
$$;

-- Function to create the eventos_qualificados table
CREATE OR REPLACE FUNCTION public.create_eventos_qualificados_table()
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Habilita UUID extension se não estiver habilitada
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  
  -- Cria a tabela de eventos qualificados
  CREATE TABLE IF NOT EXISTS public.eventos_qualificados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    atleta_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
    treino_id UUID REFERENCES public.treinos(id) ON DELETE SET NULL,
    fundamento TEXT NOT NULL,
    tipo_evento TEXT NOT NULL,
    peso DECIMAL(4,2) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
    observacoes TEXT,
    exercicio_id UUID REFERENCES public.exercicios(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
  );
  
  -- Adiciona índices para melhorar a performance
  CREATE INDEX IF NOT EXISTS idx_eventos_qualificados_atleta_id ON public.eventos_qualificados(atleta_id);
  CREATE INDEX IF NOT EXISTS idx_eventos_qualificados_treino_id ON public.eventos_qualificados(treino_id);
  CREATE INDEX IF NOT EXISTS idx_eventos_qualificados_fundamento ON public.eventos_qualificados(fundamento);
  CREATE INDEX IF NOT EXISTS idx_eventos_qualificados_timestamp ON public.eventos_qualificados(timestamp);
  
  -- Configura políticas de segurança (RLS)
  ALTER TABLE public.eventos_qualificados ENABLE ROW LEVEL SECURITY;
  
  -- Política para leitura (todos os usuários autenticados podem ver)
  CREATE POLICY "Eventos qualificados são visíveis por todos os usuários autenticados"
    ON public.eventos_qualificados FOR SELECT
    USING (auth.role() = 'authenticated');
  
  -- Política para inserção (todos os usuários autenticados podem inserir)
  CREATE POLICY "Usuários autenticados podem inserir eventos"
    ON public.eventos_qualificados FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
  
  -- Política para atualização (apenas o mesmo usuário ou admins)
  CREATE POLICY "Usuários podem atualizar seus próprios eventos"
    ON public.eventos_qualificados FOR UPDATE
    USING (auth.role() = 'authenticated');
  
  -- Política para deleção (apenas o mesmo usuário ou admins)
  CREATE POLICY "Usuários podem excluir seus próprios eventos"
    ON public.eventos_qualificados FOR DELETE
    USING (auth.role() = 'authenticated');
  
  -- Trigger para atualizar o updated_at
  CREATE OR REPLACE FUNCTION update_eventos_qualificados_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
  
  CREATE TRIGGER set_eventos_qualificados_updated_at
  BEFORE UPDATE ON public.eventos_qualificados
  FOR EACH ROW
  EXECUTE FUNCTION update_eventos_qualificados_updated_at();
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating table: %', SQLERRM;
    RETURN FALSE;
END;
$$; 