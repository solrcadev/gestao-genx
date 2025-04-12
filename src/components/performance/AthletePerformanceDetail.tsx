
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, X } from "lucide-react";
import { AthletePerformance } from "@/types";
import { 
  PieChart, 
  Pie, 
  Legend, 
  ResponsiveContainer, 
  Cell, 
  Tooltip, 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";

interface AthletePerformanceDetailProps {
  performance: AthletePerformance;
}

const COLORS = [
  "#8B5CF6", // Roxo
  "#3B82F6", // Azul
  "#10B981", // Verde
  "#F59E0B", // Âmbar
  "#EF4444", // Vermelho
  "#EC4899", // Rosa
  "#8B5CF6", // Roxo (repetido para completar)
];

// Função para formatar data
const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), "dd/MM/yy", { locale: ptBR });
  } catch {
    return dateString;
  }
};

const AthletePerformanceDetail = ({ performance }: AthletePerformanceDetailProps) => {
  const { presenca, avaliacoes, ultimasAvaliacoes } = performance;
  
  // Preparar dados para o gráfico de pizza de presença
  const presenceData = [
    { name: "Presente", value: presenca.presente },
    { name: "Ausente", value: presenca.total - presenca.presente }
  ];
  
  // Preparar dados para o gráfico de radar por fundamento
  const radarData = Object.entries(avaliacoes.porFundamento).map(([name, stats]) => ({
    fundamento: name,
    acertos: stats.acertos,
    erros: stats.erros,
    taxa: stats.taxa
  }));
  
  // Preparar dados para o gráfico de barras por fundamento
  const barData = Object.entries(avaliacoes.porFundamento).map(([name, stats]) => ({
    fundamento: name,
    acertos: stats.acertos,
    erros: stats.erros
  }));
  
  // Configuração para gráficos
  const chartConfig = {
    presente: { color: "#10B981" }, // Verde
    ausente: { color: "#EF4444" }, // Vermelho
    acertos: { color: "#3B82F6" }, // Azul
    erros: { color: "#F59E0B" }, // Âmbar
    taxa: { color: "#8B5CF6" }, // Roxo
  };
  
  return (
    <div className="px-4">
      <Tabs defaultValue="graficos" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="graficos">Gráficos</TabsTrigger>
          <TabsTrigger value="fundamentos">Fundamentos</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>
        
        <ScrollArea className="h-[50vh]">
          {/* Tab de Gráficos */}
          <TabsContent value="graficos" className="space-y-6">
            {/* Gráfico de Pizza - Presença */}
            <div>
              <h3 className="font-medium mb-2 text-sm">Taxa de Presença</h3>
              <div className="h-[200px] bg-muted/20 rounded-lg p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={presenceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {presenceData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.name === "Presente" ? chartConfig.presente.color : chartConfig.ausente.color} 
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} treinos`, ""]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Gráfico de Radar - Desempenho por Fundamento */}
            {radarData.length > 0 && (
              <div>
                <h3 className="font-medium mb-2 text-sm">Desempenho por Fundamento</h3>
                <div className="h-[300px] bg-muted/20 rounded-lg p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart outerRadius={90} data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="fundamento" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar
                        name="Taxa de Acerto (%)"
                        dataKey="taxa"
                        stroke={chartConfig.taxa.color}
                        fill={chartConfig.taxa.color}
                        fillOpacity={0.6}
                      />
                      <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, "Taxa de Acerto"]} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            
            {/* Gráfico de Barras - Acertos e Erros por Fundamento */}
            {barData.length > 0 && (
              <div>
                <h3 className="font-medium mb-2 text-sm">Acertos e Erros por Fundamento</h3>
                <div className="h-[300px] bg-muted/20 rounded-lg p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={barData}
                      margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="fundamento" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="acertos" name="Acertos" fill={chartConfig.acertos.color} />
                      <Bar dataKey="erros" name="Erros" fill={chartConfig.erros.color} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </TabsContent>
          
          {/* Tab de Fundamentos */}
          <TabsContent value="fundamentos">
            <div className="space-y-4">
              {Object.entries(avaliacoes.porFundamento).length > 0 ? (
                Object.entries(avaliacoes.porFundamento).map(([fundamento, stats]) => (
                  <div key={fundamento} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">{fundamento}</h3>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Taxa: </span>
                        <span className="font-semibold">{stats.taxa.toFixed(1).replace(".", ",")}%</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 border rounded p-2 bg-blue-500/10">
                        <Check className="h-4 w-4 text-blue-500" />
                        <div>
                          <span className="text-xs text-muted-foreground">Acertos</span>
                          <p className="font-semibold">{stats.acertos}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 border rounded p-2 bg-amber-500/10">
                        <X className="h-4 w-4 text-amber-500" />
                        <div>
                          <span className="text-xs text-muted-foreground">Erros</span>
                          <p className="font-semibold">{stats.erros}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">Nenhuma avaliação por fundamento registrada</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Tab de Histórico */}
          <TabsContent value="historico">
            <div className="space-y-2">
              {ultimasAvaliacoes.length > 0 ? (
                ultimasAvaliacoes.map((aval, index) => (
                  <div key={index} className="border rounded-lg p-3 flex">
                    <div className="mr-3 flex flex-col items-center">
                      <div className="bg-primary/10 rounded-full w-10 h-10 flex items-center justify-center">
                        {formatDate(aval.data)}
                      </div>
                      <div className="flex-1 w-0.5 bg-border mt-2"></div>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{aval.treino}</p>
                      <p className="text-sm">{aval.fundamento}</p>
                      <div className="flex gap-3 mt-1">
                        <div className="flex items-center gap-1 text-blue-500 text-sm">
                          <Check className="h-3 w-3" />
                          {aval.acertos}
                        </div>
                        <div className="flex items-center gap-1 text-amber-500 text-sm">
                          <X className="h-3 w-3" />
                          {aval.erros}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">Nenhum histórico de avaliação encontrado</p>
                </div>
              )}
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};

export default AthletePerformanceDetail;
