import React, { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { 
  BarChart2, 
  Calendar as CalendarIcon,
  CircleCheck, 
  CircleX,
  ArrowUpRight
} from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { AthletePerformance } from "@/types";

export interface AthletePerformanceDetailProps {
  performance: AthletePerformance;
}

const AthletePerformanceDetail = ({ performance }: AthletePerformanceDetailProps) => {
  const [activeTab, setActiveTab] = useState("overview");

  // Prepare data for the radar chart
  const radarData = Object.entries(performance?.avaliacoes?.porFundamento || {}).map(
    ([fundamento, dados]) => ({
      fundamento,
      taxa: Number(((dados?.percentualAcerto || 0)).toFixed(0)),
    })
  );

  // Prepare data for the pie chart
  const pieData = [
    {
      name: "Presente",
      value: performance?.presenca?.presentes || 0,
      color: "#22c55e",
    },
    {
      name: "Ausente",
      value: (performance?.presenca?.total || 0) - (performance?.presenca?.presentes || 0),
      color: "#ef4444",
    },
  ];

  // Função auxiliar para formatar a data com segurança
  const formatarDataSegura = (dataString: string) => {
    try {
      // Verifica se já está no formato dd/MM
      if (/^\d{2}\/\d{2}$/.test(dataString)) {
        return dataString;
      }
      
      // Tenta converter para Date
      const date = new Date(dataString);
      
      // Verifica se a data é válida
      if (isValid(date)) {
        return format(date, "dd/MM", { locale: ptBR });
      }
      
      return "Data inválida";
    } catch (error) {
      console.error("Erro ao formatar data:", error, dataString);
      return "Data inválida";
    }
  };

  // Last evaluations for bar chart - com verificações adicionais de segurança
  const lastEvaluations = Array.isArray(performance.ultimasAvaliacoes) && performance.ultimasAvaliacoes.length > 0
    ? performance.ultimasAvaliacoes
        .slice(0, 5)
        .map((avaliacao) => ({
          name: avaliacao.fundamento || "Desconhecido",
          acertos: avaliacao.acertos || 0,
          erros: avaliacao.erros || 0,
          data: avaliacao.data ? formatarDataSegura(avaliacao.data) : "Data inválida",
          treino: avaliacao.treino || "Avaliação",
        }))
    : [];

  return (
    <div className="px-4 py-6 space-y-6">
      <Tabs
        defaultValue="overview"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid grid-cols-3 w-full mb-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="technical">Desempenho Técnico</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Presença</p>
                <div className="mt-1 flex items-center justify-center gap-1">
                  <CircleCheck className="h-4 w-4 text-green-500" />
                  <p className="text-2xl font-bold">
                    {(performance?.presenca?.percentual || 0).toFixed(0)}%
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {performance?.presenca?.presentes || 0} de {performance?.presenca?.total || 0} treinos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Nota Média</p>
                <p className="text-2xl font-bold mt-1">
                  {(performance?.avaliacoes?.mediaNota || 0).toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {performance?.avaliacoes?.total || 0} avaliações
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium mb-3 flex items-center justify-between">
                <span>Eficiência por Fundamento</span>
                <Badge variant="outline" className="font-normal">
                  % de acerto
                </Badge>
              </h3>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart
                    cx="50%"
                    cy="50%"
                    outerRadius="80%"
                    data={radarData}
                  >
                    <PolarGrid />
                    <PolarAngleAxis dataKey="fundamento" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name="Taxa de Acerto"
                      dataKey="taxa"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                    <Tooltip formatter={(value) => [`${value}%`, 'Taxa de Acerto']} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technical" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium mb-3">Eficiência Técnica</h3>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {Object.entries(performance?.avaliacoes?.porFundamento || {}).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(performance?.avaliacoes?.porFundamento || {}).map(
                ([fundamento, dados]) => (
                  <Card key={fundamento}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="text-sm font-medium">{fundamento}</h4>
                        <Badge
                          variant={(dados?.percentualAcerto || 0) > 60 ? "default" : "outline"}
                          className={
                            (dados?.percentualAcerto || 0) > 60 ? "bg-green-500" : "text-amber-500"
                          }
                        >
                          {(dados?.percentualAcerto || 0).toFixed(0)}% eficiência
                        </Badge>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <p>
                          Acertos: <span className="font-medium text-green-600">{dados?.acertos || 0}</span>
                        </p>
                        <p>
                          Erros: <span className="font-medium text-red-600">{dados?.erros || 0}</span>
                        </p>
                        <p>
                          Total: <span className="font-medium">{dados?.total || 0}</span>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          ) : (
            <p className="text-center py-6 text-muted-foreground">
              Não há dados de fundamentos disponíveis
            </p>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium mb-3">Últimas Avaliações</h3>
              {lastEvaluations.length > 0 ? (
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={lastEvaluations}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="data"
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                      />
                      <YAxis tick={{ fontSize: 12 }} tickLine={false} />
                      <Tooltip
                        formatter={(value, name, props) => [
                          value,
                          name === "acertos" ? "Acertos" : "Erros",
                        ]}
                        labelFormatter={(label, data) => {
                          const item = data[0]?.payload;
                          return `${label} - ${item?.treino} (${item?.name})`;
                        }}
                      />
                      <Legend />
                      <Bar dataKey="acertos" name="Acertos" fill="#10b981" />
                      <Bar dataKey="erros" name="Erros" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center py-6 text-muted-foreground">
                  Não há histórico de avaliações
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Histórico de Presenças</h3>
                <Badge variant="outline">
                  {(performance?.presenca?.percentual || 0).toFixed(0)}% presença
                </Badge>
              </div>

              {/* We would need more data for a detailed presence history */}
              <p className="text-center py-4 text-muted-foreground">
                Presença em {performance?.presenca?.presentes || 0} de {performance?.presenca?.total || 0} treinos
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AthletePerformanceDetail;
