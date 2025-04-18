# Como Corrigir o Erro "Invalid Hook Call"

Você está enfrentando um erro comum em aplicações React: **"Invalid hook call"**. Este erro geralmente ocorre quando:

1. Você tem múltiplas versões do React no mesmo projeto
2. Hooks são usados fora de componentes funcionais
3. A ordem dos providers React está incorreta

## Passo a Passo para Resolver

### 1. Executar script para identificar múltiplas versões do React

```bash
npm run find-react
```

Este comando vai verificar se existem múltiplas cópias do React no seu projeto e mostrar onde elas estão.

### 2. Executar script de correção automática

```bash
npm run fix-react
```

Isso fará:
- Adicionar alias no Vite para apontar para uma única versão do React
- Adicionar `resolutions` no package.json
- Executar `npm dedupe` para tentar resolver automaticamente

### 3. Reinstalar as dependências

```bash
npm run clean-install
```

Este comando remove a pasta node_modules e reinstala todas as dependências de forma limpa.

### 4. Verificar se o problema foi resolvido

```bash
npm run dev
```

## Mudanças Feitas nos Arquivos

1. **App.tsx**: Reorganizamos a ordem dos providers para evitar problemas com hooks:
   - AuthProvider e RouterPersistence vêm antes dos providers de toast
   - Providers de UI (como TooltipProvider) foram movidos para evitar conflitos

2. **ErrorBoundary.tsx**: Simplificamos o componente para não usar hooks internamente

3. **Vite Config**: Adicionamos alias para garantir uma única versão do React

4. **Package.json**: Adicionamos a seção `resolutions` para garantir versões consistentes

## Se o Problema Persistir

Se mesmo após essas mudanças o problema continuar:

1. Verifique o console do navegador para erros específicos
2. Tente usar um navegador diferente 
3. Limpe o cache do navegador
4. Verifique se alguma biblioteca está usando React internamente de forma incorreta

## Explicação Técnica do Problema

O erro "Invalid hook call" geralmente ocorre quando o React não consegue manter o controle correto do estado dos hooks. Isso acontece quando:

- Componentes usam hooks de diferentes instâncias do React
- A ordem dos hooks muda entre renderizações
- Hooks são chamados condicionalmente

A solução mais comum é garantir que exista apenas uma cópia do React no projeto e que todos os componentes usem essa mesma cópia. 