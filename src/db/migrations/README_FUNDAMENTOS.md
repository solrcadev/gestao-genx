# Implementação de Etiquetas Técnicas por Fundamento

Este documento explica as alterações feitas para adicionar suporte a etiquetas técnicas por fundamento na aba de Exercícios.

## Objetivo

Permitir que cada exercício possa ser classificado com múltiplos fundamentos do voleibol (levantamento, recepção, saque, ataque, bloqueio, defesa, etc.) e exibir essas etiquetas de forma visual nos cards, além de permitir filtragem por elas.

## Alterações no Banco de Dados

1. Adicionado o campo `fundamentos` (array de strings) na tabela `exercicios`
2. Criado um índice GIN para melhorar a performance de buscas por fundamento
3. Adicionado comentário na coluna para documentação

O script SQL para estas alterações está em `src/db/migrations/add_fundamentos_field.sql`.

## Estrutura da Funcionalidade

### Serviços
- `exerciseService.ts`: Atualizado para incluir suporte a fundamentos
  - Interfaces `Exercise` e `ExerciseInput` atualizadas com o campo `fundamentos: string[]`
  - Nova função `getFundamentosTecnicos()` para retornar a lista de fundamentos disponíveis

### Componentes
- `ExerciseForm.tsx`: Adicionado campo de seleção múltipla para fundamentos
  - Utiliza componente Checkbox para seleção múltipla
  - Agrupado na seção de informações básicas do formulário
  
- `ExerciseCard.tsx`: Atualizado para exibir etiquetas de fundamentos
  - Exibe os fundamentos como "badges" coloridas
  - Cores diferentes para cada tipo de fundamento

- `Exercises.tsx` (página principal): Adicionado filtro por fundamentos
  - Popover com lista de checkboxes para selecionar múltiplos fundamentos
  - Chips mostrando filtros ativos
  - Botão para limpar filtros

## Como Usar

### Cadastro/Edição de Exercícios
1. Ao cadastrar ou editar um exercício, use a seção "Fundamentos Técnicos"
2. Selecione todos os fundamentos abordados no exercício
3. As seleções são salvas automaticamente com o exercício

### Visualização
- Os fundamentos aparecem como chips coloridas nos cards de exercícios
- Diferentes cores para facilitar identificação visual

### Filtragem
1. Na página principal de exercícios, use o botão "Fundamentos" no topo
2. Selecione um ou mais fundamentos para filtrar
3. Aparecerão apenas exercícios que contenham TODOS os fundamentos selecionados
4. Use os chips ou o botão "Limpar filtros" para remover filtros

## Notas Técnicas

### Implementação do Filtro
O filtro usa a lógica `every()` para garantir que TODOS os fundamentos selecionados estejam presentes no exercício.

### Consultas ao Supabase
Para filtrar exercícios por fundamento no Supabase, use o operador `.contains()`:

```typescript
await supabase
  .from('exercicios')
  .select('*')
  .contains('fundamentos', ['Recepção', 'Defesa'])
```

### Expansões Futuras
A estrutura permite futuras melhorias, como:
- Estatísticas de tipos de fundamentos mais trabalhados
- Recomendações de exercícios complementares
- Gráficos de distribuição de fundamentos no conjunto de exercícios 