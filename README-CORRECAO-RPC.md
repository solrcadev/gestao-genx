# Correção das Funções RPC do Supabase

Este documento contém instruções detalhadas para corrigir os erros nas funções RPC do Supabase que estão causando problemas na aba "Análise: Uso vs. Desempenho" do Dashboard de Exercícios.

## Problemas Identificados

Foram identificados quatro problemas principais nas funções RPC do Supabase:

1. **Erro de tipo de dado na função `get_exercise_usage_volume_por_fundamento`**
   - Mensagem de erro: `Returned type bigint does not match expected type integer in column 2`
   - Causa: A função `COUNT(DISTINCT exercicio_id)` retorna um tipo `bigint`, mas a definição da função RPC espera um tipo `integer`.

2. **Erro de referência de coluna na função `get_performance_trend_por_fundamento`**
   - Mensagem de erro: `column a.data does not exist` (com a sugestão `Perhaps you meant to reference the column "t.data"`)
   - Causa: A query SQL dentro da função está usando a referência `a.data` para se referir à coluna de data, mas essa coluna não existe ou deveria ser referenciada como `t.data`.

3. **Erro de ambiguidade de coluna na função `get_performance_trend_por_fundamento`**
   - Mensagem de erro: `Error: column reference "total_acertos" is ambiguous`
   - Causa: A coluna `total_acertos` está sendo referenciada sem um qualificador adequado no cálculo da métrica de desempenho, quando existem múltiplas origens possíveis para esta coluna.

4. **Erro de tipo de dado nas colunas `total_acertos` e `total_erros` da função `get_performance_trend_por_fundamento`**
   - Mensagem de erro: `Returned type bigint does not match expected type integer in column 3`
   - Causa: As funções de agregação `SUM(acertos)` e `SUM(erros)` retornam valores do tipo `bigint`, mas a definição da função RPC espera valores do tipo `integer`.

## Soluções

### 1. Correção da função `get_exercise_usage_volume_por_fundamento`

Acesse o SQL Editor do Supabase e execute o seguinte código para corrigir o erro de tipo de dado:

```sql
-- Função RPC 2: get_exercise_usage_volume_por_fundamento (Correção)
-- Obtém o volume de uso de exercícios por fundamento em um período
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
```

**Alteração principal:** Adicionado `::integer` para converter o resultado do `COUNT(DISTINCT exercicio_id)` de `bigint` para `integer`.

### 2. Correção da função `get_performance_trend_por_fundamento`

Acesse o SQL Editor do Supabase e execute o seguinte código para corrigir os erros de referência de coluna, ambiguidade e tipo de dado:

```sql
-- Função RPC 1: get_performance_trend_por_fundamento (Correção)
-- Obtém a tendência de desempenho por fundamento em um período
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
```

**Alterações principais:**
1. Substituído `a.data::DATE AS data_treino` por `t.data::DATE AS data_treino` na CTE `dados_filtrados`.
2. Substituído `(p_data_inicio IS NULL OR a.data >= p_data_inicio)` por `(p_data_inicio IS NULL OR t.data >= p_data_inicio)`.
3. Substituído `(p_data_fim IS NULL OR a.data <= p_data_fim)` por `(p_data_fim IS NULL OR t.data <= p_data_fim)`.
4. Adicionado o qualificador `dados_agrupados.` antes de cada referência a `total_acertos` e `total_erros` na cláusula CASE para resolver a ambiguidade de coluna.
5. Adicionado CAST explícito `::integer` nas expressões `SUM(acertos)` e `SUM(erros)` para garantir que os tipos retornados correspondam aos tipos esperados na assinatura da função.

## Como Aplicar as Correções

1. Acesse o painel administrativo do Supabase para o seu projeto.
2. Navegue até a seção "SQL Editor" (ou "SQL").
3. Clique em "New Query" (ou "Nova Consulta").
4. Cole o código SQL da função `get_exercise_usage_volume_por_fundamento` corrigida e execute.
5. Crie uma nova consulta e cole o código SQL da função `get_performance_trend_por_fundamento` corrigida e execute.
6. Após aplicar as correções, teste a aba "Análise: Uso vs. Desempenho" no Dashboard de Exercícios para verificar se os erros foram resolvidos.

## Verificação

Após aplicar as correções, você deve:

1. Verificar se a aba "Análise: Uso vs. Desempenho" está carregando corretamente.
2. Garantir que ao selecionar um fundamento, os dados de correlação são exibidos sem erros no console.
3. Confirmar que os gráficos estão sendo renderizados corretamente.

Se ainda houver problemas após aplicar essas correções, verifique o console do navegador para possíveis erros adicionais. 