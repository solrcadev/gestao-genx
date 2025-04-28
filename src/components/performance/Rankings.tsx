import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Medal, Download, Expand, Trophy, User2, Users, Award, AlertCircle } from 'lucide-react';
import { TeamType } from '@/types';
import TeamPerformanceStats from './TeamPerformanceStats';
import { DateRange } from 'react-day-picker';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { loadPerformanceDataForRanking } from '@/services/performanceService';
import { gerarRankingDesempenho, descreverDesempenho } from '@/services/rankingDesempenhoService';

const fundamentos = [
  'Saque',
  'Passe',
  'Levantamento',
  'Ataque',
  'Bloqueio',
  'Defesa'
] as const;

const Rankings = () => {
  const [team, setTeam] = useState<TeamType>('Masculino');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date()
  });

  // Carregar dados de desempenho para o ranking
  const { data: performanceData = [], isLoading: isLoadingPerformance } = useQuery({
    queryKey: ['athletePerformanceRanking', team],
    queryFn: () => loadPerformanceDataForRanking(team),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Buscar ranking de desempenho com avaliações qualitativas
  const { data: rankingAtletas = [], isLoading: isLoadingRanking } = useQuery({
    queryKey: ['rankingDesempenho', team, dateRange.from?.toISOString(), dateRange.to?.toISOString()],
    queryFn: async () => {
      // Converter datas para formato ISO string
      const dataInicio = dateRange.from?.toISOString().split('T')[0];
      const dataFim = dateRange.to?.toISOString().split('T')[0];
      
      return await gerarRankingDesempenho(
        team,
        dataInicio,
        dataFim,
        performanceData
      );
    },
    enabled: performanceData.length > 0, // Só executa quando temos os dados de performance
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Função para obter a cor do badge com base na média
  const getMediaColor = (media: number): string => {
    if (media >= 85) return 'bg-green-500 text-white';
    if (media >= 75) return 'bg-emerald-500 text-white';
    if (media >= 65) return 'bg-blue-500 text-white';
    if (media >= 50) return 'bg-yellow-500 text-black';
    if (media >= 35) return 'bg-orange-500 text-white';
    return 'bg-red-500 text-white';
  };

  // Função para obter iniciais do nome para o avatar
  const getIniciais = (nome: string): string => {
    return nome.split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Função para obter cor de fundo do avatar com base na posição
  const getAvatarBgColor = (index: number): string => {
    switch(index) {
      case 0: return 'bg-yellow-500 text-yellow-950'; // Ouro
      case 1: return 'bg-slate-400 text-slate-950';   // Prata
      case 2: return 'bg-amber-600 text-amber-950';   // Bronze
      default: return 'bg-primary/20';                // Padrão
    }
  };

  // Renderizar skeleton cards durante carregamento
  const renderSkeletons = () => {
    return Array(6).fill(0).map((_, index) => (
      <Card key={`skeleton-${index}`} className="overflow-hidden">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-40" />
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 items-center">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-8 w-full" />
        </CardFooter>
      </Card>
    ));
  };

  // Renderizar card de atleta no ranking
  const renderAtletaCard = (atleta, index) => {
    return (
      <Card key={atleta.id} className={`overflow-hidden ${index < 3 ? 'border-2 border-primary/30' : ''}`}>
        <CardHeader className="pb-2">
          <CardDescription className="flex justify-between items-center">
            <span>Posição {index + 1}</span>
            {index < 3 && <Medal className="h-4 w-4 text-primary" />}
          </CardDescription>
          <CardTitle className="text-lg line-clamp-1">{atleta.nome}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 items-center">
            <Avatar className={`h-12 w-12 ${getAvatarBgColor(index)}`}>
              <AvatarFallback>{getIniciais(atleta.nome)}</AvatarFallback>
            </Avatar>
            <div>
              <Badge className={getMediaColor(atleta.mediaDesempenho)}>
                {atleta.mediaDesempenho.toFixed(1)}%
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">
                {descreverDesempenho(atleta.mediaDesempenho)}
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-2 flex justify-between">
          <span className="text-sm text-muted-foreground">
            {atleta.totalAvaliacoes} avaliações
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Award className="h-4 w-4 text-primary" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Média ponderada baseada na qualidade técnica das avaliações</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="space-y-4">
        <Tabs defaultValue={team} onValueChange={(value) => setTeam(value as TeamType)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="Masculino">Masculino</TabsTrigger>
            <TabsTrigger value="Feminino">Feminino</TabsTrigger>
          </TabsList>
        </Tabs>

        <DatePickerWithRange 
          date={dateRange}
          onDateChange={(range) => setDateRange(range || { from: new Date(new Date().setDate(new Date().getDate() - 7)), to: new Date() })}
        />
      </div>

      {/* Visão Geral da Equipe */}
      <TeamPerformanceStats 
        team={team}
        dateRange={dateRange as { from: Date; to: Date }}
      />

      {/* Ranking de Desempenho */}
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl flex items-center">
            <Trophy className="mr-2 h-5 w-5" />
            Ranking de Desempenho
          </CardTitle>
          <CardDescription>
            Atletas classificados pela média ponderada de desempenho técnico
            {dateRange.from && dateRange.to && (
              <span className="ml-1">
                ({format(dateRange.from, 'dd/MM', { locale: ptBR })} a {format(dateRange.to, 'dd/MM/yyyy', { locale: ptBR })})
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingPerformance || isLoadingRanking ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {renderSkeletons()}
            </div>
          ) : rankingAtletas.length === 0 ? (
            <div className="text-center py-10">
              <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <h3 className="mt-4 text-lg font-medium">Nenhuma avaliação encontrada</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                Não há atletas com avaliações qualitativas no período selecionado.
                Registre avaliações qualitativas para visualizar o ranking.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rankingAtletas.map((atleta, index) => renderAtletaCard(atleta, index))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" disabled={rankingAtletas.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Exportar PDF
        </Button>
        <Button variant="outline" disabled={rankingAtletas.length === 0}>
          <Expand className="h-4 w-4 mr-2" />
          Modo Apresentação
        </Button>
      </div>
    </div>
  );
};

export default Rankings;
