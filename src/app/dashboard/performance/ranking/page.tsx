
import React, { useState } from 'react';
import PageTitle from '@/components/PageTitle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import RankingFundamentos from '@/components/performance/RankingFundamentos';
import RankingTop10Atletas from '@/components/performance/RankingTop10Atletas';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { ExportRankingButton } from '@/components/ui/export-ranking-button';
import TeamRanking from '@/components/performance/TeamRanking';
import '../../../ranking-styles.css';

const RankingPage = () => {
  const [activeTab, setActiveTab] = useState('athlete');

  return (
    <div className="container px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <PageTitle title="Ranking de Desempenho" />
        <ExportRankingButton />
      </div>

      <Tabs 
        defaultValue="athlete" 
        className="w-full" 
        onValueChange={(value) => setActiveTab(value)}
      >
        <TabsList className="mb-6 w-full justify-start overflow-x-auto">
          <TabsTrigger value="athlete">Atletas</TabsTrigger>
          <TabsTrigger value="team">Equipes</TabsTrigger>
          <TabsTrigger value="skills">Fundamentos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="athlete" className="space-y-6">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <h2 className="text-lg font-semibold mb-4">Top 10 Atletas</h2>
              <ScrollArea className="h-[540px] pr-4">
                <RankingTop10Atletas />
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <h2 className="text-lg font-semibold mb-4">Ranking por Equipe</h2>
              <ScrollArea className="h-[540px] pr-4">
                <TeamRanking />
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="skills" className="space-y-6">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <h2 className="text-lg font-semibold mb-4">Ranking por Fundamento</h2>
              <ScrollArea className="h-[540px] pr-4">
                <RankingFundamentos />
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RankingPage;
