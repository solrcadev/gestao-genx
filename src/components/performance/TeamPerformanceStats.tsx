
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import { TeamType } from '@/types';
import { fetchTeamStats } from '@/services/rankingService';

interface TeamPerformanceStatsProps {
  team: TeamType;
  dateRange: { from: Date; to: Date };
}

const TeamPerformanceStats: React.FC<TeamPerformanceStatsProps> = ({
  team,
  dateRange
}) => {
  const { data: stats } = useQuery({
    queryKey: ['teamStats', team, dateRange],
    queryFn: () => fetchTeamStats(team, dateRange)
  });

  if (!stats) return null;

  return (
    <div className="space-y-4">
      {/* Atleta em Destaque */}
      {stats.destaqueAtleta && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <TrendingUp className="h-5 w-5 text-green-500 mt-1" />
              <div>
                <h3 className="font-semibold">Atleta em Destaque da Semana</h3>
                <p>{stats.destaqueAtleta.nome}</p>
                <p className="text-sm text-muted-foreground">
                  Evolução de {stats.destaqueAtleta.evolucao.toFixed(1)}% em {stats.destaqueAtleta.fundamento}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerta de Fundamento */}
      {stats.piorFundamento && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Atenção ao Fundamento: {stats.piorFundamento.nome}</AlertTitle>
          <AlertDescription>
            Média de acertos: {stats.piorFundamento.media.toFixed(1)}%
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default TeamPerformanceStats;
