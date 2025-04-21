-- Script para adicionar as colunas 'observacoes' e 'origem' à tabela subjacente à view avaliacoes_exercicios
-- Execute este script no Supabase SQL Editor ou via psql

-- 1. Primeiro, vamos verificar a definição da view
DO $$
DECLARE
    view_def TEXT;
    base_table_name TEXT;
BEGIN
    -- Obter a definição da view
    SELECT view_definition INTO view_def
    FROM information_schema.views
    WHERE table_name = 'avaliacoes_exercicios'
    AND table_schema = 'public';
    
    RAISE NOTICE 'Definição da view avaliacoes_exercicios: %', view_def;
    
    -- Como não podemos automaticamente determinar a tabela base, vamos proceder de duas maneiras
END $$;

-- 2. Opção 1: Criar uma nova versão da view que inclui as novas colunas
-- Primeiro, vamos salvar o conteúdo original da view
CREATE OR REPLACE FUNCTION backup_avaliacoes_exercicios_view() RETURNS VOID AS $$
DECLARE
    view_def TEXT;
BEGIN
    -- Obter a definição da view
    SELECT view_definition INTO view_def
    FROM information_schema.views
    WHERE table_name = 'avaliacoes_exercicios'
    AND table_schema = 'public';
    
    -- Salvar a definição em uma tabela temporária para referência
    CREATE TABLE IF NOT EXISTS view_definitions_backup (
        view_name TEXT PRIMARY KEY,
        definition TEXT,
        backup_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Inserir ou atualizar a definição
    INSERT INTO view_definitions_backup (view_name, definition)
    VALUES ('avaliacoes_exercicios', view_def)
    ON CONFLICT (view_name) 
    DO UPDATE SET definition = EXCLUDED.definition, backup_date = CURRENT_TIMESTAMP;
    
    RAISE NOTICE 'Definição da view avaliacoes_exercicios salva com sucesso.';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao salvar definição da view: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

SELECT backup_avaliacoes_exercicios_view();

-- 3. Opção 2: Primeiro verificar todas as tabelas que possivelmente poderiam ser a base da view
DO $$
DECLARE
    table_rec RECORD;
BEGIN
    RAISE NOTICE 'Procurando tabelas candidatas que podem ser a base da view avaliacoes_exercicios:';
    
    FOR table_rec IN 
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name LIKE '%avaliac%'
    LOOP
        RAISE NOTICE 'Tabela candidata encontrada: %', table_rec.table_name;
    END LOOP;
END $$;

-- 4. Crie uma cópia da view com outro nome para preservar o comportamento atual
CREATE OR REPLACE VIEW avaliacoes_exercicios_original AS
SELECT * FROM avaliacoes_exercicios;

-- 5. Alterar a tabela base (assumindo que seja avaliacoes_fundamento)
-- Como não temos certeza absoluta, fazemos isso de forma condicional
DO $$
BEGIN
    -- Verificar se a tabela avaliacoes_fundamento existe
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'avaliacoes_fundamento'
        AND table_schema = 'public'
        AND table_type = 'BASE TABLE'
    ) THEN
        -- Verificar se as colunas já existem
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'avaliacoes_fundamento'
            AND column_name = 'observacoes'
            AND table_schema = 'public'
        ) THEN
            -- Adicionar coluna observacoes
            ALTER TABLE avaliacoes_fundamento
            ADD COLUMN observacoes TEXT;
            
            RAISE NOTICE 'Coluna observacoes adicionada à tabela avaliacoes_fundamento.';
        ELSE
            RAISE NOTICE 'A coluna observacoes já existe na tabela avaliacoes_fundamento.';
        END IF;
        
        -- Verificar se a coluna origem já existe
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'avaliacoes_fundamento'
            AND column_name = 'origem'
            AND table_schema = 'public'
        ) THEN
            -- Adicionar coluna origem
            ALTER TABLE avaliacoes_fundamento
            ADD COLUMN origem VARCHAR(50);
            
            RAISE NOTICE 'Coluna origem adicionada à tabela avaliacoes_fundamento.';
        ELSE
            RAISE NOTICE 'A coluna origem já existe na tabela avaliacoes_fundamento.';
        END IF;
        
        -- Comentários nas colunas para documentação
        COMMENT ON COLUMN avaliacoes_fundamento.observacoes IS 'Observações adicionais sobre a avaliação';
        COMMENT ON COLUMN avaliacoes_fundamento.origem IS 'Origem da avaliação (ex: avaliacao_exercicio, avaliacao_pos_treino)';
    ELSE
        RAISE NOTICE 'A tabela avaliacoes_fundamento não foi encontrada. Verifique manualmente qual é a tabela base.';
    END IF;
END $$;

-- 6. Reconstituir a view para incluir as novas colunas (isto depende da definição original)
-- Essa é uma operação delicada que pode requerer ajustes manuais com base na definição exata
-- da view original. O código abaixo é um exemplo que precisa ser adaptado.

DO $$
DECLARE
    view_def TEXT;
    new_view_definition TEXT;
BEGIN
    -- Obter a definição original
    SELECT definition INTO view_def
    FROM view_definitions_backup
    WHERE view_name = 'avaliacoes_exercicios';
    
    IF view_def IS NULL THEN
        RAISE NOTICE 'Não foi possível obter a definição original da view. A recriação deve ser feita manualmente.';
        RETURN;
    END IF;
    
    -- IMPORTANTE: Esta parte pode precisar de ajustes manuais dependendo da estrutura da view original
    -- Este é apenas um exemplo de como poderia ser feito
    
    -- Vamos assumir um formato comum: SELECT col1, col2, ... FROM tabela
    -- e adicionar as novas colunas
    IF view_def LIKE 'SELECT %' THEN
        -- Ponto onde terminam as colunas e começa o FROM
        DECLARE
            from_position INT;
        BEGIN
            from_position := position(' FROM ' in upper(view_def));
            
            IF from_position > 0 THEN
                new_view_definition := substring(view_def from 1 for from_position) 
                                    || ', observacoes, origem' 
                                    || substring(view_def from from_position);
                
                -- Tentar recriar a view com as novas colunas
                BEGIN
                    EXECUTE 'CREATE OR REPLACE VIEW avaliacoes_exercicios AS ' || new_view_definition;
                    RAISE NOTICE 'View avaliacoes_exercicios recriada com sucesso incluindo as novas colunas.';
                EXCEPTION
                    WHEN OTHERS THEN
                        RAISE NOTICE 'Erro ao recriar a view: %', SQLERRM;
                        RAISE NOTICE 'A recriação da view deve ser feita manualmente.';
                END;
            ELSE
                RAISE NOTICE 'Formato de view não reconhecido. A recriação deve ser feita manualmente.';
            END IF;
        END;
    ELSE
        RAISE NOTICE 'Formato de view não reconhecido. A recriação deve ser feita manualmente.';
    END IF;
END $$;

-- Instrução de backup que deve ser executada se tudo o acima falhar
-- DROP VIEW IF EXISTS avaliacoes_exercicios_with_observacoes;
-- CREATE VIEW avaliacoes_exercicios_with_observacoes AS
-- SELECT a.*, NULL::TEXT AS observacoes, NULL::VARCHAR(50) AS origem
-- FROM avaliacoes_exercicios_original a;

-- NOTA IMPORTANTE: Este script é uma tentativa de correção automática.
-- Se encontrar erros, você pode precisar adaptar manualmente as etapas
-- com base nas mensagens de erro e na estrutura específica do seu banco de dados. 