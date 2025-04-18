# Como Resolver o Erro "Invalid Hook Call" no Painel GenX

Este documento fornece instruções para resolver o erro "Invalid Hook Call" que está quebrando a aplicação, especialmente no componente RealTimeEvaluation.

## Passos para Resolver

### 1. Limpar e Reinstalar as Dependências

O erro pode ser causado por múltiplas instâncias do React no projeto. Execute os seguintes comandos:

```bash
# Verificar dependências duplicadas
npm run check-deps

# Se o comando acima não resolver, execute manualmente:
npm cache clean --force
rm -rf node_modules
npm install
```

### 2. Reiniciar a Aplicação

Após reinstalar as dependências, reinicie a aplicação:

```bash
npm run dev
```

### 3. Se o Problema Persistir

Se o erro "Invalid Hook Call" persistir, as correções implementadas nos arquivos já devem estar funcionando:

- `ErrorBoundary` para capturar e exibir erros com graciosidade
- Correções no componente `RealTimeEvaluation` para evitar loops infinitos
- Correções no uso do `TooltipProvider`

### Detalhes sobre as Correções

1. **Loops infinitos no `RealTimeEvaluation`**:
   - Foi corrigido o `useEffect` para não criar dependência cíclica com `evaluationData`
   - A inicialização dos dados agora verifica se já existe conteúdo para evitar renderizações desnecessárias

2. **Problemas com o `TooltipProvider`**:
   - O `TooltipProvider` agora está corretamente encapsulado dentro de um `ErrorBoundary`
   - Cada uso de `RealTimeEvaluation` está envolvido por um `ErrorBoundary` para evitar que erros se propaguem

3. **Múltiplas instâncias do React**:
   - Foi adicionado um script para verificar e corrigir dependências duplicadas

## Logs de Erros

Se você continuar vendo erros, verifique o console do navegador para logs detalhados. Os erros comuns incluem:

- `Invalid hook call. Hooks can only be called inside of the body of a function component.`
- `Rendered more hooks than during the previous render.`
- `Cannot update a component from inside a callback.`

Caso esses erros persistam, entre em contato com o time de desenvolvimento para assistência adicional. 