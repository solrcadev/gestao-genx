# Solucionando Problemas de Upload de Imagens

## Problema Comum: "Bucket not found"

Se você estiver recebendo erros como "Bucket not found" ao tentar fazer upload de imagens de atletas ou exercícios, isso significa que os buckets necessários não estão configurados no Supabase.

## Solução

### 1. Execute o script de configuração automática

O sistema inclui um script que verifica e cria automaticamente os buckets necessários no Supabase:

```bash
node scripts/setup-storage.js
```

### 2. Configuração Manual dos Buckets

Se o script automático não funcionar, você pode criar os buckets manualmente:

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

### 3. Verificação dos Buckets

Para verificar se os buckets estão configurados corretamente:

```bash
# Este comando lista todos os buckets existentes
npx supabase-js-cli storage buckets list
```

## Buckets Necessários

O sistema requer dois buckets principais:

1. `athletes-images` - Armazena fotos de atletas/alunos
2. `exercises-images` - Armazena imagens de exercícios

## Estrutura de Diretórios

Os uploads são organizados da seguinte forma:

- Fotos de atletas: `athletes/{timestamp}_{random}.{extension}`
- Imagens de exercícios: `exercises/{timestamp}.{extension}`

## Limites de Tamanho

- Fotos de atletas: Máximo de 2MB
- Imagens de exercícios: Sem limite específico, mas recomenda-se manter abaixo de 5MB

## Outras Dicas de Solução de Problemas

1. **Verifique as Variáveis de Ambiente**:
   Certifique-se de que `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estão configurados corretamente.

2. **Limites de Upload**:
   O plano gratuito do Supabase tem limites de armazenamento. Verifique seu uso atual.

3. **Formatos de Arquivo Suportados**:
   O sistema suporta formatos de imagem comuns: JPG, PNG, GIF, WebP.

4. **Problema de CORS**:
   Se estiver enfrentando problemas de CORS, verifique as configurações na guia "API" do seu projeto Supabase.

5. **Política de Cache**:
   As imagens são armazenadas com uma política de cache de 3600 segundos (1 hora). Se você atualizar uma imagem, pode ser necessário limpar o cache do navegador. 