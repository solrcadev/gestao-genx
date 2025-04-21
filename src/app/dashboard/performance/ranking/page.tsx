'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import RankingTop10Atletas from '@/components/performance/RankingTop10Atletas';
import RankingFundamentos from '@/components/performance/RankingFundamentos';
import { TeamType, AthletePerformance } from '@/types';
import { loadPerformanceDataForRanking } from '@/services/performanceService';

export default function RankingPage() {
  const [selectedTeam, setSelectedTeam] = useState<TeamType>('Masculino');
  const [performanceData, setPerformanceData] = useState<AthletePerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar os dados de performance quando mudar o time
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await loadPerformanceDataForRanking(selectedTeam);
        setPerformanceData(data);
      } catch (error) {
        console.error('Erro ao carregar dados de desempenho:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [selectedTeam]);

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Rankings de Desempenho</h1>
        <p className="text-muted-foreground">
          Visualize e analise os rankings de desempenho dos atletas
        </p>
      </div>

      {/* Seleção de Time */}
      <div className="mb-6">
        <Tabs 
          value={selectedTeam} 
          onValueChange={(value) => setSelectedTeam(value as TeamType)}
          className="w-full max-w-md"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="Masculino">Time Masculino</TabsTrigger>
            <TabsTrigger value="Feminino">Time Feminino</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tipos de Rankings */}
      <Tabs defaultValue="top10" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="top10">Top 10 por Fundamento</TabsTrigger>
          <TabsTrigger value="top3">Top 3 Destaques</TabsTrigger>
        </TabsList>
        
        <TabsContent value="top10" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Ranking Top 10 Atletas</CardTitle>
            </CardHeader>
            <CardContent>
              <RankingTop10Atletas team={selectedTeam} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="top3" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl">Destaques da Equipe</CardTitle>
              {isLoading && <p className="text-sm text-muted-foreground">Carregando dados...</p>}
            </CardHeader>
            <CardContent>
              <RankingFundamentos team={selectedTeam} performanceData={performanceData} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 