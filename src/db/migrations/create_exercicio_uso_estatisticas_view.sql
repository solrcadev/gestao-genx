-- View para calcular estatísticas de uso dos exercícios
-- Esta view calcular a contagem de uso e a data da última utilização de cada exercício

CREATE OR REPLACE VIEW public.exercicio_uso_estatisticas AS
SELECT
    e.id AS exercicio_id,
    COALESCE(COUNT(te.exercicio_id), 0) AS contagem_uso,
    MAX(t.data) AS ultima_vez_usado
FROM
    public.exercicios e
LEFT JOIN
    public.treinos_exercicios te ON e.id = te.exercicio_id
LEFT JOIN
    public.treinos t ON te.treino_id = t.id
GROUP BY
    e.id;

-- Comentário da View
COMMENT ON VIEW public.exercicio_uso_estatisticas IS 'Estatísticas de uso de exercícios, incluindo contagem de uso e data da última utilização';

-- Instruções para execução no Supabase:
-- 1. Abra o dashboard do Supabase > SQL Editor
-- 2. Cole este script e execute
-- 3. A view será criada e poderá ser consultada através do Supabase API 