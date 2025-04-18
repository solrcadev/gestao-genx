
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Medal } from 'lucide-react';
import { TeamType } from '@/types';
import { fetchRankingByFundamento } from '@/services/rankingService';

interface AthleteRankingCardProps {
  fundamento: string;
  team: TeamType;
  dateRange: { from: Date; to: Date };
}

const AthleteRankingCard: React.FC<AthleteRankingCardProps> = ({
  fundamento,
  team,
  dateRange
}) => {
  const { data: ranking, isLoading } = useQuery({
    queryKey: ['ranking', fundamento, team, dateRange],
    queryFn: () => fetchRankingByFundamento(fundamento, team, dateRange)
  });

  const getMedalColor = (position: number) => {
    switch (position) {
      case 0: return 'text-yellow-400';
      case 1: return 'text-gray-400';
      case 2: return 'text-amber-600';
      default: return 'text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{fundamento}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{fundamento}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {ranking?.slice(0, 3).map((athlete, index) => (
          <div key={athlete.id} className="flex items-center gap-3">
            <Medal className={`h-5 w-5 ${getMedalColor(index)}`} />
            <div className="flex-1">
              <p className="font-medium">{athlete.nome}</p>
              <p className="text-sm text-muted-foreground">
                {athlete.percentualAcerto.toFixed(1)}%
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default AthleteRankingCard;
