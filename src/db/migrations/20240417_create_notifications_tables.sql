-- Tabela para armazenar as subscrições de notificações dos usuários
CREATE TABLE IF NOT EXISTS notificacoes_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  user_role TEXT NOT NULL DEFAULT 'atleta',
  endpoint TEXT NOT NULL UNIQUE,
  subscription_data JSONB NOT NULL,
  device_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_notificacoes_subscriptions_athlete_id ON notificacoes_subscriptions(athlete_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_subscriptions_user_role ON notificacoes_subscriptions(user_role);
CREATE INDEX IF NOT EXISTS idx_notificacoes_subscriptions_endpoint ON notificacoes_subscriptions(endpoint);

-- Tabela para histórico de notificações enviadas
CREATE TABLE IF NOT EXISTS notificacoes_historico (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo TEXT NOT NULL, -- 'athlete', 'team', 'broadcast', 'role'
  target_id TEXT, -- ID do atleta, equipe, ou função alvo (pode ser nulo para broadcast)
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  data JSONB, -- Dados adicionais enviados na notificação
  enviadas INTEGER DEFAULT 0, -- Número de notificações enviadas com sucesso
  falhas INTEGER DEFAULT 0, -- Número de falhas no envio
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID -- ID do usuário que enviou a notificação
);

-- Criar índices para busca e relatórios
CREATE INDEX IF NOT EXISTS idx_notificacoes_historico_tipo ON notificacoes_historico(tipo);
CREATE INDEX IF NOT EXISTS idx_notificacoes_historico_target_id ON notificacoes_historico(target_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_historico_created_at ON notificacoes_historico(created_at);

-- Tabela para configurações de preferências de notificação por usuário
CREATE TABLE IF NOT EXISTS notificacoes_preferencias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  treino_do_dia BOOLEAN DEFAULT TRUE,
  novas_metas BOOLEAN DEFAULT TRUE,
  ranking_semanal BOOLEAN DEFAULT TRUE,
  ausencias_sem_justificativa BOOLEAN DEFAULT TRUE,
  lembretes_treino BOOLEAN DEFAULT TRUE,
  avaliacoes BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para busca rápida por atleta
CREATE INDEX IF NOT EXISTS idx_notificacoes_preferencias_athlete_id ON notificacoes_preferencias(athlete_id);

-- Função para atualizar o timestamp de updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar o campo updated_at
CREATE TRIGGER set_updated_at_notificacoes_subscriptions
BEFORE UPDATE ON notificacoes_subscriptions
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER set_updated_at_notificacoes_preferencias
BEFORE UPDATE ON notificacoes_preferencias
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Função para criar preferências padrão para novos atletas
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notificacoes_preferencias (athlete_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar preferências quando um novo atleta é adicionado
CREATE TRIGGER create_notification_preferences_for_new_athlete
AFTER INSERT ON athletes
FOR EACH ROW
EXECUTE PROCEDURE create_default_notification_preferences();

-- Criar RLS (Row Level Security) para proteção de dados
-- Habilitar RLS para todas as tabelas
ALTER TABLE notificacoes_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes_preferencias ENABLE ROW LEVEL SECURITY;

-- Políticas para notificacoes_subscriptions
CREATE POLICY "Atletas podem ver suas próprias subscriptions"
  ON notificacoes_subscriptions
  FOR SELECT
  USING (auth.uid()::text = athlete_id::text);

CREATE POLICY "Atletas podem inserir suas próprias subscriptions"
  ON notificacoes_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid()::text = athlete_id::text);

CREATE POLICY "Atletas podem atualizar suas próprias subscriptions"
  ON notificacoes_subscriptions
  FOR UPDATE
  USING (auth.uid()::text = athlete_id::text);

CREATE POLICY "Atletas podem excluir suas próprias subscriptions"
  ON notificacoes_subscriptions
  FOR DELETE
  USING (auth.uid()::text = athlete_id::text);

CREATE POLICY "Administradores podem ver todas as subscriptions"
  ON notificacoes_subscriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Políticas para notificacoes_preferencias
CREATE POLICY "Atletas podem ver suas próprias preferências"
  ON notificacoes_preferencias
  FOR SELECT
  USING (auth.uid()::text = athlete_id::text);

CREATE POLICY "Atletas podem atualizar suas próprias preferências"
  ON notificacoes_preferencias
  FOR UPDATE
  USING (auth.uid()::text = athlete_id::text);

CREATE POLICY "Administradores podem ver todas as preferências"
  ON notificacoes_preferencias
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Políticas para notificacoes_historico
CREATE POLICY "Administradores podem ver histórico de notificações"
  ON notificacoes_historico
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Administradores podem inserir histórico de notificações"
  ON notificacoes_historico
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Função para limpar subscrições não utilizadas após 90 dias
CREATE OR REPLACE FUNCTION cleanup_old_subscriptions() 
RETURNS void AS $$
BEGIN
  DELETE FROM notificacoes_subscriptions
  WHERE last_used < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Comentários nas tabelas e colunas
COMMENT ON TABLE notificacoes_subscriptions IS 'Armazena as subscrições de notificações push dos usuários';
COMMENT ON COLUMN notificacoes_subscriptions.athlete_id IS 'ID do atleta associado à subscription (pode ser null para convidados)';
COMMENT ON COLUMN notificacoes_subscriptions.user_role IS 'Função do usuário (atleta, treinador, admin)';
COMMENT ON COLUMN notificacoes_subscriptions.endpoint IS 'URL endpoint para envio de notificações push (único por dispositivo)';
COMMENT ON COLUMN notificacoes_subscriptions.subscription_data IS 'Dados completos da subscription para o WebPush API';
COMMENT ON COLUMN notificacoes_subscriptions.device_info IS 'Informações sobre o dispositivo (userAgent, platform, etc)';
COMMENT ON COLUMN notificacoes_subscriptions.last_used IS 'Última vez que uma notificação foi enviada para esta subscription';

COMMENT ON TABLE notificacoes_historico IS 'Histórico de notificações enviadas pelo sistema';
COMMENT ON COLUMN notificacoes_historico.tipo IS 'Tipo de destinatário (atleta, equipe, broadcast, função)';
COMMENT ON COLUMN notificacoes_historico.target_id IS 'ID do destinatário (atleta, equipe ou função)';
COMMENT ON COLUMN notificacoes_historico.enviadas IS 'Número de notificações enviadas com sucesso';
COMMENT ON COLUMN notificacoes_historico.falhas IS 'Número de falhas no envio';

COMMENT ON TABLE notificacoes_preferencias IS 'Preferências de notificação por usuário';
COMMENT ON COLUMN notificacoes_preferencias.athlete_id IS 'ID do atleta associado às preferências';
COMMENT ON COLUMN notificacoes_preferencias.treino_do_dia IS 'Receber notificações sobre treino do dia';
COMMENT ON COLUMN notificacoes_preferencias.novas_metas IS 'Receber notificações sobre novas metas';
COMMENT ON COLUMN notificacoes_preferencias.ranking_semanal IS 'Receber notificações sobre ranking semanal';
COMMENT ON COLUMN notificacoes_preferencias.ausencias_sem_justificativa IS 'Receber notificações sobre ausências sem justificativa';
COMMENT ON COLUMN notificacoes_preferencias.lembretes_treino IS 'Receber lembretes de treino';
COMMENT ON COLUMN notificacoes_preferencias.avaliacoes IS 'Receber notificações sobre avaliações'; 