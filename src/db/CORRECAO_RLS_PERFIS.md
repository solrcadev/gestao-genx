# Correção para Erro de Recursão Infinita nas Políticas RLS da Tabela "perfis"

## Problema

O erro "infinite recursion detected in policy for relation \"perfis\"" ocorre quando uma política de segurança de linha (RLS) no PostgreSQL está em um loop recursivo. Isso acontece quando:

1. Uma política RLS faz referência à própria tabela que está tentando proteger, ou
2. Existe uma cadeia de políticas interdependentes que formam um ciclo.

## Solução

Foram criados três scripts SQL para resolver este problema:

1. `fix_rls_perfis.sql` - Primeira abordagem de correção, sem usar funções auxiliares
2. `fix_rls_perfis_alternativo.sql` - Abordagem alternativa, usando uma função SECURITY DEFINER
3. `test_rls_perfis.sql` - Script para testar se as correções foram aplicadas com sucesso

## Como aplicar a correção

### 1. Prepare um backup das políticas atuais

Antes de aplicar qualquer correção, execute o seguinte comando para documentar as políticas atuais:

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'perfis';
```

Salve o resultado para referência futura.

### 2. Aplique a primeira solução

1. Faça login no Supabase Studio ou conecte-se ao banco de dados com um cliente SQL
2. Abra o SQL Editor
3. Cole o conteúdo do arquivo `fix_rls_perfis.sql`
4. Execute o script completo

### 3. Teste se o problema foi resolvido

1. Execute o script de teste `test_rls_perfis.sql` para verificar se as políticas estão funcionando
2. Teste o aplicativo para verificar se a funcionalidade "Gerenciar Presenças" agora exibe os dados corretamente

### 4. Se o problema persistir, aplique a solução alternativa

Se ainda ocorrerem problemas, siga estes passos:

1. Volte ao SQL Editor
2. Execute o script `fix_rls_perfis_alternativo.sql`
3. Execute novamente o script de teste `test_rls_perfis.sql`
4. Teste o aplicativo novamente

## Explicação técnica das soluções

### Primeira abordagem (`fix_rls_perfis.sql`)

Esta solução:
- Desativa temporariamente RLS na tabela 'perfis'
- Remove todas as políticas existentes
- Cria novas políticas que evitam recursão, separando claramente os casos de uso
- Utiliza consultas mais diretas e eficientes

### Abordagem alternativa (`fix_rls_perfis_alternativo.sql`)

Esta solução:
- Cria uma função auxiliar `get_user_role()` marcada como SECURITY DEFINER
- A função pode acessar a tabela 'perfis' sem passar pelas políticas RLS
- As políticas RLS utilizam a função auxiliar em vez de consultar diretamente a tabela

## Verificação de diagnóstico

Se você continuar enfrentando problemas, execute o comando EXPLAIN ANALYZE para analisar como o plano de execução está sendo afetado pelas políticas RLS:

```sql
EXPLAIN ANALYZE
SELECT * 
FROM public.perfis 
WHERE user_id = auth.uid() 
LIMIT 1;
```

Isto mostrará o plano de execução da consulta e pode ajudar a identificar onde ocorre a recursão.

## Notas adicionais

- Estas correções preservam as mesmas regras de acesso que existiam anteriormente, apenas reorganizando como são implementadas
- A abordagem alternativa com a função SECURITY DEFINER é mais robusta, mas introduz uma função adicional ao banco de dados
- Depois de aplicar as correções, monitore o desempenho das consultas que acessam a tabela 'perfis' 