# Instruções para Corrigir o Erro de Avaliações no Supabase

O erro `Key is not present in table "exercicios"` ocorre porque a tabela `avaliacoes_exercicios` tem uma restrição de chave estrangeira que requer que o `exercicio_id` exista na tabela `exercicios`.

## Como Corrigir

1. Acesse o dashboard do Supabase do seu projeto
2. Vá para a seção "SQL Editor"
3. Cole o conteúdo do arquivo `sql/fix_avaliacoes_constraints.sql`
4. Execute o script

## Solução para Erro "column ae.nota does not exist"

Se você receber o erro `column ae.nota does not exist`, significa que sua tabela `avaliacoes_exercicios` não tem a coluna `nota`. O script atualizado verifica automaticamente se essa coluna existe antes de criar a view.

A solução está implementada utilizando blocos PL/pgSQL que detectam a estrutura da tabela e criam a view apropriada.

## Explicação das Opções

O script oferece três opções para resolver o problema:

### Opção 1: Remover a Restrição
```sql
ALTER TABLE avaliacoes_exercicios 
DROP CONSTRAINT IF EXISTS avaliacoes_exercicios_exercicio_id_fkey;
```
Esta é a solução mais simples, mas remove a integridade referencial.

### Opção 2: Modificar para ON DELETE CASCADE
```sql
ALTER TABLE avaliacoes_exercicios 
DROP CONSTRAINT IF EXISTS avaliacoes_exercicios_exercicio_id_fkey;

ALTER TABLE avaliacoes_exercicios
ADD CONSTRAINT avaliacoes_exercicios_exercicio_id_fkey
FOREIGN KEY (exercicio_id)
REFERENCES exercicios(id)
ON DELETE CASCADE;
```
Esta opção mantém a integridade referencial, mas remove automaticamente as avaliações quando um exercício é removido.

### Opção 3: Permitir NULL
```sql
ALTER TABLE avaliacoes_exercicios 
ALTER COLUMN exercicio_id DROP NOT NULL;
```
Esta opção permite que avaliações sejam salvas sem um exercício associado.

## Recomendação

Recomendamos a **Opção 2** se você deseja manter a integridade dos dados. Isso significa que as avaliações serão automaticamente removidas quando um exercício for excluído.

Se preferir manter todas as avaliações mesmo após a exclusão de exercícios, use a **Opção 3**.

## Verificação

Após executar o script, teste a funcionalidade de avaliação para garantir que os acertos e erros estão sendo registrados corretamente. O código do aplicativo foi atualizado para lidar melhor com possíveis problemas, mas a correção da estrutura do banco de dados é a solução mais adequada. 