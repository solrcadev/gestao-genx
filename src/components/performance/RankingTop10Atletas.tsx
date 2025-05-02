
import React, { useState } from 'react';
import { useTopAtletas } from '@/hooks/use-top-atletas';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

const RankingTop10Atletas = () => {
  const { data: topAtletas, isLoading } = useTopAtletas();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState('all');

  const filteredAthletes = selectedTab === 'all' 
    ? topAtletas 
    : topAtletas?.filter(atleta => atleta.time.toLowerCase() === selectedTab);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <div className="w-8 text-center">
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-4/5" />
            </div>
            <Skeleton className="h-10 w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex space-x-2 mb-4">
        <button 
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            selectedTab === 'all' 
              ? 'bg-primary/10 text-primary' 
              : 'bg-muted text-muted-foreground'
          }`}
          onClick={() => setSelectedTab('all')}
        >
          Todos
        </button>
        <button 
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            selectedTab === 'masculino' 
              ? 'bg-sport-blue/20 text-sport-blue' 
              : 'bg-muted text-muted-foreground'
          }`}
          onClick={() => setSelectedTab('masculino')}
        >
          Masculino
        </button>
        <button 
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            selectedTab === 'feminino' 
              ? 'bg-sport-red/20 text-sport-red' 
              : 'bg-muted text-muted-foreground'
          }`}
          onClick={() => setSelectedTab('feminino')}
        >
          Feminino
        </button>
      </div>

      {filteredAthletes?.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum atleta encontrado para este filtro.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAthletes?.map((atleta, index) => {
            const getInitials = (name: string) => {
              return name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);
            };
            
            const getProgressColor = (index: number) => {
              if (index === 0) return "bg-gold";
              if (index === 1) return "bg-silver";
              if (index === 2) return "bg-bronze";
              return "";
            };
            
            const getTeamColor = (team: string) => {
              return team.toLowerCase() === 'masculino' ? 'text-sport-blue' : 'text-sport-red';
            };
            
            const getBadgeColor = (team: string) => {
              return team.toLowerCase() === 'masculino' ? 'bg-sport-blue' : 'bg-sport-red';
            };
            
            return (
              <div 
                key={atleta.id} 
                className="flex items-center p-2 hover:bg-muted rounded-lg cursor-pointer transition-all relative"
                onClick={() => navigate(`/atleta/${atleta.id}`)}
              >
                <div className="w-8 font-bold text-lg text-center mr-2">
                  {index + 1}
                </div>
                <Avatar className="h-12 w-12 border-2 border-muted mr-3">
                  <AvatarImage src={atleta.foto_url || ''} />
                  <AvatarFallback className={`${getBadgeColor(atleta.time)} text-white`}>
                    {getInitials(atleta.nome)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm truncate">{atleta.nome}</h3>
                    <Badge variant="outline" className={`text-xs ${getTeamColor(atleta.time)}`}>
                      {atleta.posicao}
                    </Badge>
                  </div>
                  <div className="mt-1 pr-16">
                    <Progress 
                      value={atleta.percentual || 0} 
                      className={`h-2 ${getProgressColor(index)}`} 
                    />
                  </div>
                </div>
                <div className="absolute right-4 font-semibold text-sm">
                  {atleta.pontuacao.toFixed(0)} pts
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RankingTop10Atletas;
