import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Medal, ArrowUp, ArrowDown, Minus, RefreshCw } from 'lucide-react';
import { getTeamsRanking } from '@/services/performanceService';
import { Badge } from '@/components/ui/badge';

interface TeamRankingProps {
  // Propriedades opcionais, se necessário
}

const TeamRanking: React.FC<TeamRankingProps> = () => {
  const [rankingData, setRankingData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const carregarRanking = async () => {
    setIsLoading(true);
    try {
      const dados = await getTeamsRanking();
      setRankingData(dados);
    } catch (error) {
      console.error('Erro ao carregar ranking de equipes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar o ranking quando o componente montar
  useEffect(() => {
    carregarRanking();
  }, []);

  // Função para formatar o valor de eficiência
  const formatarEficiencia = (valor: number) => {
    return `${valor.toFixed(1)}%`;
  };

  // Tradução dos fundamentos
  const traducoesFundamentos: Record<string, string> = {
    'saque': 'Saque',
    'passe': 'Passe/Recepção',
    'levantamento': 'Levantamento',
    'ataque': 'Ataque',
    'bloqueio': 'Bloqueio',
    'defesa': 'Defesa'
  };

  // Obter a cor da medalha com base na posição
  const getMedalColor = (posicao: number) => {
    switch (posicao) {
      case 1: return 'text-yellow-500'; // Ouro
      case 2: return 'text-slate-400';  // Prata
      case 3: return 'text-amber-600';  // Bronze
      default: return 'text-slate-700';
    }
  };

  // Obter a medalha ou posição
  const getMedalOrPosition = (posicao: number) => {
    if (posicao <= 3) {
      return <Medal className={`h-5 w-5 ${getMedalColor(posicao)}`} />;
    }
    return <span className="text-sm font-medium">{posicao}º</span>;
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl">Ranking de Equipes</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={carregarRanking} 
          disabled={isLoading}
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="ml-1">Atualizar</span>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : rankingData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Nenhum dado disponível para o ranking</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={carregarRanking} 
              className="mt-2"
            >
              Tentar novamente
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-12 text-center font-semibold">#</TableHead>
                <TableHead className="font-semibold">Equipe</TableHead>
                <TableHead className="text-center font-semibold">Eficiência</TableHead>
                <TableHead className="text-center font-semibold">Pontuação</TableHead>
                <TableHead className="text-right font-semibold">Destaque</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rankingData.map((equipe) => (
                <TableRow key={equipe.time} className="hover:bg-blue-50/50">
                  <TableCell className="text-center">
                    {getMedalOrPosition(equipe.posicao)}
                  </TableCell>
                  <TableCell className="font-medium">
                    Time {equipe.time}
                  </TableCell>
                  <TableCell className="text-center">
                    {formatarEficiencia(equipe.mediaEficiencia)}
                  </TableCell>
                  <TableCell className="text-center">
                    {equipe.pontuacaoTotal}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="font-normal">
                      {traducoesFundamentos[equipe.melhorFundamento.nome]}{' '}
                      <ArrowUp className="h-3 w-3 inline ml-1 text-emerald-600" />
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {rankingData.length > 0 && (
          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-semibold">Detalhes por Fundamento</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {rankingData.map((equipe) => (
                <Card key={`details-${equipe.time}`} className="overflow-hidden">
                  <CardHeader className="bg-slate-50 py-3">
                    <CardTitle className="text-lg">Time {equipe.time}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fundamento</TableHead>
                          <TableHead className="text-center">Eficiência</TableHead>
                          <TableHead className="text-right">Atletas</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(equipe.fundamentos).map(([fundamento, dados]: [string, any]) => (
                          <TableRow key={`${equipe.time}-${fundamento}`}>
                            <TableCell className="font-medium">
                              {traducoesFundamentos[fundamento]}
                              {fundamento === equipe.melhorFundamento.nome && (
                                <ArrowUp className="h-3 w-3 inline ml-1 text-emerald-600" />
                              )}
                              {fundamento === equipe.piorFundamento.nome && (
                                <ArrowDown className="h-3 w-3 inline ml-1 text-red-600" />
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {dados.tentativas > 10 ? (
                                <span 
                                  className={
                                    dados.eficiencia > 65 
                                      ? 'text-emerald-600' 
                                      : dados.eficiencia > 45 
                                        ? 'text-amber-600' 
                                        : 'text-red-600'
                                  }
                                >
                                  {formatarEficiencia(dados.eficiencia)}
                                </span>
                              ) : (
                                <span className="text-gray-400">
                                  <Minus className="h-4 w-4 inline" />
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {dados.atletasAvaliados}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TeamRanking; 