-- attendance_system_improvements.sql
-- Migration to improve the attendance tracking system with justification types and effort indexing

-- 1. Check if justificativa_tipo column exists in treinos_presencas, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'treinos_presencas' AND column_name = 'justificativa_tipo'
    ) THEN
        ALTER TABLE treinos_presencas 
        ADD COLUMN justificativa_tipo text;
        
        -- Set default values for existing records 
        UPDATE treinos_presencas
        SET justificativa_tipo = 'sem_justificativa'
        WHERE presente = false AND (justificativa_tipo IS NULL OR justificativa_tipo = '');
    END IF;
END $$;

-- 2. Add indice_esforco column to athletes table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'athletes' AND column_name = 'indice_esforco'
    ) THEN
        ALTER TABLE athletes 
        ADD COLUMN indice_esforco numeric DEFAULT 0;
    END IF;
END $$;

-- 3. Create function to calculate effort index based on attendance records
CREATE OR REPLACE FUNCTION calcular_indice_esforco(atleta_id uuid) 
RETURNS numeric AS $$
DECLARE
    total_treinos numeric := 0;
    soma_pesos numeric := 0;
    indice numeric := 0;
    peso numeric := 0;
    reg RECORD;
BEGIN
    -- Count total trainings this athlete should have attended
    SELECT COUNT(*) INTO total_treinos
    FROM treinos_do_dia tdd
    JOIN treinos t ON t.id = tdd.treino_id
    WHERE t.time = (SELECT time FROM athletes WHERE id = atleta_id);
    
    -- If no trainings, return 0
    IF total_treinos = 0 THEN
        RETURN 0;
    END IF;
    
    -- Get all attendance records
    FOR reg IN (
        SELECT presente, justificativa_tipo
        FROM treinos_presencas
        WHERE atleta_id = atleta_id
    )
    LOOP
        -- Calculate weight based on attendance type
        IF reg.presente THEN
            peso := 1.0; -- Present
        ELSE
            -- Apply weight based on justification type
            CASE reg.justificativa_tipo
                WHEN 'motivo_saude' THEN peso := 0.8;
                WHEN 'motivo_academico' THEN peso := 0.7;
                WHEN 'motivo_logistico' THEN peso := 0.5;
                WHEN 'motivo_pessoal' THEN peso := 0.3;
                ELSE peso := 0.0; -- No justification or unknown
            END CASE;
        END IF;
        
        soma_pesos := soma_pesos + peso;
    END LOOP;
    
    -- Calculate effort index (average)
    indice := soma_pesos / total_treinos;
    
    -- Ensure it's between 0 and 1
    RETURN GREATEST(0, LEAST(1, indice));
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger to update effort index when attendance records change
CREATE OR REPLACE FUNCTION atualizar_indice_esforco()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the athlete's effort index
    UPDATE athletes
    SET indice_esforco = calcular_indice_esforco(NEW.atleta_id)
    WHERE id = NEW.atleta_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger if it doesn't exist
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
    END IF;
END $$;

-- 6. Create enum type for justification types if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'justificativa_tipo_enum'
    ) THEN
        CREATE TYPE justificativa_tipo_enum AS ENUM (
            'sem_justificativa',
            'motivo_pessoal',
            'motivo_academico',
            'motivo_logistico',
            'motivo_saude'
        );
        
        -- We won't convert the column immediately as it might require more complex migration
        -- with existing data. We'll keep using the text type for now.
    END IF;
END $$;

-- 7. Create or update view for attendance summary
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

-- 8. Create or update view for detailed attendance history
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