# Painel GenX - Documentação do Projeto

## Visão Geral
O Painel GenX é uma aplicação web para gerenciamento de times de vôlei, focada em registrar dados de treinos, desempenhos e evolução dos atletas. A aplicação permite aos técnicos acompanhar o progresso dos atletas, registrar avaliações de fundamentos, controlar presença nos treinos e definir metas de evolução.

## Tecnologias Utilizadas
- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Autenticação, APIs)
- **Gerenciamento de Estado**: React Query
- **Gráficos**: Recharts
- **Roteamento**: React Router Dom

## Principais Funcionalidades

### 1. Gestão de Atletas
- Cadastro e edição de atletas
- Filtros por time (masculino/feminino)
- Visualização detalhada por atleta

### 2. Treinos
- Criação e montagem de treinos
- Associação de exercícios aos treinos
- Definição de treino do dia
- Avaliação de desempenho durante os treinos (acertos/erros)
- Sincronização em tempo real das avaliações

### 3. Controle de Presença
- Registro de presença nos treinos
- Histórico de presença por atleta

### 4. Desempenho
- Dashboard com métricas de desempenho
- Estatísticas por fundamento
- Evolução ao longo do tempo
- Desempenho detalhado por atleta

### 5. Metas e Evolução
- Definição de metas individuais para atletas
- Acompanhamento de progresso com gráficos
- Registro de evolução ao longo do tempo
- Filtros por status (Em andamento, Concluídas, Atrasadas)
- Histórico de atualizações das metas

## Estrutura do Banco de Dados

### Tabelas Principais
1. **athletes**: Cadastro de atletas do time
2. **exercicios**: Exercícios disponíveis para treinos
3. **treinos**: Dados dos treinos criados
4. **treinos_exercicios**: Relação entre treinos e exercícios
5. **treinos_do_dia**: Treino atual designado para o dia
6. **presencas/treinos_presencas**: Controle de presença nos treinos
7. **avaliacoes_fundamento**: Avaliações de fundamentos (acertos/erros)
8. **metas**: Metas de evolução para atletas
9. **historico_metas**: Histórico de atualizações das metas

## Atualizações Recentes

### Sincronização em Tempo Real de Avaliações
- Implementação de sincronização em tempo real das avaliações durante os treinos
- Armazenamento em localStorage como fallback quando offline
- Sincronização automática com o Supabase quando a conexão é restabelecida

### Módulo de Metas e Evolução
- Criação do serviço `metasService.ts` para gerenciamento de metas
- Implementação da página principal `MetasEvolucao.tsx`
- Desenvolvimento do componente de detalhes `MetaDetalhes.tsx` com gráfico de evolução
- Integração com o menu de navegação

### Correções e Melhorias
- Resolução de conflitos de merge nos arquivos após integrações com GitHub
- Adaptação do componente Select para evitar valores vazios
- Implementação de consultas separadas para contornar limitações de joins no Supabase
- Verificação e criação automática de tabelas quando não existem no banco

## Scripts SQL

### Criação das Tabelas de Metas

```sql
-- Habilitar a extensão para gerar UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar tabela de metas
CREATE TABLE IF NOT EXISTS public.metas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  atleta_id UUID NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  progresso INTEGER DEFAULT 0 CHECK (progresso >= 0 AND progresso <= 100),
  data_alvo DATE NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_atleta FOREIGN KEY (atleta_id) REFERENCES public.athletes(id) ON DELETE CASCADE
);

-- Criar tabela de histórico de progresso das metas
CREATE TABLE IF NOT EXISTS public.historico_metas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meta_id UUID NOT NULL,
  progresso INTEGER NOT NULL CHECK (progresso >= 0 AND progresso <= 100),
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_meta FOREIGN KEY (meta_id) REFERENCES public.metas(id) ON DELETE CASCADE
);
```

## Estado Atual e Próximos Passos
1. O aplicativo possui todas as funcionalidades principais implementadas
2. A sincronização de dados entre dispositivos está funcionando
3. O módulo de Metas e Evolução está completo
4. Próximos passos incluem melhorias na UX e relatórios avançados

## Contribuidores
- Equipe de desenvolvimento GenX

