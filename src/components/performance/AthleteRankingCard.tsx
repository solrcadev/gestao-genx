
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Medal } from 'lucide-react';
import { RankingItem, TeamType } from '@/types';
import { useFundamentosRanking } from '@/hooks/use-fundamentos-ranking';
import { Skeleton } from '@/components/ui/skeleton';

interface AthleteRankingCardProps {
  fundamento: string;
  team: TeamType;
  dateRange: { from: Date; to: Date };
}

const AthleteRankingCard = ({ fundamento, team, dateRange }: AthleteRankingCardProps) => {
  const { data: ranking, isLoading } = useFundamentosRanking({
    team,
    fundamento,
    startDate: dateRange.from,
    endDate: dateRange.to
  });

  const getMedalColor = (position: number) => {
    switch (position) {
      case 1: return 'text-yellow-500';
      case 2: return 'text-gray-400';
      case 3: return 'text-amber-600';
      default: return 'text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!ranking?.length) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">{fundamento}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum atleta atingiu o mínimo de 5 execuções
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{fundamento}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {ranking.slice(0, 3).map((item) => (
            <div key={item.atleta_id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <div className={getMedalColor(item.posicao)}>
                <Medal className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.atleta_nome}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{item.total_execucoes} execuções</span>
                  <span>•</span>
                  <span>{item.eficiencia}% eficiência</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{item.ranking_score}</p>
                <p className="text-xs text-muted-foreground">score</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AthleteRankingCard;
