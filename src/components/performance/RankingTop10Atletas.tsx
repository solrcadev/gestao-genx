
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TopAtleta } from '@/hooks/use-top-atletas';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Medal } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface RankingTop10AtletasProps {
  atletas: TopAtleta[];
  loading: boolean;
  error: Error | null;
  title?: string;
  description?: string;
}

const RankingTop10Atletas: React.FC<RankingTop10AtletasProps> = ({
  atletas,
  loading,
  error,
  title = "Top Atletas",
  description = "Ranking dos 10 atletas com melhor desempenho"
}) => {
  // Function to get medal color based on position
  const getMedalColor = (position: number): string => {
    switch (position) {
      case 0: return "text-yellow-500";
      case 1: return "text-gray-400";
      case 2: return "text-amber-700";
      default: return "text-slate-600";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-10">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-destructive">
            Erro ao carregar ranking: {error.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {atletas.length > 0 ? (
          <div className="space-y-4">
            {atletas.map((atleta, index) => (
              <div key={atleta.id} className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-3">
                  <Medal className={`h-5 w-5 ${getMedalColor(index)}`} />
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      {atleta.foto_url ? (
                        <AvatarImage src={atleta.foto_url} alt={atleta.nome} />
                      ) : (
                        <AvatarFallback>{atleta.nome.substring(0, 2).toUpperCase()}</AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{atleta.nome}</p>
                      <p className="text-xs text-muted-foreground">{atleta.posicao}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{atleta.pontuacao}</p>
                  <p className="text-xs text-muted-foreground">{`${atleta.eficiencia.toFixed(0)}% eficiência`}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center">
            <p className="text-muted-foreground">Nenhum dado disponível para exibição</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RankingTop10Atletas;
