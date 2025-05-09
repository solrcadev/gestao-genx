# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/a684acbc-1e13-4758-8056-62c977665b03

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/a684acbc-1e13-4758-8056-62c977665b03) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/a684acbc-1e13-4758-8056-62c977665b03) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes it is!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

# GenX - Sistema de Gestão para Equipes Esportivas

## Dashboard de Exercícios - Análise de Correlação Uso vs. Desempenho

### Visão Geral

O Dashboard de Exercícios agora possui uma nova funcionalidade para análise da correlação entre o uso de exercícios específicos e o desempenho da equipe em fundamentos técnicos. Esta funcionalidade permite aos técnicos visualizar o impacto dos exercícios utilizados no desempenho real da equipe.

### Configuração das Funções RPC

Para habilitar a funcionalidade de análise de correlação entre uso de exercícios e desempenho, é necessário configurar funções RPC no Supabase. Siga os passos abaixo:

1. Acesse o Console do Supabase para o seu projeto
2. Navegue até a seção SQL Editor
3. Crie uma nova query
4. Cole o conteúdo do arquivo `sql/criar_funcoes_rpc.sql`
5. Execute a query para criar as funções RPC necessárias

### Funções RPC Criadas

1. **get_performance_trend_por_fundamento**
   - Parâmetros: 
     - `p_fundamento_nome`: Nome do fundamento técnico
     - `p_data_inicio`: Data inicial (opcional)
     - `p_data_fim`: Data final (opcional)
     - `p_genero_equipe`: Gênero da equipe (opcional)
   - Retorna: Tendência de desempenho (% acertos) para o fundamento selecionado ao longo do tempo

2. **get_exercise_usage_volume_por_fundamento**
   - Parâmetros:
     - `p_fundamento_nome`: Nome do fundamento técnico
     - `p_data_inicio`: Data inicial (opcional)
     - `p_data_fim`: Data final (opcional)
     - `p_genero_equipe`: Gênero da equipe (opcional)
   - Retorna: Volume de uso de exercícios para o fundamento selecionado ao longo do tempo

3. **get_all_fundamentos_tecnicos**
   - Retorna: Lista de todos os fundamentos técnicos disponíveis no sistema

### Requisitos de Dados

Para que a análise de correlação funcione corretamente, é necessário que:

1. Os exercícios tenham fundamentos técnicos definidos (array `fundamentos` na tabela `exercicios`)
2. Existam registros de avaliações de desempenho na tabela `avaliacoes_fundamento`
3. Os treinos estejam associados corretamente a exercícios na tabela `treinos_exercicios`

### Como Usar a Análise de Correlação

1. Acesse o Dashboard de Exercícios
2. Navegue até a aba "Análise: Uso vs. Desempenho"
3. Selecione um fundamento técnico específico
4. Use os filtros globais de gênero e período para refinar sua análise
5. Analise o gráfico que mostra a correlação entre o volume de uso de exercícios (barras) e o desempenho da equipe (linha) ao longo do tempo

### Interpretação dos Dados

- Uma correlação positiva (aumento no uso de exercícios seguido por aumento no desempenho) sugere que os exercícios estão sendo eficazes.
- Uma correlação negativa ou neutra pode indicar que os exercícios selecionados não estão contribuindo significativamente para a melhoria do fundamento, ou que há outros fatores influenciando o desempenho.
- A análise deve ser feita em conjunto com outras métricas e observações da equipe técnica.
