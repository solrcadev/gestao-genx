-- Script para criar a tabela de eventos qualificados no Supabase
-- Deve ser executado no SQL Editor do Supabase

-- Criar extensão UUID se não existir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar tabela de eventos qualificados
CREATE TABLE IF NOT EXISTS public.avaliacoes_eventos_qualificados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  atleta_id UUID NOT NULL,
  treino_id UUID,
  fundamento TEXT NOT NULL,
  tipo_evento TEXT NOT NULL,
  peso NUMERIC(3,1) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  observacoes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_atleta FOREIGN KEY (atleta_id) REFERENCES public.athletes(id) ON DELETE CASCADE
);

-- Comentários para documentação da tabela
COMMENT ON TABLE public.avaliacoes_eventos_qualificados IS 'Tabela para armazenar eventos qualificados dos atletas';
COMMENT ON COLUMN public.avaliacoes_eventos_qualificados.id IS 'Identificador único do evento';
COMMENT ON COLUMN public.avaliacoes_eventos_qualificados.atleta_id IS 'ID do atleta avaliado';
COMMENT ON COLUMN public.avaliacoes_eventos_qualificados.treino_id IS 'ID do treino onde o evento foi registrado (opcional)';
COMMENT ON COLUMN public.avaliacoes_eventos_qualificados.fundamento IS 'Fundamento técnico avaliado';
COMMENT ON COLUMN public.avaliacoes_eventos_qualificados.tipo_evento IS 'Tipo de evento (ex: Ace, Ataque Eficiente, Erro)';
COMMENT ON COLUMN public.avaliacoes_eventos_qualificados.peso IS 'Peso técnico do evento (pontuação: positiva ou negativa)';
COMMENT ON COLUMN public.avaliacoes_eventos_qualificados.timestamp IS 'Momento em que o evento ocorreu';
COMMENT ON COLUMN public.avaliacoes_eventos_qualificados.observacoes IS 'Observações adicionais sobre o evento';
COMMENT ON COLUMN public.avaliacoes_eventos_qualificados.created_at IS 'Data e hora de criação do registro';
COMMENT ON COLUMN public.avaliacoes_eventos_qualificados.updated_at IS 'Data e hora da última atualização do registro';

-- Criar função para atualizar automaticamente o campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger se já existir
DROP TRIGGER IF EXISTS update_eventos_qualificados_updated_at ON public.avaliacoes_eventos_qualificados;

-- Criar trigger para atualizar o campo updated_at automaticamente
CREATE TRIGGER update_eventos_qualificados_updated_at
BEFORE UPDATE ON public.avaliacoes_eventos_qualificados
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.avaliacoes_eventos_qualificados ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes (se existirem)
DROP POLICY IF EXISTS "Permitir SELECT para usuários autenticados" ON public.avaliacoes_eventos_qualificados;
DROP POLICY IF EXISTS "Permitir INSERT para usuários autenticados" ON public.avaliacoes_eventos_qualificados;
DROP POLICY IF EXISTS "Permitir UPDATE para usuários autenticados" ON public.avaliacoes_eventos_qualificados;
DROP POLICY IF EXISTS "Permitir DELETE para usuários autenticados" ON public.avaliacoes_eventos_qualificados;

-- Criar políticas de segurança (RLS)
-- Política para permitir SELECT para usuários autenticados
CREATE POLICY "Permitir SELECT para usuários autenticados" 
  ON public.avaliacoes_eventos_qualificados FOR SELECT 
  TO authenticated 
  USING (true);

-- Política para permitir INSERT para usuários autenticados
CREATE POLICY "Permitir INSERT para usuários autenticados" 
  ON public.avaliacoes_eventos_qualificados FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- Política para permitir UPDATE para usuários autenticados
CREATE POLICY "Permitir UPDATE para usuários autenticados" 
  ON public.avaliacoes_eventos_qualificados FOR UPDATE 
  TO authenticated 
  USING (true);

-- Política para permitir DELETE para usuários autenticados
CREATE POLICY "Permitir DELETE para usuários autenticados" 
  ON public.avaliacoes_eventos_qualificados FOR DELETE 
  TO authenticated 
  USING (true);

-- Criar função RPC para criar a tabela a partir do código
CREATE OR REPLACE FUNCTION criar_tabela_eventos_qualificados()
RETURNS void AS $$
BEGIN
  -- O conteúdo desta função deve ser idêntico a este script
  -- É usado pelo serviço para criar a tabela se ela não existir
  
  -- Criar extensão UUID se não existir
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  
  -- Criar tabela de eventos qualificados
  CREATE TABLE IF NOT EXISTS public.avaliacoes_eventos_qualificados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    atleta_id UUID NOT NULL,
    treino_id UUID,
    fundamento TEXT NOT NULL,
    tipo_evento TEXT NOT NULL,
    peso NUMERIC(3,1) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    observacoes TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_atleta FOREIGN KEY (atleta_id) REFERENCES public.athletes(id) ON DELETE CASCADE
  );
  
  -- Criar função para atualizar automaticamente o campo updated_at
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $BODY$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $BODY$ LANGUAGE plpgsql;
  
  -- Remover trigger se já existir
  DROP TRIGGER IF EXISTS update_eventos_qualificados_updated_at ON public.avaliacoes_eventos_qualificados;
  
  -- Criar trigger para atualizar o campo updated_at automaticamente
  CREATE TRIGGER update_eventos_qualificados_updated_at
  BEFORE UPDATE ON public.avaliacoes_eventos_qualificados
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
  
  -- Habilitar RLS (Row Level Security)
  ALTER TABLE public.avaliacoes_eventos_qualificados ENABLE ROW LEVEL SECURITY;
  
  -- Remover políticas existentes (se existirem)
  DROP POLICY IF EXISTS "Permitir SELECT para usuários autenticados" ON public.avaliacoes_eventos_qualificados;
  DROP POLICY IF EXISTS "Permitir INSERT para usuários autenticados" ON public.avaliacoes_eventos_qualificados;
  DROP POLICY IF EXISTS "Permitir UPDATE para usuários autenticados" ON public.avaliacoes_eventos_qualificados;
  DROP POLICY IF EXISTS "Permitir DELETE para usuários autenticados" ON public.avaliacoes_eventos_qualificados;
  
  -- Criar políticas de segurança (RLS)
  CREATE POLICY "Permitir SELECT para usuários autenticados" 
    ON public.avaliacoes_eventos_qualificados FOR SELECT 
    TO authenticated 
    USING (true);
  
  CREATE POLICY "Permitir INSERT para usuários autenticados" 
    ON public.avaliacoes_eventos_qualificados FOR INSERT 
    TO authenticated 
    WITH CHECK (true);
  
  CREATE POLICY "Permitir UPDATE para usuários autenticados" 
    ON public.avaliacoes_eventos_qualificados FOR UPDATE 
    TO authenticated 
    USING (true);
  
  CREATE POLICY "Permitir DELETE para usuários autenticados" 
    ON public.avaliacoes_eventos_qualificados FOR DELETE 
    TO authenticated 
    USING (true);
END;
$$ LANGUAGE plpgsql;

-- Adicionar permissão para função RPC
GRANT EXECUTE ON FUNCTION criar_tabela_eventos_qualificados() TO authenticated;
GRANT EXECUTE ON FUNCTION criar_tabela_eventos_qualificados() TO service_role; 