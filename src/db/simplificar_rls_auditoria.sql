-- Script para simplificar as políticas RLS da tabela "presencas_audit_log"
-- Esta alteração permite que qualquer usuário autenticado possa visualizar o log de auditoria

-- Primeiro, listar as políticas atuais para a tabela 'presencas_audit_log'
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'presencas_audit_log';

-- Desativar temporariamente o RLS para a tabela presencas_audit_log
ALTER TABLE public.presencas_audit_log DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes para a tabela presencas_audit_log
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'presencas_audit_log' AND schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.presencas_audit_log', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- Criar política simplificada que permite acesso para qualquer usuário autenticado
-- Política para visualização - qualquer usuário autenticado pode visualizar o log de auditoria
CREATE POLICY "Usuários autenticados podem ver o log de auditoria"
  ON public.presencas_audit_log
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Política para inserção - qualquer usuário autenticado pode registrar no log de auditoria
CREATE POLICY "Usuários autenticados podem registrar no log de auditoria"
  ON public.presencas_audit_log
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Reativar RLS para a tabela presencas_audit_log
ALTER TABLE public.presencas_audit_log ENABLE ROW LEVEL SECURITY;

-- Garantir que o owner da tabela possa ignorar RLS
ALTER TABLE public.presencas_audit_log FORCE ROW LEVEL SECURITY;

-- Adicionar comentário explicativo na tabela
COMMENT ON TABLE public.presencas_audit_log IS 'Contém log de auditoria para alterações nas presenças. Qualquer usuário autenticado pode visualizar e inserir registros.';

-- Verificar as políticas após a simplificação
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'presencas_audit_log';
 