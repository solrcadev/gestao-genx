# Guia do Sistema de Gerenciamento de Presenças

## Visão Geral

O sistema de gerenciamento de presenças foi aprimorado para oferecer uma melhor visualização do comprometimento dos atletas e facilitar o trabalho dos técnicos. As principais melhorias incluem:

1. **Justificativas Padronizadas**: Agora as faltas são categorizadas por tipo de justificativa com pesos diferentes
2. **Índice de Esforço**: Cada atleta possui um índice calculado automaticamente com base nas presenças e tipos de justificativa
3. **Visualização Resumida**: Uma visão geral por atleta com estatísticas de presença e esforço
4. **Detalhamento por Atleta**: Modal detalhado com histórico completo de presenças e justificativas

## Tipos de Justificativa e seus Pesos

O sistema agora utiliza os seguintes tipos padronizados de justificativa, cada um com um peso específico:

| Tipo de Justificativa | Peso | Descrição |
|------------------------|------|-----------|
| Presença | 1.0 | Atleta presente no treino |
| Motivo de Saúde | 0.8 | Falta justificada por motivos médicos/saúde |
| Motivo Acadêmico | 0.7 | Falta justificada por compromissos escolares/acadêmicos |
| Motivo Logístico | 0.5 | Falta justificada por problemas de transporte/logística |
| Motivo Pessoal | 0.3 | Falta justificada por motivos pessoais |
| Sem Justificativa | 0.0 | Falta sem nenhuma justificativa apresentada |

## Como é calculado o Índice de Esforço

O Índice de Esforço é uma métrica que quantifica o comprometimento do atleta, considerando tanto as presenças quanto o tipo de justificativa apresentada nas ausências.

**Fórmula de cálculo:**
```
Índice de Esforço = Soma dos pesos de todas as presenças/ausências ÷ Número total de treinos
```

Por exemplo, se um atleta participou de 4 treinos, com os seguintes registros:
- Presente (1.0)
- Presente (1.0)
- Ausente com justificativa acadêmica (0.7)
- Ausente sem justificativa (0.0)

Seu índice de esforço será: (1.0 + 1.0 + 0.7 + 0.0) ÷ 4 = 0.675 = 67.5%

## Funcionalidades do Sistema

### 1. Aba "Treino do Dia"

Na aba "Treino do Dia", ao marcar os atletas presentes/ausentes, os técnicos e monitores agora podem:

- Marcar atletas como presentes ou ausentes
- Ao marcar como ausente, selecionar o tipo de justificativa
- Adicionar detalhes específicos sobre a justificativa
- Salvar todas as presenças de uma vez

As justificativas são padronizadas para facilitar a análise posterior.

### 2. Aba "Gerenciar Presenças"

A aba "Gerenciar Presenças" agora possui duas visões:

#### 2.1 Resumo por Atleta
- Lista de todos os atletas com estatísticas consolidadas
- Índice de esforço com barra de progresso colorida
- Total de presenças e ausências
- Botão para visualizar histórico detalhado
- Opções para filtrar por equipe e buscar atletas
- Ordenação por nome, índice ou quantidade de presenças/faltas

#### 2.2 Listagem por Treino
- Visualização dos treinos cadastrados
- Ao selecionar um treino, é mostrada a lista de atletas
- Possibilidade de alterar presenças/ausências
- Visão geral de justificativas

### 3. Modal de Detalhamento

Ao clicar no botão de visualização de um atleta, um modal é aberto com:

- Estatísticas resumidas do atleta
- Barra de progresso do índice de esforço
- Lista detalhada de todos os treinos
- Para cada treino: data, status, tipo de justificativa e peso aplicado
- Codificação por cores para facilitar identificação visual

## Como Utilizar o Sistema

### Para Registrar Presenças no Treino do Dia

1. Acesse a aba "Treino do Dia"
2. Selecione um treino existente ou crie um novo
3. Na seção de presenças, utilize os switches para marcar atletas como presentes/ausentes
4. Para atletas ausentes, selecione o tipo de justificativa e adicione detalhes se necessário
5. Clique em "Salvar Presenças" para registrar tudo de uma vez

### Para Analisar o Desempenho de Presença

1. Acesse a aba "Mais" no menu
2. Clique em "Gerenciar Presenças"
3. Na visão "Resumo por Atleta", você pode:
   - Filtrar por equipe (Masculino/Feminino)
   - Buscar atletas pelo nome
   - Ordenar por diferentes critérios
   - Ver o índice de esforço e estatísticas gerais
4. Clique no ícone de olho para ver o histórico detalhado de um atleta

### Para Técnicos: Avaliação do Comprometimento

O índice de esforço é uma ferramenta objetiva para avaliar o comprometimento dos atletas com os treinos. É recomendado:

- Analisar regularmente o índice dos atletas (pelo menos mensalmente)
- Investigar quedas significativas no índice de esforço
- Reconhecer atletas com alto índice de comprometimento
- Considerar o índice nas decisões técnicas e de formação da equipe

## Perguntas Frequentes

**P: O que acontece se eu não selecionar o tipo de justificativa?**  
R: O sistema atribuirá automaticamente "Sem Justificativa" (peso 0.0).

**P: Como posso melhorar o índice de esforço de um atleta?**  
R: O índice melhora com presenças ou justificativas válidas quando há ausências.

**P: Posso alterar presenças de treinos anteriores?**  
R: Sim, através da aba "Gerenciar Presenças" > "Listagem por Treino".

**P: O índice considera todos os treinos ou apenas os mais recentes?**  
R: O índice considera todos os treinos registrados no sistema.

---

Para mais informações ou suporte, entre em contato com a equipe de desenvolvimento do sistema. 