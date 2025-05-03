
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Define our own interface instead of importing
interface AthletePerformance {
  id: string;
  nome: string;
  time: string;
  posicao: string;
  desempenho: {
    fundamento: string;
    eficiencia: number;
  }[];
}

// Placeholder component for charts
const PerformanceChart = ({ title, data }: { title: string, data: any }) => (
  <Card className="w-full h-[300px] flex items-center justify-center bg-muted/20">
    <div className="text-center p-6">
      <h3 className="font-medium mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">Visualização de dados será implementada</p>
    </div>
  </Card>
);

interface PerformanceTabProps {
  athleteId?: string;
  initialTab?: string;
}

export function PerformanceTab({ athleteId, initialTab = 'overview' }: PerformanceTabProps) {
  const [selectedTab, setSelectedTab] = useState(initialTab);
  const [performanceData, setPerformanceData] = useState<AthletePerformance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulated data loading
    setTimeout(() => {
      setPerformanceData({
        id: athleteId || '1',
        nome: 'Atleta Exemplo',
        time: 'Masculino',
        posicao: 'Levantador',
        desempenho: [
          { fundamento: 'Ataque', eficiencia: 78 },
          { fundamento: 'Bloqueio', eficiencia: 65 },
          { fundamento: 'Saque', eficiencia: 82 },
        ]
      });
      setLoading(false);
    }, 1000);
  }, [athleteId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Desempenho</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="fundamentos">Fundamentos</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
            <TabsTrigger value="comparativo">Comparativo</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <PerformanceChart 
              title="Eficiência Geral" 
              data={performanceData?.desempenho || []}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {performanceData?.desempenho.map((item, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="font-medium">{item.fundamento}</div>
                    <div className="text-2xl font-bold mt-1">{item.eficiencia}%</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="fundamentos">
            <div className="grid gap-4">
              {performanceData?.desempenho.map((item, index) => (
                <PerformanceChart 
                  key={index}
                  title={`Desempenho em ${item.fundamento}`} 
                  data={item}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="historico">
            <PerformanceChart 
              title="Evolução de Desempenho" 
              data={performanceData?.desempenho || []}
            />
          </TabsContent>

          <TabsContent value="comparativo">
            <PerformanceChart 
              title="Comparativo com Time" 
              data={performanceData?.desempenho || []}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default PerformanceTab;
