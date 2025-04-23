# Instruções para Atualização do Banco de Dados

Este diretório contém scripts SQL para realizar atualizações no esquema do banco de dados Supabase.

## Tabela de Atas de Reunião

O script `criar_tabela_atas_reuniao.sql` cria uma tabela para armazenar atas de reunião da equipe técnica.

A tabela possui os seguintes campos:
- `id`: Identificador único da ata (UUID)
- `titulo`: Título da reunião
- `data`: Data em que a reunião ocorreu
- `participantes`: Array de texto com os nomes dos participantes
- `topicos`: Array JSON com os tópicos discutidos
- `decisoes`: Array JSON com as decisões tomadas
- `created_at`: Data e hora de criação do registro
- `updated_at`: Data e hora da última atualização do registro

### Como aplicar o script

#### Opção 1: Via Supabase Studio

1. Acesse o painel de controle do Supabase para o seu projeto
2. Navegue até "SQL Editor" no menu lateral
3. Crie um "New Query"
4. Copie e cole o conteúdo do arquivo `criar_tabela_atas_reuniao.sql`
5. Clique em "Run" para executar o script

#### Opção 2: Via CLI do Supabase

Se você tem o CLI do Supabase instalado e configurado:

```bash
# Navegue até a pasta do script
cd src/db

# Execute o script (substitua PROJECT_ID pelo ID do seu projeto Supabase)
supabase db push -d criar_tabela_atas_reuniao.sql --project-ref PROJECT_ID
```

#### Opção 3: Via Código

O script cria uma função RPC `criar_tabela_atas_reuniao()` que pode ser chamada a partir do código para criar a tabela caso ela não exista. Esta função está disponível no serviço `atasReuniaoService.ts` através do método `verificarECriarTabelaAtas()`.

### Estrutura da Tabela

A tabela implementa Row Level Security (RLS) com políticas que permitem operações CRUD para usuários autenticados. Também inclui um trigger para atualizar automaticamente o campo `updated_at` sempre que um registro for modificado.

## Adicionando Colunas para a Funcionalidade "Avaliação Pós-Treino"

**Nota Importante**: Descobrimos que `avaliacoes_exercicios` é uma VIEW e não uma tabela física. Isso exige uma abordagem diferente para adicionar novos campos.

O script `add_observacoes_column.sql` foi atualizado para:

1. Identificar a estrutura da view `avaliacoes_exercicios` 
2. Localizar e modificar a tabela base (provavelmente `avaliacoes_fundamento`)
3. Recriar a view para incluir as novas colunas

As colunas a serem adicionadas são:
- `observacoes`: Campo de texto para armazenar observações adicionais sobre a avaliação
- `origem`: Campo para identificar se a avaliação veio de um exercício normal ou da avaliação pós-treino

### Como aplicar o script

#### Opção 1: Via Supabase Studio

1. Acesse o painel de controle do Supabase para o seu projeto
2. Navegue até "SQL Editor" no menu lateral
3. Crie um "New Query"
4. Copie e cole o conteúdo do arquivo `add_observacoes_column.sql`
5. Clique em "Run" para executar o script
6. **Importante**: Leia as mensagens exibidas após a execução. Elas fornecerão informações sobre:
   - A definição atual da view
   - As tabelas candidatas que podem ser a base da view
   - Se foi possível adicionar as colunas à tabela base
   - Se foi possível recriar a view com as novas colunas

#### Opção 2: Via CLI do Supabase

Se você tem o CLI do Supabase instalado e configurado:

```bash
# Navegue até a pasta do script
cd src/db

# Execute o script (substitua PROJECT_ID pelo ID do seu projeto Supabase)
supabase db push -d add_observacoes_column.sql --project-ref PROJECT_ID
```

### Verificação

Após aplicar o script, você pode verificar se as colunas foram adicionadas corretamente:

1. No Supabase Studio, vá para "SQL Editor"
2. Execute a seguinte consulta para verificar a tabela base:
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'avaliacoes_fundamento'
   AND table_schema = 'public'
   ORDER BY ordinal_position;
   ```

3. Execute a seguinte consulta para verificar a view:
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'avaliacoes_exercicios'
   AND table_schema = 'public'
   ORDER BY ordinal_position;
   ```

## Solução Alternativa

Se o script automático não funcionar, você pode precisar realizar os seguintes passos manualmente:

1. Determinar a tabela base da view:
   ```sql
   SELECT pg_get_viewdef('avaliacoes_exercicios'::regclass, true);
   ```

2. Identificar a tabela base no SQL retornado

3. Adicionar as colunas à tabela base:
   ```sql
   ALTER TABLE <tabela_base> ADD COLUMN observacoes TEXT;
   ALTER TABLE <tabela_base> ADD COLUMN origem VARCHAR(50);
   ```

4. Recriar a view para incluir as novas colunas:
   ```sql
   CREATE OR REPLACE VIEW avaliacoes_exercicios AS
   <definição original da view com as novas colunas adicionadas>;
   ```

## Observações Importantes

- Como estamos lidando com uma view, o processo é mais complexo que uma simples alteração de tabela
- O script realiza verificações e tenta adaptar-se automaticamente à estrutura do banco
- Em alguns casos, pode ser necessário realizar ajustes manuais com base nas mensagens exibidas
- Uma cópia da view original é criada como `avaliacoes_exercicios_original` para servir como backup

Se você encontrar qualquer problema ao aplicar o script, entre em contato com o desenvolvedor responsável pelo banco de dados. 