
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Target, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getMetasByAthleteId } from '@/services/metasService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

const MetasEvolucao = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: metas, isLoading, error } = useQuery({
    queryKey: ['metas', user?.id],
    queryFn: () => getMetasByAthleteId(user?.id || ''),
    enabled: !!user?.id
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-destructive">Erro ao carregar metas</p>
        <Button 
          onClick={() => navigate(0)} 
          variant="outline" 
          className="mt-2"
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="mobile-container pb-20">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Target className="mr-2 h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Metas & Evolução</h1>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nova Meta
        </Button>
      </header>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Evolução Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Visualize sua evolução ao longo do tempo em cada fundamento e compare com suas metas estabelecidas.
              </p>
              <div className="h-64 bg-muted/10 rounded-md flex items-center justify-center border">
                <p className="text-muted-foreground">Gráfico de evolução será exibido aqui</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Minhas Metas</h2>
            <Button variant="ghost" size="sm">Ver todas</Button>
          </div>

          {metas && metas.length > 0 ? (
            <div className="space-y-4">
              {metas.map((meta) => (
                <Card key={meta.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{meta.titulo}</h3>
                        <p className="text-sm text-muted-foreground">{meta.descricao}</p>
                        <div className="mt-2">
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                            {new Date(meta.data_alvo).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold">{meta.progresso}%</span>
                        <p className="text-xs text-muted-foreground">Progresso</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-6 flex flex-col items-center text-center">
                <Target className="h-12 w-12 text-muted-foreground mb-2 opacity-50" />
                <h3 className="font-medium mb-1">Nenhuma meta definida</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Crie metas para acompanhar seu progresso
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar primeira meta
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetasEvolucao;
