# Permissões de UI Baseadas em Papel

Este documento descreve as restrições de interface de usuário implementadas para diferentes papéis de usuário no Painel GenX.

## Visão Geral

O Painel GenX implementa um sistema de permissões em duas camadas:

1. **Restrições de UI** - Limitam o que os usuários podem ver e interagir na interface (implementado)
2. **Restrições de Banco de Dados** - Limitam os dados que os usuários podem acessar e modificar (planejado para fase futura)

## Papéis de Usuário

| Papel | Descrição | Acesso |
|-------|-----------|--------|
| `tecnico` | Técnico responsável principal | Acesso irrestrito a todas as funcionalidades |
| `monitor` | Auxiliar que ajuda o técnico | Acesso limitado a funções específicas |

## Componentes de Controle de Acesso

Para implementar o controle de acesso na UI, utilizamos dois componentes principais:

### 1. RoleBasedAccess

Utilizado para ocultar ou desabilitar elementos da interface com base no papel do usuário:

```jsx
<RoleBasedAccess allowedRoles={['tecnico']}>
  <Button>Ação restrita a técnicos</Button>
</RoleBasedAccess>
```

### 2. RoleProtectedRoute

Utilizado para redirecionar usuários que tentam acessar páginas para as quais não têm permissão:

```jsx
<Route path="/rota-restrita" element={
  <ProtectedRoute>
    <RoleProtectedRoute allowedRoles={['tecnico']}>
      <ComponenteRestrito />
    </RoleProtectedRoute>
  </ProtectedRoute>
} />
```

## Permissões por Funcionalidade

### Exercícios
- **Técnico**: Criar, visualizar, editar e excluir exercícios
- **Monitor**: Apenas visualizar exercícios existentes

### Treinos
- **Técnico**: Criar, visualizar, editar, excluir treinos e definir treino do dia
- **Monitor**: Apenas visualizar treinos existentes

### Metas & Evolução
- **Técnico**: Criar, visualizar, editar, atualizar progresso e excluir metas
- **Monitor**: Apenas visualizar metas existentes e seu progresso

### Atas de Reunião
- **Técnico**: Criar, visualizar, editar e excluir atas
- **Monitor**: Apenas visualizar atas existentes

### Avaliação Qualitativa
- **Técnico**: Registrar, visualizar, editar e excluir avaliações qualitativas
- **Monitor**: Registrar e visualizar avaliações qualitativas (sem editar/excluir)

### Gestão de Presença
- **Técnico**: Registrar, visualizar, editar e excluir registros de presença
- **Monitor**: Registrar e visualizar presença (sem editar/excluir registros antigos)

### Seções da Página "Mais"
- **Histórico**: Acessível apenas para técnicos
- **Configurações**: Acessível apenas para técnicos 
- **Migração do Banco**: Acessível apenas para técnicos

## Como Testar

Para testar diferentes níveis de acesso:

1. No Supabase Studio, navegue até Authentication > Users
2. Edite um usuário e defina o App Metadata de acordo com o papel desejado:
   - Para técnico: `{"role": "tecnico"}`
   - Para monitor: `{"role": "monitor"}`
3. Faça logout e login novamente com esse usuário para que as alterações tenham efeito
4. O componente AuthDebugger (no canto inferior direito) mostra o papel atual do usuário

## Próximos Passos

Na próxima fase, implementaremos restrições no nível do banco de dados usando Row Level Security (RLS) do Supabase, garantindo segurança também no backend. 