# Simplificação do Acesso a Dados de Presença

## Resumo das Alterações

Este documento descreve as alterações realizadas para simplificar as políticas de segurança (RLS) do Supabase, permitindo que qualquer usuário autenticado possa visualizar os dados de presença sem verificações adicionais de perfis.

## Tabelas Afetadas

As seguintes tabelas tiveram suas políticas de segurança simplificadas:

1. `perfis` - Tabela de perfis de usuários
2. `treinos_presencas` - Tabela de registros de presença
3. `presencas_audit_log` - Tabela de log de auditoria de presenças

## Scripts de Alteração

Foram criados três scripts SQL para implementar estas mudanças:

1. `simplificar_rls_perfis.sql` - Simplifica as políticas da tabela "perfis"
2. `simplificar_rls_presenças.sql` - Simplifica as políticas da tabela "treinos_presencas"
3. `simplificar_rls_auditoria.sql` - Simplifica as políticas da tabela "presencas_audit_log"

## Como Aplicar as Alterações

Siga estas etapas para aplicar as alterações no banco de dados:

### 1. Backup das Políticas Atuais

Antes de aplicar qualquer modificação, faça um backup das políticas atuais executando as seguintes consultas no SQL Editor do Supabase:

```sql
SELECT * FROM pg_policies WHERE tablename = 'perfis';
SELECT * FROM pg_policies WHERE tablename = 'treinos_presencas';
SELECT * FROM pg_policies WHERE tablename = 'presencas_audit_log';
```

Salve os resultados em um local seguro para referência futura.

### 2. Aplicar as Alterações

Execute os scripts na seguinte ordem:

1. Primeiro script: `simplificar_rls_perfis.sql`
2. Segundo script: `simplificar_rls_presenças.sql`
3. Terceiro script: `simplificar_rls_auditoria.sql`

Para cada script:
- Abra o SQL Editor no Supabase Studio
- Cole o conteúdo do script
- Execute-o completamente

### 3. Verificar as Alterações

Após aplicar os scripts, verifique se as políticas foram atualizadas corretamente:

```sql
SELECT * FROM pg_policies WHERE tablename IN ('perfis', 'treinos_presencas', 'presencas_audit_log');
```

As políticas resultantes devem permitir acesso a qualquer usuário autenticado.

### 4. Testar a Funcionalidade

Teste a funcionalidade "Gerenciar Presenças" na aplicação para verificar se:

1. Os dados de presença são exibidos corretamente
2. O erro de recursão infinita não ocorre mais
3. Qualquer usuário autenticado consegue visualizar os dados

## Detalhes das Alterações

### Alterações na tabela `perfis`

- Removidas todas as políticas existentes
- Adicionada política para permitir que qualquer usuário autenticado possa visualizar todos os perfis
- Mantidas políticas de segurança para atualização e inserção (apenas proprietários e administradores)

### Alterações na tabela `treinos_presencas`

- Removidas todas as políticas existentes
- Adicionadas políticas para permitir que qualquer usuário autenticado possa:
  - Visualizar todas as presenças
  - Registrar novas presenças
  - Atualizar registros de presença
  - Excluir registros de presença

### Alterações na tabela `presencas_audit_log`

- Removidas todas as políticas existentes
- Adicionadas políticas para permitir que qualquer usuário autenticado possa:
  - Visualizar todos os registros do log de auditoria
  - Inserir novos registros no log de auditoria

## Observações Importantes

1. Estas alterações eliminam a verificação de perfil do usuário para acessar dados de presença
2. Todos os usuários autenticados na plataforma poderão visualizar e gerenciar as presenças
3. A segurança agora depende apenas da autenticação no Supabase, não de perfis específicos

## Restauração (Se Necessário)

Caso seja necessário reverter estas alterações, utilize os scripts originais de correção:

- `fix_rls_perfis.sql` ou `fix_rls_perfis_alternativo.sql`

E recrie as políticas originais para as outras tabelas com base no backup realizado. 