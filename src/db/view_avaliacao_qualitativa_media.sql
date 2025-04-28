-- View de médias ponderadas das avaliações qualitativas por atleta e fundamento
CREATE OR REPLACE VIEW public.vw_avaliacao_qualitativa_media AS
WITH dados_agrupados AS (
  SELECT
    atleta_id,
    fundamento,
    -- Usar COALESCE para garantir que não há NULL
    AVG(COALESCE(peso, 0)) as media_peso,
    COUNT(*) as total_avaliacoes,
    SUM(CASE WHEN peso > 0 THEN 1 ELSE 0 END) as avaliacoes_positivas,
    SUM(CASE WHEN peso < 0 THEN 1 ELSE 0 END) as avaliacoes_negativas,
    MAX(timestamp) as ultima_avaliacao
  FROM
    public.avaliacoes_eventos_qualificados
  WHERE
    -- Ignorar avaliações sem fundamento ou com atleta_id inválido
    fundamento IS NOT NULL AND
    atleta_id IS NOT NULL
  GROUP BY
    atleta_id, fundamento
)

SELECT
  a.id as atleta_id,
  a.nome as atleta_nome,
  a.time,
  d.fundamento,
  d.media_peso,
  d.total_avaliacoes,
  d.avaliacoes_positivas,
  d.avaliacoes_negativas,
  d.ultima_avaliacao,
  -- Classificação mais detalhada
  CASE
    WHEN d.media_peso >= 2.5 THEN 'Excelente'
    WHEN d.media_peso >= 1.5 THEN 'Muito Bom'
    WHEN d.media_peso >= 0.5 THEN 'Bom'
    WHEN d.media_peso >= -0.5 THEN 'Regular'
    WHEN d.media_peso >= -1.5 THEN 'Ruim'
    ELSE 'Muito Ruim'
  END as avaliacao_qualitativa,
  -- Normalização para escala percentual (0-100)
  -- Considerando que os pesos variam de -2.0 a 3.0 (amplitude de 5.0)
  -- Fórmula: ((Peso + 2.0) / 5.0) * 100
  -- Garantir que resultado está entre 0 e 100
  GREATEST(
    LEAST(
      ((COALESCE(d.media_peso, 0) + 2.0) / 5.0) * 100, 
      100
    ), 
    0
  ) as nota_percentual
FROM
  dados_agrupados d
JOIN
  public.athletes a ON d.atleta_id = a.id; 