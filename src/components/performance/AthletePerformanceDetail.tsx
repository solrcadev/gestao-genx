// @ts-nocheck
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
import PerformanceBarGraph from '@/components/performance/charts/PerformanceBarGraph';
import PerformanceRadarChart from '@/components/performance/charts/PerformanceRadarChart';
import PerformanceHistoryTable from '@/components/performance/PerformanceHistoryTable';

export interface AthletePerformanceDetailProps {
  performance: AthletePerformance;
}

const AthletePerformanceDetail: React.FC<AthletePerformanceDetailProps> = ({ performance }) => {
  const [activeTab, setActiveTab] = useState("overview");

  try {
    // Verificar se o objeto de performance é válido
    if (!performance || !performance.atleta || !performance.avaliacoes) {
      return (
        <div className="text-center p-4">
          <p>Dados do atleta não disponíveis</p>
        </div>
      );
    }
    
    // Extrair dados de avaliações para os gráficos
    const fundamentos = Object.entries(performance.avaliacoes.porFundamento).map(([nome, dados]) => ({
      nome,
      percentualAcerto: dados.percentualAcerto,
      totalExecucoes: dados.total
    }));
    
    return (
      <div className="p-4 pb-8">
        <Tabs defaultValue="grafico" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-4">
            <TabsTrigger value="grafico">Gráficos</TabsTrigger>
            <TabsTrigger value="radar">Radar</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>
          
          <TabsContent value="grafico" className="mt-2">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-3">Percentual de acerto por fundamento</h3>
                <div className="h-64">
                  <PerformanceBarGraph data={fundamentos} />
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-1">Estatísticas gerais</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="border rounded-md p-3">
                    <p className="text-xs text-muted-foreground">Total de avaliações</p>
                    <p className="text-lg font-semibold">{performance.avaliacoes.totalAvaliacoes}</p>
                  </div>
                  <div className="border rounded-md p-3">
                    <p className="text-xs text-muted-foreground">Média percentual</p>
                    <p className="text-lg font-semibold">{performance.avaliacoes.mediaPercentual?.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="radar" className="mt-2">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Visão geral de habilidades</h3>
              <div className="h-64 w-full">
                <PerformanceRadarChart data={fundamentos} />
              </div>
              <div className="border rounded-md p-3 mt-4">
                <p className="text-xs text-muted-foreground mb-1">Interpretação</p>
                <p className="text-sm">
                  Este gráfico mostra o equilíbrio entre os fundamentos. 
                  Valores mais próximos das bordas indicam melhor desempenho.
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="historico" className="mt-2">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Histórico de avaliações</h3>
              <PerformanceHistoryTable fundamentos={fundamentos} historico={performance.avaliacoes.historico || []} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  } catch (error) {
    console.error("Erro ao renderizar detalhes de desempenho:", error);
    return (
      <div className="p-4 text-center">
        <p className="text-destructive">Erro ao carregar detalhes de desempenho</p>
        <p className="text-sm text-muted-foreground mt-2">
          Ocorreu um erro ao processar os dados do atleta.
        </p>
      </div>
    );
  }
};

export default AthletePerformanceDetail;
