-- Script para atualizar todas as políticas RLS relevantes para permitir acesso total a usuários autenticados
-- Este script garante que todas as tabelas principais do aplicativo sigam a mesma política:
-- "Qualquer usuário autenticado tem acesso total a todos os dados"

-- Lista de tabelas principais que precisam de políticas consistentes
DO $$
DECLARE
    tables_to_fix TEXT[] := ARRAY[
        'perfis',
        'atletas',
        'treinos',
        'treinos_do_dia',
        'treinos_exercicios',
        'exercicios',
        'presencas',
        'avaliacoes',
        'eventos_qualificados'
    ];
    current_table TEXT;
BEGIN
    FOREACH current_table IN ARRAY tables_to_fix
    LOOP
        -- Verificar se a tabela existe
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = current_table) THEN
            -- Exibir mensagem informativa
            RAISE NOTICE 'Processando tabela: %', current_table;
            
            -- Desativar temporariamente o RLS para a tabela
            EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', current_table);
            
            -- Remover todas as políticas existentes para a tabela
            -- Usa PL/pgSQL para encontrar e remover dinamicamente todas as políticas
            EXECUTE format('
                DO $inner$
                DECLARE 
                    policy_rec RECORD;
                BEGIN
                    FOR policy_rec IN 
                        SELECT policyname 
                        FROM pg_policies 
                        WHERE tablename = %L AND schemaname = ''public''
                    LOOP
                        EXECUTE format(''DROP POLICY IF EXISTS %%I ON public.%I'', policy_rec.policyname);
                    END LOOP;
                END $inner$
            ', current_table, current_table);
            
            -- Criar novas políticas padronizadas para acesso total a usuários autenticados
            
            -- Política para SELECT
            EXECUTE format('
                CREATE POLICY "Permitir SELECT para autenticados" 
                ON public.%I 
                FOR SELECT 
                USING (auth.role() = ''authenticated'')
            ', current_table);
            
            -- Política para INSERT
            EXECUTE format('
                CREATE POLICY "Permitir INSERT para autenticados" 
                ON public.%I 
                FOR INSERT 
                WITH CHECK (auth.role() = ''authenticated'')
            ', current_table);
            
            -- Política para UPDATE
            EXECUTE format('
                CREATE POLICY "Permitir UPDATE para autenticados" 
                ON public.%I 
                FOR UPDATE 
                USING (auth.role() = ''authenticated'')
            ', current_table);
            
            -- Política para DELETE
            EXECUTE format('
                CREATE POLICY "Permitir DELETE para autenticados" 
                ON public.%I 
                FOR DELETE 
                USING (auth.role() = ''authenticated'')
            ', current_table);
            
            -- Reativar RLS para a tabela
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', current_table);
            
            -- Garantir que o owner da tabela possa ignorar RLS
            EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', current_table);
            
            -- Adicionar comentário explicativo na tabela
            EXECUTE format('
                COMMENT ON TABLE public.%I IS ''Qualquer usuário autenticado pode realizar TODAS as operações nesta tabela.''
            ', current_table);
        ELSE
            RAISE NOTICE 'Tabela % não existe, ignorando.', current_table;
        END IF;
    END LOOP;
END;
$$;

-- Verificar todas as políticas após a atualização
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
WHERE schemaname = 'public'
ORDER BY tablename, cmd; 