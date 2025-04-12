
import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Legend,
  Tooltip,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Bar,
  LabelList,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useMediaQuery } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AthletePerformance, Athlete } from "@/types";
import { Badge } from "@/components/ui/badge";

interface AthletePerformanceDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  athlete: AthletePerformance;
}

const AthletePerformanceDetail = ({
  open,
  onOpenChange,
  athlete,
}: AthletePerformanceDetailProps) => {
  const isMobile = useMediaQuery(768);
  const [activeTab, setActiveTab] = useState("overview");

  // Get fundamental data
  const fundamentals = Object.keys(athlete?.avaliacoes?.porFundamento || {}).map(
    (key) => {
      const data = athlete.avaliacoes.porFundamento[key];
      return {
        name: key,
        acertos: data.acertos,
        erros: data.erros,
        taxa: data.taxa * 100, // Convert to percentage
      };
    }
  );

  // Prepare timeline data
  const timelineData = athlete?.ultimasAvaliacoes?.map((avaliacao) => {
    const date = new Date(avaliacao.data);
    return {
      name: `${date.getDate()}/${date.getMonth() + 1}`,
      acertos: avaliacao.acertos,
      erros: avaliacao.erros,
      fundamento: avaliacao.fundamento,
    };
  });

  // Colors for charts
  const colors = {
    acertos: "#4ade80", // green
    erros: "#f87171", // red
    primary: "#6366f1", // indigo
    secondary: "#8b5cf6", // violet
  };

  // Build radar chart data
  const radarData = fundamentals.map((item) => ({
    subject: item.name,
    acertos: item.acertos,
    erros: item.erros,
  }));

  // Build pie chart data for attendance
  const attendanceData = [
    {
      name: "Presente",
      value: athlete?.presenca?.presente,
    },
    {
      name: "Ausente",
      value: athlete?.presenca?.total - athlete?.presenca?.presente,
    },
  ];

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-3 rounded-md shadow-md">
          <p className="font-medium">{`${label}`}</p>
          {payload.map((entry: any, index: number) => {
            // Check if the value exists and if it has toFixed method
            const valueDisplay = typeof entry.value === 'number' ? 
              entry.value.toFixed(1) : 
              (entry.value || '0');
              
            return (
              <p
                key={`item-${index}`}
                style={{ color: entry.color }}
                className="text-sm"
              >
                {`${entry.name}: ${valueDisplay}`}
              </p>
            );
          })}
        </div>
      );
    }

    return null;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="mb-5 space-y-3">
          <SheetTitle className="flex items-center space-x-3">
            <Avatar className="h-10 w-10 border">
              <AvatarImage src={athlete?.atleta.foto_url || undefined} />
              <AvatarFallback>
                {athlete?.atleta.nome
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span>{athlete?.atleta.nome}</span>
                <Badge variant="outline" className="ml-1 text-xs">
                  {athlete?.atleta.time}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {athlete?.atleta.posicao}
              </div>
            </div>
          </SheetTitle>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col p-3 border rounded-md text-center">
              <span className="text-xs text-muted-foreground">Presença</span>
              <span className="text-xl font-semibold">
                {athlete?.presenca?.percentual || 0}%
              </span>
            </div>
            <div className="flex flex-col p-3 border rounded-md text-center">
              <span className="text-xs text-muted-foreground">Média</span>
              <span className="text-xl font-semibold">
                {athlete?.avaliacoes?.mediaNota?.toFixed(1) || "N/A"}
              </span>
            </div>
            <div className="flex flex-col p-3 border rounded-md text-center">
              <span className="text-xs text-muted-foreground">Treinos</span>
              <span className="text-xl font-semibold">
                {athlete?.avaliacoes?.total || 0}
              </span>
            </div>
          </div>
        </SheetHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="grid grid-cols-3 h-auto">
            <TabsTrigger value="overview" className="py-2">
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="details" className="py-2">
              Fundamentos
            </TabsTrigger>
            <TabsTrigger value="history" className="py-2">
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Radar Chart */}
            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="text-sm font-medium">Performance por Fundamento</h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart
                    cx="50%"
                    cy="50%"
                    outerRadius="80%"
                    data={radarData}
                  >
                    <PolarGrid strokeDasharray="3 3" />
                    <PolarAngleAxis dataKey="subject" />
                    <Radar
                      name="Acertos"
                      dataKey="acertos"
                      stroke={colors.acertos}
                      fill={colors.acertos}
                      fillOpacity={0.5}
                    />
                    <Radar
                      name="Erros"
                      dataKey="erros"
                      stroke={colors.erros}
                      fill={colors.erros}
                      fillOpacity={0.3}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Attendance Pie Chart */}
            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="text-sm font-medium">Presença em Treinos</h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={attendanceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      labelLine={false}
                      label={({
                        cx,
                        cy,
                        midAngle,
                        innerRadius,
                        outerRadius,
                        percent,
                      }: any) => {
                        const radius =
                          innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                        const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

                        return (
                          <text
                            x={x}
                            y={y}
                            fill="white"
                            textAnchor="middle"
                            dominantBaseline="central"
                          >
                            {`${(percent * 100).toFixed(0)}%`}
                          </text>
                        );
                      }}
                    >
                      <Cell key="cell-0" fill={colors.primary} />
                      <Cell key="cell-1" fill={colors.erros} />
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            {/* Bar Chart for Fundamentals */}
            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="text-sm font-medium">Taxa de Acertos por Fundamento</h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={fundamentals}
                    margin={{
                      top: 20,
                      right: 10,
                      left: 0,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis unit="%" domain={[0, 100]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="taxa" fill={colors.primary} name="Taxa de Acerto">
                      <LabelList dataKey="taxa" position="top" formatter={(value: number) => `${value.toFixed(0)}%`} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Table of Fundamentals Details */}
            <div className="rounded-lg border overflow-hidden">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Fundamento
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Acertos
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Erros
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Taxa
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {fundamentals.map((item, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                        {item.name}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-green-500">
                        {item.acertos}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-red-500">
                        {item.erros}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                        {item.taxa.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            {/* Line Chart for Timeline */}
            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="text-sm font-medium">Evolução nos Últimos Treinos</h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={timelineData}
                    margin={{
                      top: 5,
                      right: 10,
                      left: 5,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="acertos"
                      stroke={colors.acertos}
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="erros"
                      stroke={colors.erros}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Evaluations */}
            <div className="rounded-lg border overflow-hidden">
              <div className="bg-muted/50 px-4 py-3">
                <h3 className="text-sm font-medium">Últimas Avaliações</h3>
              </div>
              <div className="divide-y divide-border max-h-80 overflow-y-auto">
                {athlete?.ultimasAvaliacoes?.map((avaliacao, i) => {
                  const date = new Date(avaliacao.data);
                  return (
                    <div key={i} className="px-4 py-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{avaliacao.fundamento}</p>
                          <p className="text-xs text-muted-foreground">
                            {`${date.toLocaleDateString()} - ${avaliacao.treino}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-green-500">
                            {avaliacao.acertos} acertos
                          </span>
                          <span className="text-sm text-red-500">
                            {avaliacao.erros} erros
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {(!athlete?.ultimasAvaliacoes ||
                  athlete?.ultimasAvaliacoes.length === 0) && (
                  <div className="p-4 text-center text-muted-foreground">
                    Nenhuma avaliação registrada
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default AthletePerformanceDetail;
