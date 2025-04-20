import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Check, X, Calendar, BarChart2 } from 'lucide-react';
import { getHistoricoTreinoPorAtleta, HistoricoTreinoPorAtleta as HistoricoTreino } from '@/services/performanceService';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

interface HistoricoTreinosAtletaProps {
  atletaId: string;
}

export const ensureNumber = (value: string | number): number => {
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return value;
}

export const HistoricoTreinosAtleta: React.FC<HistoricoTreinosAtletaProps> = ({ atletaId }) => {
  const [historico, setHistorico] = useState<HistoricoTreino[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('todos');

  useEffect(() => {
    async function carregarHistorico() {
      try {
        setLoading(true);
        const data = await getHistoricoTreinoPorAtleta(atletaId);
        setHistorico(data);
        setError(null);
      } catch (err) {
        console.error('Erro ao carregar histórico:', err);
        setError('Não foi possível carregar o histórico de treinos.');
      } finally {
        setLoading(false);
      }
    }

    if (atletaId) {
      carregarHistorico();
    }
  }, [atletaId]);

  // Filtrar histórico com base na aba ativa
  const historicoFiltrado = historico.filter(item => {
    if (activeTab === 'todos') return true;
    if (activeTab === 'presentes') return item.presenca;
    if (activeTab === 'ausentes') return !item.presenca;
    return true;
  });

  // Calcular estatísticas
  const totalTreinos = historico.length;
  const treinosPresentes = historico.filter(item => item.presenca).length;
  const percentualPresenca = totalTreinos > 0 ? (treinosPresentes / totalTreinos) * 100 : 0;

  // Agrupar fundamentos para análise
  const fundamentos: Record<string, { acertos: number, erros: number, total: number }> = {};
  
  historico.forEach(treino => {
    if (treino.presenca && treino.fundamentos) {
      treino.fundamentos.forEach(f => {
        if (!fundamentos[f.fundamento]) {
          fundamentos[f.fundamento] = { acertos: 0, erros: 0, total: 0 };
        }
        fundamentos[f.fundamento].acertos += f.acertos;
        fundamentos[f.fundamento].erros += f.erros;
        fundamentos[f.fundamento].total += (f.acertos + f.erros);
      });
    }
  });

  // Formatar data para exibição
  const formatarData = (dataString: string) => {
    try {
      const data = new Date(dataString);
      return data.toLocaleDateString('pt-BR');
    } catch (err) {
      return 'Data inválida';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Treinos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Treinos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" /> Histórico de Treinos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {historico.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhum treino registrado para este atleta.</p>
          </div>
        ) : (
          <>
            {/* Resumo de presença */}
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-2">Resumo de Presença</h3>
              <div className="flex items-center gap-2 mb-2">
                <Progress value={percentualPresenca} className="h-2" />
                <span className="text-sm font-medium">{percentualPresenca.toFixed(0)}%</span>
              </div>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span>{treinosPresentes} presentes</span>
                <span>•</span>
                <span>{totalTreinos - treinosPresentes} ausentes</span>
                <span>•</span>
                <span>{totalTreinos} total</span>
              </div>
            </div>

            {/* Resumo de fundamentos */}
            {Object.keys(fundamentos).length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <BarChart2 className="h-4 w-4" /> Desempenho por Fundamento
                </h3>
                <div className="space-y-3">
                  {Object.entries(fundamentos).map(([nome, dados]) => {
                    const percentual = dados.total > 0 ? (dados.acertos / dados.total) * 100 : 0;
                    return (
                      <div key={nome} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium capitalize">{nome}</span>
                          <span>{percentual.toFixed(1)}% de acerto</span>
                        </div>
                        <Progress value={percentual} className="h-1.5" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{dados.acertos} acertos</span>
                          <span>{dados.erros} erros</span>
                          <span>{dados.total} total</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tabs para filtrar treinos */}
            <Tabs defaultValue="todos" onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="todos">Todos</TabsTrigger>
                <TabsTrigger value="presentes">Presentes</TabsTrigger>
                <TabsTrigger value="ausentes">Ausentes</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="space-y-4">
                {historicoFiltrado.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>Nenhum treino encontrado para este filtro.</p>
                  </div>
                ) : (
                  historicoFiltrado.map((treino, index) => (
                    <div key={`${treino.treinoId}-${index}`} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{treino.nomeTreino}</h4>
                          <p className="text-xs text-muted-foreground">{formatarData(treino.data)} • {treino.local}</p>
                        </div>
                        {treino.presenca ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <Check className="h-3 w-3 mr-1" /> Presente
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            <X className="h-3 w-3 mr-1" /> Ausente
                          </Badge>
                        )}
                      </div>

                      {treino.presenca && treino.fundamentos && treino.fundamentos.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <h5 className="text-xs font-medium mb-2">Desempenho no treino:</h5>
                          <div className="space-y-2">
                            {treino.fundamentos.map((f, idx) => {
                              const total = f.acertos + f.erros;
                              const percentual = total > 0 ? (f.acertos / total) * 100 : 0;
                              return (
                                <div key={idx} className="flex items-center gap-2">
                                  <div className="w-20 text-xs capitalize">{f.fundamento}</div>
                                  <Progress value={percentual} className="h-1.5 flex-1" />
                                  <div className="text-xs w-16 text-right">
                                    {ensureNumber(percentual).toFixed(0)}% ({f.acertos}/{total})
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {!treino.presenca && treino.justificativa && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          <span className="font-medium">Justificativa:</span> {treino.justificativa}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default HistoricoTreinosAtleta;
