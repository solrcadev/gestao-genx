# Implementação da Correção do Upload de Imagens

## Problema

Os uploads de imagens para atletas e exercícios estavam falhando com o erro "Bucket not found" porque os nomes dos buckets estavam incorretos:

1. O código estava tentando usar o bucket `avatars` para fotos de atletas quando deveria usar `athletes-images`
2. O código estava tentando usar o bucket `exercicios` para imagens de exercícios quando deveria usar `exercises-images`

## Mudanças Implementadas

### 1. Correção nos Serviços

#### Serviço de Atletas
- Atualizado `athleteService.ts` para usar o bucket correto `athletes-images` em vez de `avatars`

#### Componente de Exercícios
- Atualizado `ExerciseForm.tsx` para usar o bucket correto `exercises-images` em vez de `exercicios`
- Modificado o caminho de armazenamento para `exercises/{timestamp}.{extension}`

### 2. Tratamento de Erros Amigável

#### Para Atletas
- Atualizada a mensagem em `PhotoUploadAlert.tsx` para mencionar o bucket correto `athletes-images`
- Melhorada a detecção de erros relacionados a buckets

#### Para Exercícios
- Criado novo componente `ExerciseUploadAlert.tsx` para exibir alertas específicos para upload de exercícios
- Implementada lógica para permitir que o usuário continue sem imagem ou corrija o problema

### 3. Guias de Ajuda

- Atualizado `BucketCreationGuide.tsx` para incluir instruções para ambos os buckets: `athletes-images` e `exercises-images`
- Criado documento de solução de problemas `UPLOAD_TROUBLESHOOTING.md`

### 4. Script de Automação

- Criado script `createBuckets.js` para verificar e criar automaticamente os buckets necessários
- Criado script auxiliar `setup-storage.js` para facilitar a execução do script principal

### 5. Documentação

- Criado `STORAGE_README.md` explicando a configuração necessária de armazenamento
- Adicionada documentação detalhada de solução de problemas

## Como Testar

1. Execute o script para criar os buckets:
   ```bash
   node scripts/setup-storage.js
   ```

2. Tente fazer upload de uma imagem para um atleta:
   - Acesse a página de criação ou edição de atleta
   - Clique na área de upload de foto
   - Selecione uma imagem
   - Verifique se o upload ocorre sem erros

3. Tente fazer upload de uma imagem para um exercício:
   - Acesse a página de criação ou edição de exercício
   - Clique na área de upload de imagem
   - Selecione uma imagem
   - Verifique se o upload ocorre sem erros

## Informações Adicionais

### Estrutura de Diretórios dos Uploads
- Fotos de atletas: `athletes/{timestamp}_{random}.{extension}`
- Imagens de exercícios: `exercises/{timestamp}.{extension}`

### Limites de Tamanho
- Fotos de atletas: Máximo de 2MB
- Imagens de exercícios: Não especificado, mas recomenda-se manter abaixo de 5MB 