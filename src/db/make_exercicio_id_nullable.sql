-- Script para tornar o campo exercicio_id da tabela avaliacoes_fundamento nullable
-- Este script permite que avaliações sem exercício específico (como avaliações pós-treino) sejam salvas

-- 1. Verificar se a coluna exercicio_id existe e se tem restrição NOT NULL
DO $$
DECLARE
  column_not_null BOOLEAN;
BEGIN
  -- Verificar se a coluna tem restrição NOT NULL
  SELECT is_nullable = 'NO' INTO column_not_null
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'avaliacoes_fundamento'
    AND column_name = 'exercicio_id';

  -- Exibir informação sobre o estado atual da coluna
  IF column_not_null THEN
    RAISE NOTICE 'A coluna exercicio_id possui restrição NOT NULL e será modificada';
  ELSE
    RAISE NOTICE 'A coluna exercicio_id já permite NULL, nenhuma alteração necessária';
  END IF;
END $$;

-- 2. Alterar a coluna para permitir valores NULL
ALTER TABLE avaliacoes_fundamento
ALTER COLUMN exercicio_id DROP NOT NULL;

-- 3. Verificar o resultado da operação
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

  -- Exibir resultado da operação
  IF column_nullable THEN
    RAISE NOTICE 'Operação concluída com sucesso! A coluna exercicio_id agora permite valores NULL';
  ELSE
    RAISE NOTICE 'Erro: A coluna exercicio_id ainda não permite valores NULL';
  END IF;
END $$;

-- 4. Adicionar um índice para melhorar performance em consultas
-- que filtram por exercicio_id
CREATE INDEX IF NOT EXISTS idx_avaliacoes_fundamento_exercicio_id 
ON avaliacoes_fundamento(exercicio_id)
WHERE exercicio_id IS NOT NULL;

-- 5. Atualizar a view avaliacoes_exercicios se necessário
-- Se a view depender da coluna exercicio_id, verifique se ela ainda funciona corretamente
-- Caso haja problemas com a view, você pode precisar recriá-la

-- NOTA IMPORTANTE:
-- Depois de executar este script, as avaliações pós-treino poderão ser salvas com exercicio_id = NULL
-- Lembre-se de adaptar suas consultas SQL para lidar com valores NULL nessa coluna quando apropriado 