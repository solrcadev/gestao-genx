-- Script para tornar o campo exercicio_id da tabela avaliacoes_fundamento nullable
-- Este script permite que avaliacoes sem exercicio especifico (como avaliacoes pos-treino) sejam salvas

-- 1. Verificar se a coluna exercicio_id existe e se tem restricao NOT NULL
DO $$
DECLARE
  column_not_null BOOLEAN;
BEGIN
  -- Verificar se a coluna tem restricao NOT NULL
  SELECT is_nullable = 'NO' INTO column_not_null
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'avaliacoes_fundamento'
    AND column_name = 'exercicio_id';

  -- Exibir informacao sobre o estado atual da coluna
  IF column_not_null THEN
    RAISE NOTICE 'A coluna exercicio_id possui restricao NOT NULL e sera modificada';
  ELSE
    RAISE NOTICE 'A coluna exercicio_id ja permite NULL, nenhuma alteracao necessaria';
  END IF;
END $$;

-- 2. Alterar a coluna para permitir valores NULL
ALTER TABLE avaliacoes_fundamento
ALTER COLUMN exercicio_id DROP NOT NULL;

-- 3. Verificar o resultado da operacao
DO $$
DECLARE
  column_nullable BOOLEAN;
BEGIN
  -- Verificar se a coluna agora permite NULL
  SELECT is_nullable = 'YES' INTO column_nullable
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'avaliacoes_fundamento'
    AND column_name = 'exercicio_id';

  -- Exibir resultado da operacao
  IF column_nullable THEN
    RAISE NOTICE 'Operacao concluida com sucesso! A coluna exercicio_id agora permite valores NULL';
  ELSE
    RAISE NOTICE 'Erro: A coluna exercicio_id ainda nao permite valores NULL';
  END IF;
END $$;

-- 4. Adicionar um indice para melhorar performance em consultas
-- que filtram por exercicio_id
CREATE INDEX IF NOT EXISTS idx_avaliacoes_fundamento_exercicio_id 
ON avaliacoes_fundamento(exercicio_id)
WHERE exercicio_id IS NOT NULL;

-- NOTA IMPORTANTE:
-- Depois de executar este script, as avaliacoes pos-treino poderao ser salvas com exercicio_id = NULL
-- Lembre-se de adaptar suas consultas SQL para lidar com valores NULL nessa coluna quando apropriado 