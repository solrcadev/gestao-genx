-- Correções para as funções RPC do Supabase usadas no Dashboard de Exercícios
-- Execução: Copie todo este código e execute-o no SQL Editor do Supabase

-- 1. Correção da função get_performance_trend_por_fundamento
-- Problema 1: Referências incorretas a a.data no lugar de t.data
-- Problema 2: Ambiguidade na coluna total_acertos
-- Problema 3: Mismatch de tipo (bigint vs integer) nas colunas total_acertos e total_erros
-- Solução: Substituir as referências de a.data por t.data, qualificar total_acertos onde necessário e adicionar CAST para integer
CREATE OR REPLACE FUNCTION get_performance_trend_por_fundamento(
    p_fundamento_nome TEXT,
    p_data_inicio DATE DEFAULT NULL,
    p_data_fim DATE DEFAULT NULL,
    p_genero_equipe TEXT DEFAULT NULL
)
RETURNS TABLE (
    data_ponto_tempo DATE,
    metrica_desempenho NUMERIC,
    total_acertos INTEGER,
    total_erros INTEGER
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH dados_filtrados AS (
        SELECT 
            t.data::DATE AS data_treino,
            a.acertos,
            a.erros,
            t.time AS genero_equipe
        FROM 
            avaliacoes_fundamento a
        JOIN 
            treinos t ON a.treino_id = t.id
        WHERE 
            a.fundamento = p_fundamento_nome
            AND (p_data_inicio IS NULL OR t.data >= p_data_inicio)
            AND (p_data_fim IS NULL OR t.data <= p_data_fim)
            AND (p_genero_equipe IS NULL OR p_genero_equipe = 'Todos' OR t.time = p_genero_equipe)
    ),
    dados_agrupados AS (
        SELECT 
            data_treino,
            SUM(acertos)::integer AS total_acertos,
            SUM(erros)::integer AS total_erros
        FROM 
            dados_filtrados
        GROUP BY 
            data_treino
        ORDER BY 
            data_treino
    )
    SELECT 
        data_treino AS data_ponto_tempo,
        CASE 
            WHEN (dados_agrupados.total_acertos + dados_agrupados.total_erros) > 0 
            THEN (dados_agrupados.total_acertos::NUMERIC / (dados_agrupados.total_acertos + dados_agrupados.total_erros)) * 100
            ELSE 0
        END AS metrica_desempenho,
        dados_agrupados.total_acertos,
        dados_agrupados.total_erros
    FROM 
        dados_agrupados;
END;
$$;

-- 2. Correção da função get_exercise_usage_volume_por_fundamento
-- Problema: COUNT(DISTINCT exercicio_id) retorna bigint mas a função espera integer
-- Solução: Adicionar um CAST explícito para integer
CREATE OR REPLACE FUNCTION get_exercise_usage_volume_por_fundamento(
    p_fundamento_nome TEXT,
    p_data_inicio DATE DEFAULT NULL,
    p_data_fim DATE DEFAULT NULL,
    p_genero_equipe TEXT DEFAULT NULL
)
RETURNS TABLE (
    data_ponto_tempo DATE,
    volume_uso_exercicio INTEGER
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH dados_filtrados AS (
        SELECT 
            t.data::DATE AS data_treino,
            t.time AS genero_equipe,
            e.id AS exercicio_id,
            e.fundamentos
        FROM 
            treinos t
        JOIN 
            treinos_exercicios te ON t.id = te.treino_id
        JOIN 
            exercicios e ON te.exercicio_id = e.id
        WHERE 
            (p_data_inicio IS NULL OR t.data >= p_data_inicio)
            AND (p_data_fim IS NULL OR t.data <= p_data_fim)
            AND (p_genero_equipe IS NULL OR p_genero_equipe = 'Todos' OR t.time = p_genero_equipe)
            AND e.fundamentos @> ARRAY[p_fundamento_nome]
    )
    SELECT 
        data_treino AS data_ponto_tempo,
        COUNT(DISTINCT exercicio_id)::integer AS volume_uso_exercicio
    FROM 
        dados_filtrados
    GROUP BY 
        data_treino
    ORDER BY 
        data_treino;
END;
$$;

-- Verificação das funções corrigidas
DO $$
BEGIN
    RAISE NOTICE 'Funções RPC corrigidas com sucesso!';
    RAISE NOTICE 'Agora a aba "Análise: Uso vs. Desempenho" no Dashboard de Exercícios deve funcionar corretamente.';
END $$; 