-- Script para criar a tabela de atas de reunião no Supabase
-- Deve ser executado no SQL Editor do Supabase

-- Criar extensão UUID se não existir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar tabela de atas de reunião
CREATE TABLE IF NOT EXISTS public.atas_reuniao (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo TEXT NOT NULL,
  data DATE NOT NULL,
  participantes TEXT[] DEFAULT '{}',
  topicos JSONB DEFAULT '[]',
  decisoes JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentários para documentação da tabela
COMMENT ON TABLE public.atas_reuniao IS 'Tabela para armazenar atas de reunião da equipe técnica';
COMMENT ON COLUMN public.atas_reuniao.id IS 'Identificador único da ata';
COMMENT ON COLUMN public.atas_reuniao.titulo IS 'Título da reunião';
COMMENT ON COLUMN public.atas_reuniao.data IS 'Data em que a reunião ocorreu';
COMMENT ON COLUMN public.atas_reuniao.participantes IS 'Lista de nomes dos participantes da reunião';
COMMENT ON COLUMN public.atas_reuniao.topicos IS 'Lista de tópicos discutidos na reunião, armazenados como JSON';
COMMENT ON COLUMN public.atas_reuniao.decisoes IS 'Lista de decisões tomadas na reunião, armazenadas como JSON';
COMMENT ON COLUMN public.atas_reuniao.created_at IS 'Data e hora de criação do registro';
COMMENT ON COLUMN public.atas_reuniao.updated_at IS 'Data e hora da última atualização do registro';

-- Criar função para atualizar automaticamente o campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger se já existir
DROP TRIGGER IF EXISTS update_atas_reuniao_updated_at ON public.atas_reuniao;

-- Criar trigger para atualizar o campo updated_at automaticamente
CREATE TRIGGER update_atas_reuniao_updated_at
BEFORE UPDATE ON public.atas_reuniao
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.atas_reuniao ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes (se existirem)
DROP POLICY IF EXISTS "Permitir SELECT para usuários autenticados" ON public.atas_reuniao;
DROP POLICY IF EXISTS "Permitir INSERT para usuários autenticados" ON public.atas_reuniao;
DROP POLICY IF EXISTS "Permitir UPDATE para usuários autenticados" ON public.atas_reuniao;
DROP POLICY IF EXISTS "Permitir DELETE para usuários autenticados" ON public.atas_reuniao;

-- Criar políticas de segurança (RLS)
-- Política para permitir SELECT para usuários autenticados
CREATE POLICY "Permitir SELECT para usuários autenticados" 
  ON public.atas_reuniao FOR SELECT 
  TO authenticated 
  USING (true);

-- Política para permitir INSERT para usuários autenticados
CREATE POLICY "Permitir INSERT para usuários autenticados" 
  ON public.atas_reuniao FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- Política para permitir UPDATE para usuários autenticados
CREATE POLICY "Permitir UPDATE para usuários autenticados" 
  ON public.atas_reuniao FOR UPDATE 
  TO authenticated 
  USING (true);

-- Política para permitir DELETE para usuários autenticados
CREATE POLICY "Permitir DELETE para usuários autenticados" 
  ON public.atas_reuniao FOR DELETE 
  TO authenticated 
  USING (true);

-- Criar função RPC para criar a tabela a partir do código
CREATE OR REPLACE FUNCTION criar_tabela_atas_reuniao()
RETURNS void AS $$
BEGIN
  -- O conteúdo desta função deve ser idêntico a este script
  -- É usado pelo serviço para criar a tabela se ela não existir
  
  -- Criar extensão UUID se não existir
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  
  -- Criar tabela de atas de reunião
  CREATE TABLE IF NOT EXISTS public.atas_reuniao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo TEXT NOT NULL,
    data DATE NOT NULL,
    participantes TEXT[] DEFAULT '{}',
    topicos JSONB DEFAULT '[]',
    decisoes JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- Criar função para atualizar automaticamente o campo updated_at
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $func$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $func$ LANGUAGE plpgsql;
  
  -- Remover trigger se já existir
  DROP TRIGGER IF EXISTS update_atas_reuniao_updated_at ON public.atas_reuniao;
  
  -- Criar trigger para atualizar o campo updated_at automaticamente
  CREATE TRIGGER update_atas_reuniao_updated_at
  BEFORE UPDATE ON public.atas_reuniao
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
  
  -- Habilitar RLS (Row Level Security)
  ALTER TABLE public.atas_reuniao ENABLE ROW LEVEL SECURITY;
  
  -- Remover políticas existentes (se existirem)
  DROP POLICY IF EXISTS "Permitir SELECT para usuários autenticados" ON public.atas_reuniao;
  DROP POLICY IF EXISTS "Permitir INSERT para usuários autenticados" ON public.atas_reuniao;
  DROP POLICY IF EXISTS "Permitir UPDATE para usuários autenticados" ON public.atas_reuniao;
  DROP POLICY IF EXISTS "Permitir DELETE para usuários autenticados" ON public.atas_reuniao;
  
  -- Criar políticas de segurança (RLS)
  CREATE POLICY "Permitir SELECT para usuários autenticados" 
    ON public.atas_reuniao FOR SELECT 
    TO authenticated 
    USING (true);
  
  CREATE POLICY "Permitir INSERT para usuários autenticados" 
    ON public.atas_reuniao FOR INSERT 
    TO authenticated 
    WITH CHECK (true);
  
  CREATE POLICY "Permitir UPDATE para usuários autenticados" 
    ON public.atas_reuniao FOR UPDATE 
    TO authenticated 
    USING (true);
  
  CREATE POLICY "Permitir DELETE para usuários autenticados" 
    ON public.atas_reuniao FOR DELETE 
    TO authenticated 
    USING (true);
END;
$$ LANGUAGE plpgsql;

-- Adicionar permissão para função RPC
GRANT EXECUTE ON FUNCTION criar_tabela_atas_reuniao() TO authenticated;
GRANT EXECUTE ON FUNCTION criar_tabela_atas_reuniao() TO service_role; 