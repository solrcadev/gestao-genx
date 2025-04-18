-- Script para corrigir as restrições da tabela avaliacoes_exercicios
-- Este script ajuda a resolver erros de chave estrangeira

-- 1. Verificar a estrutura atual da tabela
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns
WHERE table_name = 'avaliacoes_exercicios';

-- 2. Verificar as restrições atuais (foreign keys)
SELECT
  tc.table_schema, 
  tc.constraint_name, 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_schema AS foreign_table_schema,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema 
  JOIN information_schema.constraint_column_usage AS ccu 
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='avaliacoes_exercicios';

-- 3. OPÇÃO 1: Dropar a restrição de chave estrangeira problemática (use com cautela)
-- Este comando remove a restrição que impede salvar avaliações
ALTER TABLE avaliacoes_exercicios 
DROP CONSTRAINT IF EXISTS avaliacoes_exercicios_exercicio_id_fkey;

-- 4. OPÇÃO 2: Modificar a restrição para permitir DELETE CASCADE
-- Primeiro remover a restrição atual
ALTER TABLE avaliacoes_exercicios 
DROP CONSTRAINT IF EXISTS avaliacoes_exercicios_exercicio_id_fkey;

-- Depois adicionar a nova restrição com ON DELETE CASCADE
ALTER TABLE avaliacoes_exercicios
ADD CONSTRAINT avaliacoes_exercicios_exercicio_id_fkey
FOREIGN KEY (exercicio_id)
REFERENCES exercicios(id)
ON DELETE CASCADE;

-- 5. OPÇÃO 3: Modificar a estrutura da tabela para aceitar NULL no exercicio_id
-- Apenas se realmente necessário
ALTER TABLE avaliacoes_exercicios 
ALTER COLUMN exercicio_id DROP NOT NULL;

-- 6. Verificar dados que não têm correspondência na tabela exercicios
-- Isso ajuda a identificar dados problemáticos
SELECT 
  ae.id,
  ae.exercicio_id,
  ae.atleta_id,
  ae.fundamento 
FROM 
  avaliacoes_exercicios ae
LEFT JOIN
  exercicios e ON ae.exercicio_id = e.id
WHERE
  e.id IS NULL;

-- 7. Primeiro verificar se a coluna nota existe
DO $$
DECLARE
  nota_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'avaliacoes_exercicios' AND column_name = 'nota'
  ) INTO nota_exists;

  IF nota_exists THEN
    -- Se a coluna nota existe, criar a view com COALESCE
    EXECUTE '
      CREATE OR REPLACE VIEW vw_avaliacoes AS
      SELECT 
        ae.id,
        ae.atleta_id,
        a.nome as atleta_nome,
        ae.fundamento,
        ae.acertos,
        ae.erros,
        COALESCE(ae.nota, ae.acertos) as nota_calculada,
        ae.timestamp
      FROM 
        avaliacoes_exercicios ae
      LEFT JOIN
        athletes a ON ae.atleta_id = a.id
    ';
  ELSE
    -- Se a coluna nota não existe, criar a view sem usar COALESCE
    EXECUTE '
      CREATE OR REPLACE VIEW vw_avaliacoes AS
      SELECT 
        ae.id,
        ae.atleta_id,
        a.nome as atleta_nome,
        ae.fundamento,
        ae.acertos,
        ae.erros,
        ae.acertos as nota_calculada,
        ae.timestamp
      FROM 
        avaliacoes_exercicios ae
      LEFT JOIN
        athletes a ON ae.atleta_id = a.id
    ';
  END IF;
END $$; 