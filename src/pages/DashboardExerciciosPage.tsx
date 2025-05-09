import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchExercisesWithFilteredStats, ExerciseFilterOptions } from '@/services/exerciseService';
import { 
  obterTodosFundamentos, 
  obterDadosDesempenho, 
  obterDadosUsoExercicios, 
  combinarDadosCorrelacao,
  formatarData,
  CorrelacaoDados,
  FiltroAnalise
} from '@/services/desempenhoService';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart2, ArrowUp, ArrowDown, Clock, CalendarRange, ChevronLeft, Tag, PieChart, Calendar as CalendarIcon, FilterX, Users, HelpCircle, TrendingUp, LineChart, ActivityIcon } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart as RechartsPieChart, Pie, Legend, ComposedChart, CartesianGrid, Line } from 'recharts';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LightbulbIcon } from '@/components/icons/LightbulbIcon';
import { FilterIcon } from '@/components/icons/FilterIcon';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';

interface DashboardWidgetProps {
  title: string;
  description?: string;
  isLoading?: boolean;
  children: React.ReactNode;
}

// Componente reutilizável de widget para o dashboard
const DashboardWidget: React.FC<DashboardWidgetProps> = ({ 
  title, 
  description, 
  isLoading = false,
  children 
}) => {
  return (
    <Card className="shadow-sm h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg font-semibold">
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <LoadingSpinner size="md" />
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
};

// Componente principal da página de Dashboard de Exercícios
const DashboardExerciciosPage = () => {
  const navigate = useNavigate();
  const [periodoInicio, setPeriodoInicio] = useState<Date | undefined>(undefined);
  const [periodoFim, setPeriodoFim] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [timeEquipe, setTimeEquipe] = useState<string>("Todos");
  const [fundamentoSelecionado, setFundamentoSelecionado] = useState<string>("none");
  const [isLoadingCorrelacao, setIsLoadingCorrelacao] = useState<boolean>(false);
  const [dadosCorrelacao, setDadosCorrelacao] = useState<CorrelacaoDados[]>([]);
  
  // Configurar as opções de filtro com base nos estados
  const filtroOptions: ExerciseFilterOptions = {
    time: timeEquipe,
    periodo: {
      inicio: periodoInicio,
      fim: periodoFim
    }
  };
  
  // Buscar dados dos exercícios com suas estatísticas de uso
  const { data: exercicios = [], isLoading } = useQuery({
    queryKey: ['exercises', filtroOptions], // Incluir filtros na chave da query
    queryFn: () => fetchExercisesWithFilteredStats(filtroOptions)
  });

  // Buscar lista de fundamentos disponíveis
  const { data: fundamentos = [] } = useQuery({
    queryKey: ['fundamentos'],
    queryFn: obterTodosFundamentos
  });

  // Efeito para buscar dados de correlação quando o fundamento é selecionado
  useEffect(() => {
    const buscarDadosCorrelacao = async () => {
      if (!fundamentoSelecionado || fundamentoSelecionado === "none") {
        setDadosCorrelacao([]);
        return;
      }

      try {
        setIsLoadingCorrelacao(true);

        const filtroAnalise: FiltroAnalise = {
          fundamento: fundamentoSelecionado,
          data_inicio: periodoInicio,
          data_fim: periodoFim,
          genero_equipe: timeEquipe
        };

        // Buscar dados de desempenho e uso de exercícios em paralelo
        const [dadosDesempenho, dadosUsoExercicios] = await Promise.all([
          obterDadosDesempenho(filtroAnalise),
          obterDadosUsoExercicios(filtroAnalise)
        ]);

        // Combinar os dados para o gráfico de correlação
        const dadosCombinados = combinarDadosCorrelacao(dadosDesempenho, dadosUsoExercicios);
        setDadosCorrelacao(dadosCombinados);
      } catch (error) {
        console.error('Erro ao buscar dados de correlação:', error);
      } finally {
        setIsLoadingCorrelacao(false);
      }
    };

    buscarDadosCorrelacao();
  }, [fundamentoSelecionado, timeEquipe, periodoInicio, periodoFim]);

  // Função para limpar filtros de período
  const limparFiltrosPeriodo = () => {
    setPeriodoInicio(undefined);
    setPeriodoFim(undefined);
  };

  // Função para limpar todos os filtros
  const limparTodosFiltros = () => {
    setPeriodoInicio(undefined);
    setPeriodoFim(undefined);
    setTimeEquipe("Todos");
  };

  // Função para verificar se tem algum filtro ativo
  const temFiltrosAtivos = () => {
    return periodoInicio !== undefined || periodoFim !== undefined || timeEquipe !== "Todos";
  };

  // Ordenar exercícios por contagem de uso (decrescente)
  const exerciciosMaisUtilizados = [...exercicios]
    .sort((a, b) => (b.contagem_uso || 0) - (a.contagem_uso || 0))
    .slice(0, 10); // Top 10

  // Ordenar exercícios por contagem de uso (crescente)
  const exerciciosMenosUtilizados = [...exercicios]
    .sort((a, b) => (a.contagem_uso || 0) - (b.contagem_uso || 0))
    .slice(0, 10); // Bottom 10

  // Calcular exercícios nunca utilizados (no período filtrado, se aplicável)
  const exerciciosNuncaUtilizados = exercicios.filter(e => !e.contagem_uso || e.contagem_uso === 0);

  // Calcular distribuição por nível de dificuldade
  const distribuicaoPorDificuldade = exercicios.reduce<Record<string, number>>((acc, exercicio) => {
    const dificuldade = exercicio.dificuldade || 'Não definido';
    acc[dificuldade] = (acc[dificuldade] || 0) + 1;
    return acc;
  }, {});

  // Calcular distribuição por fundamentos
  const distribuicaoPorFundamento = exercicios.reduce<Record<string, number>>((acc, exercicio) => {
    if (exercicio.fundamentos && exercicio.fundamentos.length > 0) {
      exercicio.fundamentos.forEach(fundamento => {
        acc[fundamento] = (acc[fundamento] || 0) + 1;
      });
    }
    return acc;
  }, {});

  // Calcular distribuição por categoria
  const distribuicaoPorCategoria = exercicios.reduce<Record<string, number>>((acc, exercicio) => {
    const categoria = exercicio.categoria || 'Não categorizado';
    acc[categoria] = (acc[categoria] || 0) + 1;
    return acc;
  }, {});
   
  // Calcular cobertura de fundamentos técnicos (baseado na contagem_uso)
  const coberturaFundamentosTecnicos = exercicios.reduce<Record<string, number>>((acc, exercicio) => {
    if (exercicio.fundamentos && exercicio.fundamentos.length > 0 && exercicio.contagem_uso) {
      exercicio.fundamentos.forEach(fundamento => {
        acc[fundamento] = (acc[fundamento] || 0) + (exercicio.contagem_uso || 0);
      });
    }
    return acc;
  }, {});
   
  // Transformar o objeto de cobertura em array para o gráfico
  const dadosGraficoCoberturaFundamentos = Object.entries(coberturaFundamentosTecnicos)
    .map(([name, value]) => ({ 
      name, 
      value 
    }))
    .sort((a, b) => b.value - a.value);

  // Cores para os fundamentos técnicos
  const coresFundamentos: Record<string, string> = {
    "Levantamento": "#3b82f6", // blue-500
    "Recepção": "#22c55e",     // green-500
    "Defesa": "#eab308",       // yellow-500
    "Saque": "#a855f7",        // purple-500
    "Ataque": "#ef4444",       // red-500
    "Bloqueio": "#f97316",     // orange-500
    "Deslocamento": "#6366f1", // indigo-500
    "Comunicação": "#ec4899",  // pink-500
  };
  
  // Gerar cores para qualquer fundamento que não esteja no mapa
  const getCorFundamento = (fundamento: string) => {
    return coresFundamentos[fundamento] || "#9ca3af"; // gray-500 para fundamentos não mapeados
  };
  
  // Formatar número para o tooltip
  const formatarNumero = (numero: number) => {
    return new Intl.NumberFormat('pt-BR').format(numero);
  };

  // Função para obter a cor do nível de dificuldade
  const getDificuldadeColor = (dificuldade: string) => {
    const cores = {
      'Iniciante': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
      'Intermediário': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
      'Avançado': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
      'Não definido': 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400 border-gray-200 dark:border-gray-700'
    };
    
    return cores[dificuldade] || cores['Não definido'];
  };

  // Função para obter cor do fundamento
  const getFundamentoColor = (fundamento: string) => {
    const cores = {
      "Levantamento": "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300",
      "Recepção": "bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-300",
      "Defesa": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/60 dark:text-yellow-300",
      "Saque": "bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300",
      "Ataque": "bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300",
      "Bloqueio": "bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-300",
      "Deslocamento": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300",
      "Comunicação": "bg-pink-100 text-pink-800 dark:bg-pink-900/60 dark:text-pink-300"
    };
    
    return cores[fundamento] || "bg-gray-100 text-gray-800 dark:bg-gray-800/60 dark:text-gray-300";
  };

  // Função para obter a cor da categoria
  const getCategoryColor = (category: string) => {
    const cores = {
      "Aquecimento": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      "Defesa": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      "Ataque": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800",
      "Técnica": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800",
      "Tática": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800",
      "Condicionamento": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800",
      "Jogo": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
      "Outro": "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300 border-gray-200 dark:border-gray-700"
    };
    
    return cores[category] || cores["Outro"];
  };

  // Função para obter a cor do background da barra de categoria
  const getCategoryBarColor = (category: string) => {
    const cores = {
      "Aquecimento": "bg-amber-500",
      "Defesa": "bg-blue-500",
      "Ataque": "bg-red-500",
      "Técnica": "bg-purple-500",
      "Tática": "bg-green-500",
      "Condicionamento": "bg-orange-500",
      "Jogo": "bg-indigo-500",
      "Outro": "bg-gray-500"
    };
    
    return cores[category] || cores["Outro"];
  };
  
  // Texto para exibir o período selecionado
  const textoPeriodoFiltro = () => {
    if (periodoInicio && periodoFim) {
      return `${format(periodoInicio, 'dd/MM/yyyy')} até ${format(periodoFim, 'dd/MM/yyyy')}`;
    } else if (periodoInicio) {
      return `A partir de ${format(periodoInicio, 'dd/MM/yyyy')}`;
    } else if (periodoFim) {
      return `Até ${format(periodoFim, 'dd/MM/yyyy')}`;
    } else {
      return 'Todo o histórico';
    }
  };

  // Texto descritivo para os filtros ativos
  const getDescricaoFiltros = () => {
    const partes = [];
    
    if (timeEquipe !== "Todos") {
      partes.push(`Equipe ${timeEquipe}`);
    }
    
    if (periodoInicio || periodoFim) {
      partes.push(textoPeriodoFiltro());
    }
    
    return partes.length > 0 ? partes.join(' • ') : 'Todos os dados';
  };

  // Formatar a métrica de desempenho para exibição
  const formatarDesempenho = (valor: number) => {
    return `${valor.toFixed(1)}%`;
  };

  // Verificar se temos dados de correlação suficientes para mostrar o gráfico
  const temDadosCorrelacaoSuficientes = () => {
    return dadosCorrelacao.length > 0 && 
           dadosCorrelacao.some(d => d.metrica_desempenho > 0 || d.volume_uso_exercicio > 0) &&
           fundamentoSelecionado !== "none";
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2">
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard de Análise de Exercícios</h1>
          <Button 
            variant="outline" 
            onClick={() => navigate('/exercicios')}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar para Exercícios
          </Button>
        </div>
        <p className="text-muted-foreground mt-2">
          Análises e estatísticas sobre o uso dos exercícios no sistema
        </p>
      </header>

      {/* Seção de Ajuda/Explicativa */}
      <div className="mb-8">
        <Accordion type="single" collapsible className="bg-muted/40 rounded-lg">
          <AccordionItem value="guia-dashboard">
            <AccordionTrigger className="px-4 py-3 hover:no-underline font-medium">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary" />
                Guia Rápido do Dashboard de Exercícios
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4">
              <div className="space-y-4 text-sm text-muted-foreground">
                <p className="leading-relaxed">
                  Este painel oferece insights sobre como os exercícios estão sendo utilizados nos treinos, 
                  ajudando no planejamento e na análise de tendências.
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <BarChart2 className="h-4 w-4 text-primary mt-1 shrink-0" />
                    <div>
                      <p className="font-medium text-foreground mb-1">Exercícios Mais/Menos Utilizados</p>
                      <p>
                        Identifique rapidamente quais exercícios estão sendo mais frequentes ou raramente utilizados. 
                        Use esta informação para diversificar os treinos, reintroduzir exercícios esquecidos ou avaliar 
                        se os mais usados estão alinhados com os objetivos atuais.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <PieChart className="h-4 w-4 text-primary mt-1 shrink-0" />
                    <div>
                      <p className="font-medium text-foreground mb-1">Cobertura de Fundamentos Técnicos</p>
                      <p>
                        Visualize a distribuição do foco do treinamento entre os diferentes fundamentos (Saque, Ataque, Defesa, etc.). 
                        Isso ajuda a garantir um desenvolvimento equilibrado da equipe e a alinhar o treino prático com as metas de 
                        cada mesociclo. Filtre por time para análises específicas.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <FilterIcon className="h-4 w-4 text-primary mt-1 shrink-0" />
                    <div>
                      <p className="font-medium text-foreground mb-1">Utilizando Filtros</p>
                      <p>
                        Utilize os filtros (Time e Período) para refinar sua análise e obter insights mais específicos 
                        para diferentes contextos e fases do treinamento. Compare dados entre times masculino e feminino 
                        para identificar padrões e necessidades específicas.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-primary/10 p-3 rounded-md mt-2 border border-primary/20">
                  <p className="flex items-center gap-1.5">
                    <LightbulbIcon className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">Dica:</span> 
                    Acompanhe regularmente estas métricas para avaliar se o planejamento de treinos está alinhado 
                    com as necessidades técnicas da equipe ao longo da temporada.
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Filtros */}
      <div className="mb-8 p-4 border rounded-lg bg-background/60 flex flex-col gap-4">
        {/* Título seção filtros */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Filtros</h3>
          {temFiltrosAtivos() && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={limparTodosFiltros}
              className="text-xs h-8 px-2"
            >
              <FilterX className="h-3.5 w-3.5 mr-1.5" />
              Limpar todos
            </Button>
          )}
        </div>

        {/* Controles de filtro */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Filtro de Gênero */}
          <div className="flex flex-col gap-2">
            <label htmlFor="time-filter" className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Gênero da Equipe:
            </label>
            <Select 
              value={timeEquipe} 
              onValueChange={setTimeEquipe}
            >
              <SelectTrigger id="time-filter" className={timeEquipe !== "Todos" ? "border-primary" : ""}>
                <SelectValue placeholder="Selecione o gênero" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                <SelectItem value="Masculino">Masculino</SelectItem>
                <SelectItem value="Feminino">Feminino</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro de Período */}
          <div className="flex flex-col gap-2">
            <label htmlFor="periodo-filter" className="text-sm text-muted-foreground flex items-center gap-1.5">
              <CalendarRange className="h-3.5 w-3.5" />
              Período:
            </label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="periodo-filter"
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal w-full",
                    (periodoInicio || periodoFim) && "border-primary"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span>{textoPeriodoFiltro()}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={{
                    from: periodoInicio,
                    to: periodoFim
                  }}
                  onSelect={(range) => {
                    setPeriodoInicio(range?.from);
                    setPeriodoFim(range?.to);
                  }}
                  locale={pt}
                  className="rounded-md border"
                  numberOfMonths={2}
                />
                <div className="p-3 border-t flex justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      limparFiltrosPeriodo();
                      setCalendarOpen(false);
                    }}
                  >
                    Limpar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setCalendarOpen(false)}
                  >
                    Aplicar
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Resumo dos filtros ativos */}
        <div className="flex items-center mt-1">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <span className="font-medium">Análise baseada em:</span>
            <Badge 
              variant={temFiltrosAtivos() ? "default" : "outline"} 
              className="font-normal rounded-sm"
            >
              {getDescricaoFiltros()}
            </Badge>
          </div>
          <div className="ml-auto text-xs text-muted-foreground">
            {isLoading ? 'Carregando dados...' : `${exercicios.length} exercícios encontrados`}
          </div>
        </div>
      </div>

      {/* Abas do Dashboard */}
      <Tabs defaultValue="visao-geral" className="mb-8">
        <TabsList className="mb-6 w-full justify-start">
          <TabsTrigger value="visao-geral" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            Visão Geral do Uso
          </TabsTrigger>
          <TabsTrigger value="analise-desempenho" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Análise: Uso vs. Desempenho
          </TabsTrigger>
        </TabsList>
        
        {/* Aba 1: Visão Geral do Uso (conteúdo existente) */}
        <TabsContent value="visao-geral" className="space-y-8">
          {/* WIDGET DE COBERTURA DE FUNDAMENTOS TÉCNICOS */}
          <div className="mb-8">
            <DashboardWidget 
              title={`Cobertura de Fundamentos Técnicos${timeEquipe !== "Todos" ? ` - ${timeEquipe}` : ""}`}
              description="Distribuição do foco de treinamento por fundamentos técnicos"
              isLoading={isLoading}
            >
              {dadosGraficoCoberturaFundamentos.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Gráfico de Barras para Visualização de Distribuição */}
                  <div className="h-[300px]">
                    <p className="text-sm text-muted-foreground mb-2 font-medium">Distribuição por Utilizações</p>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={dadosGraficoCoberturaFundamentos}
                        margin={{ top: 10, right: 10, left: 0, bottom: 30 }}
                        layout="vertical"
                      >
                        <XAxis type="number" tickFormatter={formatarNumero} />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip 
                          formatter={(value) => [formatarNumero(value as number), 'Utilizações']}
                          contentStyle={{ 
                            borderRadius: '8px', 
                            border: '1px solid #e2e8f0'
                          }}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {dadosGraficoCoberturaFundamentos.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={getCorFundamento(entry.name)} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Gráfico de Pizza para Visualização de Proporção */}
                  <div className="h-[300px]">
                    <p className="text-sm text-muted-foreground mb-2 font-medium">Proporção do Foco de Treinamento</p>
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          dataKey="value"
                          isAnimationActive={true}
                          data={dadosGraficoCoberturaFundamentos}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {dadosGraficoCoberturaFundamentos.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={getCorFundamento(entry.name)} 
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => [formatarNumero(value as number), 'Utilizações']}
                          contentStyle={{ 
                            borderRadius: '8px', 
                            border: '1px solid #e2e8f0'
                          }}
                        />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Detalhamento em formato de tabela */}
                  <div className="lg:col-span-2 mt-2">
                    <p className="text-sm text-muted-foreground mb-2 font-medium">Detalhamento por Fundamento</p>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fundamento</TableHead>
                            <TableHead className="text-right">Utilizações</TableHead>
                            <TableHead className="text-right">% do Total</TableHead>
                            <TableHead className="text-right">Exercícios</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dadosGraficoCoberturaFundamentos.map((item) => {
                            const totalUtilizacoes = dadosGraficoCoberturaFundamentos.reduce((sum, i) => sum + i.value, 0);
                            const percentual = (item.value / totalUtilizacoes) * 100;
                            // Contar quantos exercícios diferentes utilizam este fundamento
                            const exerciciosComFundamento = exercicios.filter(
                              ex => ex.fundamentos && ex.fundamentos.includes(item.name)
                            ).length;
                            
                            return (
                              <TableRow key={item.name}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-3 h-3 rounded-full" 
                                      style={{ backgroundColor: getCorFundamento(item.name) }}
                                    ></div>
                                    <span>{item.name}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right font-medium">{formatarNumero(item.value)}</TableCell>
                                <TableCell className="text-right">{percentual.toFixed(1)}%</TableCell>
                                <TableCell className="text-right">{exerciciosComFundamento}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Tag className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                  <h3 className="text-lg font-medium mb-2">Sem dados de cobertura</h3>
                  <p className="text-muted-foreground max-w-md">
                    {temFiltrosAtivos()
                      ? 'Não há dados de utilização para os filtros selecionados. Tente selecionar filtros diferentes ou remover os filtros.'
                      : 'Não há dados suficientes para análise de cobertura de fundamentos técnicos. É necessário que os exercícios tenham fundamentos definidos e registro de utilização.'}
                  </p>
                  {temFiltrosAtivos() && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={limparTodosFiltros}
                      className="mt-4"
                    >
                      <FilterX className="h-4 w-4 mr-2" />
                      Remover todos os filtros
                    </Button>
                  )}
                </div>
              )}
            </DashboardWidget>
          </div>
          
          {/* Grid de widgets - dados de uso */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Widget de Exercícios Mais Utilizados */}
            <DashboardWidget 
              title={`Exercícios Mais Utilizados${timeEquipe !== "Todos" ? ` - ${timeEquipe}` : ""}`}
              description="Top 10 exercícios com maior utilização"
              isLoading={isLoading}
            >
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Exercício</TableHead>
                      <TableHead className="text-right">Utilizações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exerciciosMaisUtilizados.map((exercicio) => (
                      <TableRow key={exercicio.id}>
                        <TableCell className="font-medium">{exercicio.nome}</TableCell>
                        <TableCell className="text-right">
                          <span className="flex items-center gap-1 justify-end">
                            <ArrowUp className={`h-4 w-4 ${exercicio.contagem_uso > 0 ? 'text-green-500' : 'text-gray-400'}`} />
                            {exercicio.contagem_uso || 0}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}

                    {exerciciosMaisUtilizados.length === 0 && !isLoading && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground py-6">
                          Nenhum exercício utilizado {temFiltrosAtivos() ? 'com os filtros selecionados' : 'ainda'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </DashboardWidget>

            {/* Widget de Exercícios Menos Utilizados */}
            <DashboardWidget 
              title={`Exercícios Menos Utilizados${timeEquipe !== "Todos" ? ` - ${timeEquipe}` : ""}`}
              description="Exercícios com menor frequência de uso"
              isLoading={isLoading}
            >
              <Tabs defaultValue="menos-utilizados">
                <TabsList className="mb-4">
                  <TabsTrigger value="menos-utilizados">Menos Utilizados</TabsTrigger>
                  <TabsTrigger value="nunca-utilizados">Nunca Utilizados ({exerciciosNuncaUtilizados.length})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="menos-utilizados">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Exercício</TableHead>
                          <TableHead className="text-right">Utilizações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {exerciciosMenosUtilizados.filter(e => (e.contagem_uso || 0) > 0).map((exercicio) => (
                          <TableRow key={exercicio.id}>
                            <TableCell className="font-medium">{exercicio.nome}</TableCell>
                            <TableCell className="text-right">
                              <span className="flex items-center gap-1 justify-end">
                                <ArrowDown className="h-4 w-4 text-amber-500" />
                                {exercicio.contagem_uso || 0}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}

                        {exerciciosMenosUtilizados.filter(e => (e.contagem_uso || 0) > 0).length === 0 && !isLoading && (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center text-muted-foreground py-6">
                              Nenhum exercício com baixa utilização {temFiltrosAtivos() ? 'com os filtros selecionados' : ''}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                
                <TabsContent value="nunca-utilizados">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Exercício</TableHead>
                          <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {exerciciosNuncaUtilizados.slice(0, 10).map((exercicio) => (
                          <TableRow key={exercicio.id}>
                            <TableCell className="font-medium">{exercicio.nome}</TableCell>
                            <TableCell className="text-right">
                              <span className="flex items-center gap-1 justify-end">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span className="text-muted-foreground">Nunca utilizado</span>
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}

                        {exerciciosNuncaUtilizados.length === 0 && !isLoading && (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center text-muted-foreground py-6">
                              Todos os exercícios já foram utilizados {temFiltrosAtivos() ? 'com os filtros selecionados' : ''}!
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                    
                    {exerciciosNuncaUtilizados.length > 10 && (
                      <div className="text-center mt-3 text-sm text-muted-foreground">
                        Mostrando 10 de {exerciciosNuncaUtilizados.length} exercícios nunca utilizados
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </DashboardWidget>
          </div>
          
          {/* Terceira linha de widgets */}
          <div className="mb-8">
            {/* Widget de Distribuição por Categoria */}
            <DashboardWidget 
              title="Distribuição por Categoria" 
              description="Quantidade de exercícios por categoria"
              isLoading={isLoading}
            >
              <div className="space-y-4">
                {Object.entries(distribuicaoPorCategoria)
                  .sort((a, b) => Number(b[1]) - Number(a[1])) // Ordenar do maior para o menor
                  .map(([categoria, quantidade]) => (
                    <div key={categoria} className="flex items-center gap-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getCategoryColor(categoria)}`}>
                        {categoria}
                      </span>
                      <div className="flex-grow h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${getCategoryBarColor(categoria)}`}
                          style={{ width: `${(Number(quantidade) / exercicios.length) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{quantidade}</span>
                    </div>
                  ))}
                  
                {Object.keys(distribuicaoPorCategoria).length === 0 && !isLoading && (
                  <div className="text-center py-6 text-muted-foreground">
                    Nenhum exercício com categoria definida
                  </div>
                )}
              </div>
            </DashboardWidget>
          </div>
        </TabsContent>
        
        {/* Aba 2: Análise Uso vs. Desempenho (Nova Aba) */}
        <TabsContent value="analise-desempenho">
          <div className="space-y-6">
            <div className="border rounded-lg p-6 bg-background">
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <LineChart className="h-5 w-5 text-primary" />
                Correlação entre Uso de Exercícios e Desempenho 
              </h3>
              
              {/* Seleção de Fundamento Técnico para Análise */}
              <div className="mb-6 max-w-md">
                <label htmlFor="fundamento-select" className="text-sm text-muted-foreground block mb-2">
                  Selecione o fundamento técnico para análise:
                </label>
                <Select 
                  value={fundamentoSelecionado}
                  onValueChange={setFundamentoSelecionado}
                >
                  <SelectTrigger id="fundamento-select">
                    <SelectValue placeholder="Escolha um fundamento técnico" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Selecione um fundamento</SelectItem>
                    {fundamentos.map((fundamento: string) => (
                      <SelectItem key={fundamento} value={fundamento}>
                        {fundamento}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Espaço para o gráfico de correlação */}
              <div className="h-[400px] border rounded-lg bg-muted/30">
                {isLoadingCorrelacao ? (
                  <div className="h-full flex items-center justify-center">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : temDadosCorrelacaoSuficientes() ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={dadosCorrelacao}
                      margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                      <XAxis 
                        dataKey="data_ponto_tempo" 
                        tickFormatter={formatarData} 
                        angle={-45} 
                        textAnchor="end"
                        height={50}
                      />
                      <YAxis 
                        yAxisId="left" 
                        domain={[0, 100]} 
                        label={{ 
                          value: '% de Acertos', 
                          angle: -90, 
                          position: 'insideLeft',
                          style: { textAnchor: 'middle' }
                        }} 
                      />
                      <YAxis 
                        yAxisId="right" 
                        orientation="right" 
                        label={{ 
                          value: 'Volume de Exercícios', 
                          angle: 90, 
                          position: 'insideRight',
                          style: { textAnchor: 'middle' }
                        }} 
                      />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === 'metrica_desempenho') return [formatarDesempenho(value as number), 'Taxa de Acerto'];
                          return [value, 'Exercícios Utilizados'];
                        }}
                        labelFormatter={formatarData}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                      />
                      <Legend />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="metrica_desempenho" 
                        name="Taxa de Acerto" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6, strokeWidth: 2 }}
                      />
                      <Bar 
                        yAxisId="right" 
                        dataKey="volume_uso_exercicio" 
                        name="Exercícios Utilizados" 
                        fill="#22c55e" 
                        radius={[4, 4, 0, 0]}
                        barSize={20}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <ActivityIcon className="h-10 w-10 mb-4 text-muted-foreground/40" />
                    <h4 className="text-lg font-medium mb-2">
                      {fundamentoSelecionado && fundamentoSelecionado !== "none"
                        ? 'Sem dados para visualização' 
                        : 'Selecione um fundamento técnico'}
                    </h4>
                    <p className="text-muted-foreground max-w-md">
                      {fundamentoSelecionado && fundamentoSelecionado !== "none"
                        ? `Não foram encontrados dados suficientes para o fundamento "${fundamentoSelecionado}" com os filtros atuais. Tente selecionar outro fundamento ou ajustar os filtros de período/time.`
                        : 'Selecione um fundamento técnico específico para visualizar a correlação entre o uso de exercícios e o desempenho da equipe nesse fundamento.'}
                    </p>
                    {fundamentoSelecionado && fundamentoSelecionado !== "none" && temFiltrosAtivos() && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={limparTodosFiltros}
                        className="mt-4"
                      >
                        <FilterX className="h-4 w-4 mr-2" />
                        Remover todos os filtros
                      </Button>
                    )}
                  </div>
                )}
              </div>
              
              {/* Informações explicativas sobre o gráfico */}
              {temDadosCorrelacaoSuficientes() && (
                <div className="mt-4 p-4 bg-muted/30 rounded-lg text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <LightbulbIcon className="h-4 w-4 text-primary mt-1 shrink-0" />
                    <p>
                      <span className="font-medium text-foreground">Como interpretar:</span> Este gráfico mostra a relação entre a quantidade de exercícios 
                      utilizados para treinar o fundamento "{fundamentoSelecionado !== "none" ? fundamentoSelecionado : ""}" (barras verdes) e a taxa de acerto 
                      da equipe nesse mesmo fundamento (linha azul) ao longo do tempo. 
                      Uma correlação positiva sugere que o aumento no volume de treino específico está contribuindo 
                      para a melhoria do desempenho da equipe.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardExerciciosPage; 