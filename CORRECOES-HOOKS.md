# Correção do Erro "Invalid Hook Call" no Painel GenX

Este documento explica o problema de "Invalid hook call" que ocorre na aplicação e como foi corrigido.

## Problema

O erro "Invalid hook call" ocorre por um dos seguintes motivos:

1. **Múltiplas instâncias do React** no mesmo aplicativo (causa mais comum)
2. **Ordem incorreta dos provedores de contexto** (hooks usados fora da ordem)
3. **Chamadas de hooks fora de componentes funcionais**

No caso desta aplicação, estávamos enfrentando principalmente o problema de múltiplas instâncias do React, devido a dependências que possuem sua própria cópia do React.

## Sintomas

Os seguintes erros aparecem no console:

```
Invalid hook call. Hooks can only be called inside of the body of a function component.
```

```
Cannot read properties of null (reading 'useContext')
```

```
Cannot read properties of null (reading 'useState')
```

## Correções Implementadas

### 1. Script de Verificação de Duplicação

Criamos o script `check-react-duplicates.js` que:
- Detecta múltiplas instâncias do React no projeto
- Adiciona resoluções no package.json
- Executa dedupe para eliminar duplicações
- Reinstala as dependências de forma limpa

### 2. Modificação no `package.json`

Adicionamos resoluções explícitas no package.json para garantir que apenas uma versão do React seja usada:

```json
"resolutions": {
  "react": "18.3.1",
  "react-dom": "18.3.1"
}
```

### 3. Correção na Ordem dos Provedores

Modificamos o arquivo `App.tsx` para corrigir a ordem dos provedores:
- Os componentes `Toaster` e `Sonner` foram movidos para fora dos provedores que usam hooks
- Corrigimos a hierarquia de provedores para garantir que os hooks sejam chamados na ordem correta

## Como Verificar se as Correções Funcionaram

Após aplicar as correções, siga estes passos:

1. Execute o script para verificar e corrigir duplicações:
   ```
   node check-react-duplicates.js
   ```

2. Reinstale as dependências de forma limpa:
   ```
   npm cache clean --force
   rm -rf node_modules
   npm install
   ```

3. Inicie a aplicação:
   ```
   npm run dev
   ```

4. Verifique se os erros "Invalid hook call" não aparecem mais no console.

## Prevenção de Problemas Futuros

Para evitar que esse problema retorne:

1. **Sempre use resoluções** no package.json para React e React DOM
2. **Cuidado ao adicionar novas dependências** que possam ter sua própria cópia do React
3. **Mantenha a ordem correta dos providers** no App.tsx
4. **Use o ErrorBoundary** para capturar e exibir erros com graciosidade

Se o problema retornar, execute o script `check-react-duplicates.js` para encontrar e corrigir duplicações. 