# Projeto: Volley Track Pro

## 🎯 Objetivo do Projeto
Aplicativo de Gerenciamento de Treinos de Vôlei, usado por técnicos para:
- Cadastrar e gerenciar atletas
- Criar exercícios personalizados com vídeos e imagens
- Montar treinos selecionando exercícios
- Aplicar o "Treino do Dia"
- Avaliar presença, desempenho e fundamentos dos atletas
- Gerar histórico de treinos e estatísticas de eficiência

O projeto é **Mobile-First**, com foco em design esportivo e responsivo.

---

## 📁 Organização atual

- `src/pages`: Páginas principais da aplicação (ex: `TrainingAssembly.tsx`, `TreinoDosDia.tsx`)
- `src/components`: Componentes reutilizáveis e modulares, como:
  - `treino-do-dia/SelectTreinoParaDia.tsx`
  - `treino-do-dia/AthleteAttendance.tsx`
  - `treino-do-dia/ExerciseEvaluation.tsx`
- `src/services`: Comunicação com Supabase (ex: `treinosDoDiaService.ts`)
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

---

## ❗ Problemas atuais para resolver

1. **Erros de tipagem no TypeScript** causados pelo Lovable:
   - Componente recebe `className` ou `size`, mas suas props não estão declaradas corretamente.
   - Solução: adicionar corretamente os props via interface de tipo, ex:
     ```tsx
     interface MyComponentProps {
       className?: string;
       size?: string;
     }
     ```

2. **Componente `TeamType` ausente**:
   - O tipo `TeamType` não foi exportado de `@/types`.
   - Criar ou exportar corretamente:
     ```ts
     export type TeamType = "Masculino" | "Feminino";
     ```

3. **Erro de `element.click()`**
   - O TypeScript não reconhece que `element` é um `HTMLElement`.
   - Solução:
     ```ts
     (document.getElementById("myBtn") as HTMLElement)?.click();
     ```

---

## ✅ Prioridades imediatas com o Cursor

1. Resolver todos os erros de tipo (className, size, props ausentes).
2. Criar tipos ausentes (`TeamType`, props, etc.)
3. Garantir que todos os componentes principais do "Treino do Dia" estejam funcionais:
   - Seleção do treino
   - Registro de presença
   - Avaliação de atletas em exercícios
4. Garantir que todos os dados sejam salvos corretamente no Supabase
5. Após correção: ajustes de UI/UX (espaçamento, responsividade, navegação inferior)

---

## 📌 Observações para o Cursor

- Projeto usa Tailwind e shadcn/ui
- O estilo atual é esportivo, com foco em escuro + contraste, mas poderá ser ajustado depois
- O projeto foi iniciado no Lovable, mas será refinado e corrigido aqui

