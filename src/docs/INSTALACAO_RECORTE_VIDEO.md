# Manual de Instalação: Recorte de Vídeos do YouTube

## Visão Geral

Esta funcionalidade permite aos técnicos definir pontos de início e fim nos vídeos do YouTube dos exercícios, mostrando apenas as partes relevantes durante os treinos.

## Instalação

### 1. Adicionar Colunas ao Banco de Dados

Para que a funcionalidade funcione corretamente, é necessário adicionar duas novas colunas à tabela `exercicios` no Supabase:

1. Acesse o painel de controle do Supabase: https://app.supabase.com
2. Selecione seu projeto
3. Vá para "Table Editor" > "exercicios"
4. Clique em "New Column" e adicione:
   - Nome: `video_inicio`
   - Tipo: `varchar`
   - Comprimento: `20`
   - Padrão: `NULL`
   - Marque como "Nullable"

5. Repita o processo para adicionar outra coluna:
   - Nome: `video_fim`
   - Tipo: `varchar`
   - Comprimento: `20`
   - Padrão: `NULL`
   - Marque como "Nullable"

Alternativamente, você pode executar o seguinte SQL no "SQL Editor" do Supabase:

```sql
ALTER TABLE public.exercicios ADD COLUMN IF NOT EXISTS video_inicio VARCHAR(20);
ALTER TABLE public.exercicios ADD COLUMN IF NOT EXISTS video_fim VARCHAR(20);
```

### 2. Verificar Instalação Através da Aplicação

1. Acesse a página "Mais Opções" no menu inferior
2. Clique em "Migração do Banco"
3. Clique em "Testar Conexão com Banco"
4. Se aparecer "Migração não necessária: As colunas já existem no banco de dados!", a instalação foi concluída com sucesso

## Como Usar

### 1. Cadastrar ou Editar um Exercício

1. Acesse a página "Exercícios"
2. Clique no botão "+" para criar um novo exercício ou no botão "Editar" de um exercício existente
3. Preencha o campo "URL do Vídeo" com um link do YouTube
4. Preencha os novos campos:
   - **Início do Exercício no Vídeo**: Momento em que o exercício começa (formato MM:SS ou HH:MM:SS)
   - **Fim do Exercício no Vídeo**: Momento em que o exercício termina (formato MM:SS ou HH:MM:SS)
5. Um preview do vídeo já com o recorte definido será exibido abaixo dos campos
6. Salve o exercício

### 2. Visualizar o Vídeo Recortado

1. Na lista de exercícios, localize o exercício com vídeo
2. Clique no botão "Ver vídeo"
3. O vídeo será exibido já com os pontos de início e fim definidos

## Formatos de Tempo Aceitos

- `MM:SS` - Exemplo: `05:30` (5 minutos e 30 segundos)
- `HH:MM:SS` - Exemplo: `01:05:30` (1 hora, 5 minutos e 30 segundos)
- `SS` - Exemplo: `45` (apenas 45 segundos)

## Solução de Problemas

### O vídeo não é recortado corretamente

- Verifique se o formato do tempo está correto (MM:SS ou HH:MM:SS)
- Confirme se o tempo de início é menor que o tempo de fim
- Certifique-se de que os tempos estão dentro da duração total do vídeo

### O botão "Ver vídeo" não aparece

- Verifique se a URL do vídeo foi inserida corretamente
- Certifique-se de que é uma URL do YouTube válida

### Mudanças não estão sendo salvas

- Verifique se as colunas `video_inicio` e `video_fim` foram adicionadas ao banco de dados
- Confirme se você tem permissões de escrita no banco de dados
- Verifique no console do navegador se há erros de API

## Importante

Esta funcionalidade utiliza a API de incorporação do YouTube, que tem algumas limitações:

- O parâmetro `start` sempre funciona corretamente
- O parâmetro `end` funciona apenas quando o vídeo é incorporado com sua URL completa, não com URLs encurtadas
- O recorte de vídeo funciona melhor em navegadores desktop. Em dispositivos móveis, pode haver variações no comportamento 