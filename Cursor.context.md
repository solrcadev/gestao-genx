# Projeto: Volley Track Pro

## 🎯 Objetivo do Projeto
Aplicativo de Gerenciamento de Treinos de Vôlei, usado por técnicos para:
- Cadastrar e gerenciar atletas
- Criar exercícios personalizados com vídeos e imagens
- Montar treinos selecionando exercícios
- Aplicar o "Treino do Dia"
- Avaliar presença, desempenho e fundamentos dos atletas
- Gerar histórico de treinos e estatísticas de eficiência
- Visualizar desempenho detalhado individual dos atletas
- Visualizar histórico completo de treinos por atleta com filtros avançados

O projeto é **Mobile-First**, com foco em design esportivo e responsivo.

---

## 📁 Organização atual

- `src/pages`: Páginas principais da aplicação (ex: `TrainingAssembly.tsx`, `TreinoDosDia.tsx`, `StudentPerformance.tsx`)
- `src/components`: Componentes reutilizáveis e modulares, como:
  - `treino-do-dia/SelectTreinoParaDia.tsx`
  - `treino-do-dia/AthleteAttendance.tsx`
  - `treino-do-dia/ExerciseEvaluation.tsx`
  - `performance/AthletePerformanceDetail.tsx`
  - `performance/TeamPerformanceSummary.tsx`
  - `performance/HistoricoTreinosAtleta.tsx`
- `src/services`: Comunicação com Supabase (ex: `treinosDoDiaService.ts`, `performanceService.ts`)
- `src/types`: Tipagens globais do projeto

---

## 🧱 Banco de dados (Supabase)

As tabelas principais já existem:

- `athletes`: Cadastro de atletas (com `nome`, `posicao`, `time`, etc.)
- `exercicios`: Exercícios com `nome`, `categoria`, `objetivo`, `imagem`, `video_url`
- `treinos`: Treinos criados pelo técnico
- `treinos_exercicios`: Relação treino <-> exercícios
- `treinos_do_dia`: Treino selecionado para o dia atual
- `presencas`: Presença/ausência de atletas com justificativas
- `avaliacoes_exercicios`: Erros/acertos por atleta, por exercício
- `metas`: Metas individuais para cada atleta (id, título, descrição, data alvo, progresso)

---

## ✅ Implementações Realizadas

1. **Página de Desempenho Individual (`StudentPerformance.tsx`)**:
   - Visualização detalhada do desempenho de um atleta
   - Gráficos de evolução e histograma de acertos/erros
   - Indicadores de frequência, evolução, treinos concluídos
   - Estatísticas por fundamento técnico
   - Histórico de treinos e participação
   - Visualização e gerenciamento de metas do atleta
   - Formulário para registro de novas avaliações de desempenho

2. **Componente de Relatório Detalhado (`AthletePerformanceDetail.tsx`)**:
   - Relatório completo com gráficos e estatísticas
   - Exibição de dados em abas: Visão Geral, Desempenho Técnico e Histórico
   - Gráficos de radar, pizza e barras para visualização de dados
   - Correção de bugs de formatação de datas

3. **Melhoria na navegação de desempenho**:
   - Integração entre página de desempenho geral e desempenho individual
   - Botão para visualizar desempenho detalhado do atleta
   - Visualização de relatório completo em drawer/modal

4. **Funcionalidade de avaliação direta**:
   - Formulário para adicionar novas avaliações em tempo real
   - Registro de acertos/erros por fundamento
   - Atualização imediata das estatísticas

5. **Histórico Completo de Treinos por Atleta**:
   - Visualização detalhada de todos os treinos em que o atleta foi convocado
   - Exibição de presença/ausência com justificativas quando aplicável
   - Detalhamento dos fundamentos avaliados em cada treino
   - Cálculo de desempenho geral por treino
   - Interface interativa com linhas expansíveis para visualizar detalhes
   - Integração completa com o banco de dados Supabase
   - Sistema de filtros avançados:
     - Filtro por presença (presentes/ausentes)
     - Filtro por período de data com seletor de intervalo
     - Indicadores visuais de filtros aplicados
     - Contador de resultados filtrados

---

## ❗ Problemas Solucionados

1. **Erro `Invalid time value` no componente `AthletePerformanceDetail`**:
   - Causa: Tentativa de formatar datas inválidas com `format(new Date(avaliacao.data))`
   - Solução: Criada função `formatarDataSegura` para validar e tratar datas antes da formatação
   - Adicionadas verificações para dados ausentes ou inválidos

2. **Erros de tipagem no TypeScript**:
   - Correção de tipagem nas props dos componentes
   - Adição de interfaces para garantir consistência de dados
   - Correção de problemas de conversão de string para número em datas

3. **Problemas de nomenclatura de campos**:
   - Ajustados campos como `presente/presentes` e `taxa/percentualAcerto` para corresponder ao modelo de dados
   - Padronização da formatação de dados numéricos

---

## ⚠️ Problemas pendentes para resolver

1. **Otimização do carregamento de dados** no componente StudentPerformance para melhorar a performance

2. **Implementação de sistema de cache** para reduzir o número de requisições ao Supabase

3. **Testes de integração** para validar o fluxo completo de avaliação de desempenho

---

## 📌 Observações para o Cursor

- Projeto usa Tailwind e shadcn/ui junto com componentes do Ant Design
- O estilo atual é esportivo, com foco em escuro + contraste, mas poderá ser ajustado depois
- Os gráficos utilizam a biblioteca Recharts para visualização de dados
- A formatação de datas utiliza date-fns com locale pt-BR
- Componentes de filtro e tabelas utilizam Ant Design para uma melhor experiência do usuário

