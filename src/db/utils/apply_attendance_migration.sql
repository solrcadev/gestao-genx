-- Script para aplicar migrações do sistema de presença e índice de esforço

-- 1. Verificar se a coluna justificativa_tipo existe na tabela treinos_presencas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'treinos_presencas' 
        AND column_name = 'justificativa_tipo'
    ) THEN
        ALTER TABLE treinos_presencas 
        ADD COLUMN justificativa_tipo text;
        
        -- Definir valores padrão para registros existentes
        UPDATE treinos_presencas
        SET justificativa_tipo = 'sem_justificativa'
        WHERE presente = false 
        AND (justificativa_tipo IS NULL OR justificativa_tipo = '');
        
        RAISE NOTICE 'Coluna justificativa_tipo adicionada à tabela treinos_presencas';
    ELSE
        RAISE NOTICE 'Coluna justificativa_tipo já existe na tabela treinos_presencas';
    END IF;
END $$;

-- 2. Verificar se a coluna indice_esforco existe na tabela athletes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'athletes' 
        AND column_name = 'indice_esforco'
    ) THEN
        ALTER TABLE athletes 
        ADD COLUMN indice_esforco numeric DEFAULT 0;
        
        RAISE NOTICE 'Coluna indice_esforco adicionada à tabela athletes';
    ELSE
        RAISE NOTICE 'Coluna indice_esforco já existe na tabela athletes';
    END IF;
END $$;

-- 3. Remover a função calcular_indice_esforco se existir para evitar erro 42P13
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'calcular_indice_esforco' 
        AND pronargs = 1
    ) THEN
        DROP FUNCTION calcular_indice_esforco(uuid);
        RAISE NOTICE 'Função calcular_indice_esforco removida';
    END IF;
END $$;

-- Criar função para calcular o índice de esforço
CREATE OR REPLACE FUNCTION calcular_indice_esforco(p_atleta_id uuid) 
RETURNS numeric AS $$
DECLARE
    total_treinos numeric := 0;
    soma_pesos numeric := 0;
    indice numeric := 0;
    peso numeric := 0;
    reg RECORD;
BEGIN
    -- Contar total de treinos que o atleta deveria ter participado
    SELECT COUNT(*) INTO total_treinos
    FROM treinos_do_dia tdd
    JOIN treinos t ON t.id = tdd.treino_id
    WHERE t.time = (SELECT time FROM athletes WHERE id = p_atleta_id);
    
    -- Se não há treinos, retornar 0
    IF total_treinos = 0 THEN
        RETURN 0;
    END IF;
    
    -- Obter todos os registros de presença
    FOR reg IN (
        SELECT tp.presente, tp.justificativa_tipo
        FROM treinos_presencas tp
        JOIN treinos_do_dia tdd ON tp.treino_do_dia_id = tdd.id
        JOIN treinos t ON tdd.treino_id = t.id
        WHERE tp.atleta_id = p_atleta_id
    )
    LOOP
        -- Calcular peso com base no tipo de presença
        IF reg.presente THEN
            peso := 1.0; -- Presente
        ELSE
            -- Aplicar peso com base no tipo de justificativa
            CASE reg.justificativa_tipo
                WHEN 'motivo_saude' THEN peso := 0.8;
                WHEN 'motivo_academico' THEN peso := 0.7;
                WHEN 'motivo_logistico' THEN peso := 0.5;
                WHEN 'motivo_pessoal' THEN peso := 0.3;
                ELSE peso := 0.0; -- Sem justificativa ou desconhecido
            END CASE;
        END IF;
        
        soma_pesos := soma_pesos + peso;
    END LOOP;
    
    -- Calcular índice de esforço (média)
    indice := soma_pesos / total_treinos;
    
    -- Garantir que está entre 0 e 1
    RETURN GREATEST(0, LEAST(1, indice));
END;
$$ LANGUAGE plpgsql;

-- 4. Remover a função atualizar_indice_esforco se existir
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'atualizar_indice_esforco'
    ) THEN
        DROP FUNCTION atualizar_indice_esforco() CASCADE;
        RAISE NOTICE 'Função atualizar_indice_esforco removida';
    END IF;
END $$;

-- Criar função para atualizar o índice de esforço
CREATE OR REPLACE FUNCTION atualizar_indice_esforco()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar o índice de esforço do atleta
    UPDATE athletes
    SET indice_esforco = calcular_indice_esforco(NEW.atleta_id)
    WHERE id = NEW.atleta_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Criar trigger se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'atualizar_indice_esforco_trigger'
    ) THEN
        CREATE TRIGGER atualizar_indice_esforco_trigger
        AFTER INSERT OR UPDATE OR DELETE ON treinos_presencas
        FOR EACH ROW
        EXECUTE FUNCTION atualizar_indice_esforco();
        
        RAISE NOTICE 'Trigger atualizar_indice_esforco_trigger criado';
    ELSE
        RAISE NOTICE 'Trigger atualizar_indice_esforco_trigger já existe';
    END IF;
END $$;

-- 6. Remover a função refresh_effort_indices se existir
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'refresh_effort_indices'
    ) THEN
        DROP FUNCTION refresh_effort_indices();
        RAISE NOTICE 'Função refresh_effort_indices removida';
    END IF;
END $$;

-- Criar função para recalcular todos os índices de esforço
CREATE OR REPLACE FUNCTION refresh_effort_indices()
RETURNS void AS $$
DECLARE
    atleta_rec RECORD;
BEGIN
    FOR atleta_rec IN SELECT id FROM athletes
    LOOP
        UPDATE athletes
        SET indice_esforco = calcular_indice_esforco(atleta_rec.id)
        WHERE id = atleta_rec.id;
    END LOOP;
    
    RAISE NOTICE 'Todos os índices de esforço foram recalculados';
END;
$$ LANGUAGE plpgsql;

-- 7. Criar ou atualizar visão para resumo de presença
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_views 
        WHERE viewname = 'atleta_presenca_resumo'
    ) THEN
        DROP VIEW atleta_presenca_resumo;
        RAISE NOTICE 'Visão atleta_presenca_resumo removida para recriação';
    END IF;
END $$;

CREATE OR REPLACE VIEW atleta_presenca_resumo AS
SELECT 
    a.id,
    a.nome,
    a.time,
    a.posicao,
    a.foto_url,
    a.indice_esforco,
    COUNT(tp.id) AS total_treinos,
    SUM(CASE WHEN tp.presente THEN 1 ELSE 0 END) AS total_presencas,
    SUM(CASE WHEN NOT tp.presente THEN 1 ELSE 0 END) AS total_ausencias,
    SUM(CASE WHEN NOT tp.presente AND tp.justificativa_tipo = 'sem_justificativa' THEN 1 ELSE 0 END) AS faltas_sem_justificativa,
    SUM(CASE WHEN NOT tp.presente AND tp.justificativa_tipo != 'sem_justificativa' THEN 1 ELSE 0 END) AS faltas_justificadas
FROM 
    athletes a
LEFT JOIN 
    treinos_presencas tp ON a.id = tp.atleta_id
GROUP BY 
    a.id, a.nome, a.time, a.posicao, a.foto_url, a.indice_esforco;

-- 8. Criar ou atualizar visão para histórico detalhado
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_views 
        WHERE viewname = 'atleta_presenca_detalhada'
    ) THEN
        DROP VIEW atleta_presenca_detalhada;
        RAISE NOTICE 'Visão atleta_presenca_detalhada removida para recriação';
    END IF;
END $$;

CREATE OR REPLACE VIEW atleta_presenca_detalhada AS
SELECT 
    tp.id,
    tp.atleta_id,
    a.nome AS atleta_nome,
    a.time,
    tp.treino_do_dia_id,
    tdd.data AS data_treino,
    tr.nome AS treino_nome,
    tp.presente,
    tp.justificativa,
    tp.justificativa_tipo,
    CASE 
        WHEN tp.presente THEN 1.0
        WHEN tp.justificativa_tipo = 'motivo_saude' THEN 0.8
        WHEN tp.justificativa_tipo = 'motivo_academico' THEN 0.7
        WHEN tp.justificativa_tipo = 'motivo_logistico' THEN 0.5
        WHEN tp.justificativa_tipo = 'motivo_pessoal' THEN 0.3
        ELSE 0.0
    END AS peso_aplicado
FROM 
    treinos_presencas tp
JOIN 
    athletes a ON tp.atleta_id = a.id
JOIN 
    treinos_do_dia tdd ON tp.treino_do_dia_id = tdd.id
JOIN 
    treinos tr ON tdd.treino_id = tr.id
ORDER BY 
    tdd.data DESC, a.nome;

-- 9. Recalcular todos os índices de esforço
SELECT refresh_effort_indices();

-- 10. Confirmar finalizacao
DO $$
BEGIN
    RAISE NOTICE 'Migração do sistema de presença e índice de esforço concluída com sucesso!';
END $$; 