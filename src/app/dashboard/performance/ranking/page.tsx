'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import RankingFundamentos from '@/components/performance/RankingFundamentos';
<<<<<<< HEAD
import TeamRanking from '@/components/performance/TeamRanking';
import RankingTop10Atletas from '@/components/performance/RankingTop10Atletas';
=======
import RankingDesempenho from '@/components/performance/RankingDesempenho';
>>>>>>> e00e4d317bf47193707a8e5057a94cd176a32469
import { TeamType, AthletePerformance } from '@/types';
import { loadPerformanceDataForRanking } from '@/services/performanceService';

export default function RankingPage() {
  const [selectedTeam, setSelectedTeam] = useState<TeamType>('Masculino');
  const [performanceData, setPerformanceData] = useState<AthletePerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar dados de performance
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await loadPerformanceDataForRanking(selectedTeam);
        setPerformanceData(data);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
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
      <Tabs defaultValue="atletas" className="w-full">
        <TabsList className="mb-6">
<<<<<<< HEAD
          <TabsTrigger value="atletas">Ranking de Atletas</TabsTrigger>
          <TabsTrigger value="equipes">Ranking de Equipes</TabsTrigger>
          <TabsTrigger value="top3">Top 3 Destaques</TabsTrigger>
=======
          <TabsTrigger value="top10">Ranking de Desempenho</TabsTrigger>
          <TabsTrigger value="top3">Top 3 Destaques Técnicos</TabsTrigger>
>>>>>>> e00e4d317bf47193707a8e5057a94cd176a32469
        </TabsList>
        
        <TabsContent value="atletas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Ranking de Desempenho de Atletas</CardTitle>
            </CardHeader>
            <CardContent>
<<<<<<< HEAD
              <Tabs defaultValue="saque" className="w-full">
                <TabsList>
                  <TabsTrigger value="saque">Saque</TabsTrigger>
                  <TabsTrigger value="passe">Passe</TabsTrigger>
                  <TabsTrigger value="levantamento">Levantamento</TabsTrigger>
                  <TabsTrigger value="ataque">Ataque</TabsTrigger>
                  <TabsTrigger value="bloqueio">Bloqueio</TabsTrigger>
                  <TabsTrigger value="defesa">Defesa</TabsTrigger>
                </TabsList>
                <TabsContent value="saque" className="pt-4">
                  <RankingTop10Atletas team={selectedTeam} fundamento="saque" />
                </TabsContent>
                <TabsContent value="passe" className="pt-4">
                  <RankingTop10Atletas team={selectedTeam} fundamento="passe" />
                </TabsContent>
                <TabsContent value="levantamento" className="pt-4">
                  <RankingTop10Atletas team={selectedTeam} fundamento="levantamento" />
                </TabsContent>
                <TabsContent value="ataque" className="pt-4">
                  <RankingTop10Atletas team={selectedTeam} fundamento="ataque" />
                </TabsContent>
                <TabsContent value="bloqueio" className="pt-4">
                  <RankingTop10Atletas team={selectedTeam} fundamento="bloqueio" />
                </TabsContent>
                <TabsContent value="defesa" className="pt-4">
                  <RankingTop10Atletas team={selectedTeam} fundamento="defesa" />
                </TabsContent>
              </Tabs>
=======
              <RankingDesempenho team={selectedTeam} performanceData={performanceData} />
>>>>>>> e00e4d317bf47193707a8e5057a94cd176a32469
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="equipes" className="space-y-6">
          <TeamRanking />
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