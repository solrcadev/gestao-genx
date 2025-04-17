-- Tabela para armazenar usuários do sistema
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  encrypted_password TEXT NOT NULL,
  nome TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'coach',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Função para atualizar o timestamp de updated_at automaticamente
CREATE OR REPLACE FUNCTION update_users_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar o campo updated_at
CREATE TRIGGER set_updated_at_users
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE PROCEDURE update_users_updated_at_column();

-- Habilitar RLS (Row Level Security) para proteção de dados
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para usuários
CREATE POLICY "Usuários podem ver seus próprios dados"
  ON users
  FOR SELECT
  USING (auth.uid()::text = id::text);

CREATE POLICY "Usuários podem atualizar seus próprios dados"
  ON users
  FOR UPDATE
  USING (auth.uid()::text = id::text);

CREATE POLICY "Administradores podem ver todos os usuários"
  ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Administradores podem criar novos usuários"
  ON users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Administradores podem atualizar qualquer usuário"
  ON users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Comentários nas tabelas e colunas
COMMENT ON TABLE users IS 'Armazena informações dos usuários do sistema';
COMMENT ON COLUMN users.id IS 'ID único do usuário, corresponde ao auth.uid do Supabase Auth';
COMMENT ON COLUMN users.email IS 'Email do usuário (único)';
COMMENT ON COLUMN users.encrypted_password IS 'Senha criptografada do usuário';
COMMENT ON COLUMN users.nome IS 'Nome completo do usuário';
COMMENT ON COLUMN users.role IS 'Função do usuário no sistema (coach, admin)';
COMMENT ON COLUMN users.created_at IS 'Data e hora de criação do registro';
COMMENT ON COLUMN users.updated_at IS 'Data e hora da última atualização do registro'; 