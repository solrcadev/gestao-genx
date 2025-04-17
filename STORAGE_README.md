# Configuração do Storage do Supabase para Painel GenX

## Buckets Necessários

Para que a funcionalidade de upload de imagens funcione corretamente, é necessário criar os buckets adequados no Supabase:

1. **athletes-images**: Armazena fotos de atletas e alunos
2. **exercises-images**: Armazena imagens de exercícios

## Configuração Automática

Execute o script de configuração automática:

```bash
node scripts/setup-storage.js
```

Este script verificará a existência dos buckets necessários e os criará caso não existam.

## Configuração Manual

Caso prefira configurar manualmente ou o script automático não funcione, siga estes passos:

1. Acesse o painel do Supabase em [app.supabase.com](https://app.supabase.com)
2. Selecione seu projeto
3. Navegue até a seção "Storage" no menu lateral
4. Clique em "New Bucket"
5. Crie os seguintes buckets:
   - `athletes-images` (para fotos de atletas)
   - `exercises-images` (para imagens de exercícios)
6. Para cada bucket, configure as políticas de acesso:
   - Vá para a aba "Policies"
   - Clique em "Add Policy"
   - Selecione "Create upload policy"
   - Para um ambiente de desenvolvimento, você pode usar a expressão `true` para permitir todos os uploads
   - Para um ambiente de produção, configure políticas mais restritivas

## Verificação de Buckets

Para verificar se os buckets existem:

```bash
# Este comando lista todos os buckets existentes no seu projeto
npx supabase-js-cli storage buckets list
```

## Solução de Problemas

Se você encontrar erros de "Bucket not found" ao fazer upload de imagens, verifique:

1. Se os buckets existem no Supabase
2. Se as variáveis de ambiente do Supabase estão configuradas corretamente
3. Se as políticas de acesso permitem operações de upload

Para mais detalhes sobre solução de problemas, consulte o arquivo [src/docs/UPLOAD_TROUBLESHOOTING.md](src/docs/UPLOAD_TROUBLESHOOTING.md). 