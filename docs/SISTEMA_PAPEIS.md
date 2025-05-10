# Sistema de Papéis de Usuário - Painel GenX

Este documento explica como utilizar o sistema de papéis de usuário implementado no Painel GenX, que permite atribuir funções como "tecnico" e "monitor" aos usuários do sistema.

## Visão Geral

O sistema usa o campo `app_metadata` do Supabase Authentication para armazenar o papel de cada usuário. Esta abordagem foi escolhida por:

1. Ser mais segura, pois os metadados são gerenciados pelo servidor
2. Não depender de tabelas ou políticas RLS adicionais
3. Ser facilmente acessível na sessão do usuário

## Como Atribuir Papéis

### Para Usuários Existentes

1. Acesse o [Supabase Studio](https://app.supabase.io/) do seu projeto
2. Navegue até "Authentication" > "Users"
3. Encontre o usuário que deseja modificar e clique nele
4. Na seção "App Metadata", adicione o seguinte par chave-valor:
   ```json
   {
     "role": "tecnico"
   }
   ```
   *Ou use "monitor" se for o caso*
5. Clique em "Save" para salvar as alterações

### Para Novos Usuários (Implementação Futura)

Atualmente, os papéis devem ser atribuídos manualmente após a criação do usuário. Em versões futuras, implementaremos uma das seguintes opções:

1. Papel padrão "monitor" atribuído automaticamente
2. Tela de convite que permite definir o papel no momento do convite
3. Interface administrativa para gerenciar papéis

## Como Verificar Papéis na Aplicação

O papel do usuário está disponível através do `AuthContext`:

```tsx
import { useAuth } from '@/contexts/AuthContext';

function MeuComponente() {
  const { userRole } = useAuth();
  
  if (userRole === 'tecnico') {
    // Lógica específica para técnicos
  } else if (userRole === 'monitor') {
    // Lógica específica para monitores
  }
  
  return (
    // Seu componente
  );
}
```

## Debug e Visualização

1. O componente `AuthDebugger` mostra informações sobre a sessão atual, incluindo o papel
2. O indicador visual `UserRoleIndicator` aparece no canto superior direito da tela quando o usuário está logado

## Papéis Disponíveis

| Papel | Descrição | Cor Indicativa |
|-------|-----------|----------------|
| `tecnico` | Responsável principal, com acesso a todas as funcionalidades | Azul |
| `monitor` | Assistente, com acesso limitado a certas operações | Verde |

## Solução de Problemas

Se o papel não estiver sendo reconhecido:

1. Certifique-se de que o usuário fez logout e login novamente após a atribuição do papel
2. Verifique o formato do JSON no app_metadata (deve ser exatamente `{"role": "tecnico"}`)
3. Use o `AuthDebugger` para verificar se o papel está sendo carregado corretamente
4. Limpe o cache do navegador ou use o modo anônimo para testar

## Próximos Passos

Em futuras implementações, este sistema de papéis será utilizado para:

1. Restringir acesso a certas áreas da UI baseado no papel
2. Implementar políticas RLS no banco de dados para limitar acesso a dados
3. Criar um painel administrativo para gerenciamento de usuários e papéis
4. Adicionar mais papéis conforme necessário (ex: administrador)

---

**Importante**: Por enquanto, esta implementação apenas exibe visualmente o papel do usuário e o disponibiliza no contexto de autenticação. Não há restrições de acesso baseadas em papel ainda. 