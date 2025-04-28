import React, { useState, useEffect } from 'react';
import { Medal, Calendar, FileDown, Share2, Users, Info, X, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TeamType, AthletePerformance } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { gerarRankingDesempenho, RankingDesempenhoAtleta, descreverDesempenho } from '@/services/rankingDesempenhoService';
import { useQuery } from '@tanstack/react-query';

// Tipos
type PeriodoRanking = '7dias' | '30dias' | 'personalizado';

// Interface do componente
interface RankingDesempenhoProps {
  performanceData: AthletePerformance[];
  team: TeamType;
}

const RankingDesempenho: React.FC<RankingDesempenhoProps> = ({ performanceData, team }) => {
  // Estados do componente
  const [periodoSelecionado, setPeriodoSelecionado] = useState<PeriodoRanking>('7dias');
  const [dataInicio, setDataInicio] = useState<string>(getDateBefore(7));
  const [dataFim, setDataFim] = useState<string>(getToday());
  const [exibirSeletorDatas, setExibirSeletorDatas] = useState(false);
  const [dataInicioTemp, setDataInicioTemp] = useState(new Date(getDateBefore(7)));
  const [dataFimTemp, setDataFimTemp] = useState(new Date(getToday()));
  const [termoBusca, setTermoBusca] = useState('');
  const [quantidadeAtletasExibidos, setQuantidadeAtletasExibidos] = useState(10);

  // Função para obter data de hoje formatada
  function getToday() {
    const date = new Date();
    return date.toISOString().split('T')[0];
  }

  // Função para obter data X dias atrás
  function getDateBefore(days: number) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }

  // Atualizar o período quando mudar a seleção
  const handleChangePeriodo = (value: PeriodoRanking) => {
    setPeriodoSelecionado(value);
    
    if (value === '7dias') {
      const novaDataInicio = getDateBefore(7);
      const novaDataFim = getToday();
      
      setDataInicio(novaDataInicio);
      setDataFim(novaDataFim);
      
      // Atualizar também as datas temporárias para o seletor
      setDataInicioTemp(new Date(novaDataInicio));
      setDataFimTemp(new Date(novaDataFim));
      
      console.log(`Período atualizado para 7 dias: ${novaDataInicio} a ${novaDataFim}`);
    } else if (value === '30dias') {
      const novaDataInicio = getDateBefore(30);
      const novaDataFim = getToday();
      
      setDataInicio(novaDataInicio);
      setDataFim(novaDataFim);
      
      // Atualizar também as datas temporárias para o seletor
      setDataInicioTemp(new Date(novaDataInicio));
      setDataFimTemp(new Date(novaDataFim));
      
      console.log(`Período atualizado para 30 dias: ${novaDataInicio} a ${novaDataFim}`);
    }
  };

  // Buscar o ranking de desempenho
  const { data: rankingAtletas = [], isLoading } = useQuery({
    queryKey: ['ranking-desempenho', team, dataInicio, dataFim],
    queryFn: () => gerarRankingDesempenho(team, dataInicio, dataFim, performanceData),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Abrir seletor de datas personalizado
  const abrirSeletorDatas = () => {
    setExibirSeletorDatas(true);
  };

  // Fechar seletor de datas personalizado
  const fecharSeletorDatas = () => {
    setExibirSeletorDatas(false);
  };

  // Aplicar filtro de data personalizado
  const aplicarFiltroPersonalizado = () => {
    // Formatar datas para ISO string
    const novaDataInicio = dataInicioTemp.toISOString().split('T')[0];
    const novaDataFim = dataFimTemp.toISOString().split('T')[0];
    
    setDataInicio(novaDataInicio);
    setDataFim(novaDataFim);
    
    console.log(`Período personalizado aplicado: ${novaDataInicio} a ${novaDataFim}`);
    
    // Fechar o seletor
    setExibirSeletorDatas(false);
  };

  // Obter a cor para o badge de desempenho
  const getDesempenhoColor = (media: number): string => {
    if (media >= 80) return 'bg-green-500 hover:bg-green-600';
    if (media >= 70) return 'bg-emerald-500 hover:bg-emerald-600';
    if (media >= 60) return 'bg-blue-500 hover:bg-blue-600';
    if (media >= 50) return 'bg-yellow-500 hover:bg-yellow-600';
    if (media >= 40) return 'bg-orange-500 hover:bg-orange-600';
    return 'bg-red-500 hover:bg-red-600';
  };

  // Filtrar atletas por termo de busca
  const atletasFiltrados = rankingAtletas.filter(atleta => 
    atleta.nome.toLowerCase().includes(termoBusca.toLowerCase())
  );

  // Limitar a quantidade de atletas exibidos
  const atletasExibidos = atletasFiltrados.slice(0, quantidadeAtletasExibidos);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0">
          <CardTitle className="text-xl flex items-center">
            <Medal className="mr-2 h-5 w-5" />
            Ranking de Desempenho
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Tabs value={periodoSelecionado} onValueChange={handleChangePeriodo}>
              <TabsList>
                <TabsTrigger value="7dias">7 dias</TabsTrigger>
                <TabsTrigger value="30dias">30 dias</TabsTrigger>
                <TabsTrigger value="personalizado" onClick={abrirSeletorDatas}>
                  <Calendar className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Personalizado</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        
        {exibirSeletorDatas && (
          <div className="mt-4 flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 items-center p-3 bg-muted/50 rounded-md relative animate-in fade-in duration-300">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2"
              onClick={fecharSeletorDatas}
            >
              <X className="h-4 w-4" />
            </Button>
            
            <div className="w-full md:w-auto">
              <label className="text-sm font-medium mb-1 block">Data Início:</label>
              <Input
                type="date"
                value={format(dataInicioTemp, 'yyyy-MM-dd')}
                onChange={(e) => setDataInicioTemp(new Date(e.target.value))}
                className="w-full md:w-auto"
              />
            </div>
            
            <div className="w-full md:w-auto">
              <label className="text-sm font-medium mb-1 block">Data Fim:</label>
              <Input
                type="date"
                value={format(dataFimTemp, 'yyyy-MM-dd')}
                onChange={(e) => setDataFimTemp(new Date(e.target.value))}
                className="w-full md:w-auto"
              />
            </div>
            
            <Button onClick={aplicarFiltroPersonalizado} className="mt-4 md:mt-6 w-full md:w-auto">
              Aplicar Filtro
            </Button>
          </div>
        )}
        
        <div className="flex flex-col md:flex-row justify-between items-center mt-4 space-y-2 md:space-y-0">
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar atleta..."
                className="pl-8"
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <Select
              value={quantidadeAtletasExibidos.toString()}
              onValueChange={(value) => setQuantidadeAtletasExibidos(Number(value))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Mostrar top atletas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">Top 5 atletas</SelectItem>
                <SelectItem value="10">Top 10 atletas</SelectItem>
                <SelectItem value="20">Top 20 atletas</SelectItem>
                <SelectItem value="50">Top 50 atletas</SelectItem>
                <SelectItem value="100">Todos os atletas</SelectItem>
              </SelectContent>
            </Select>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Este ranking exibe atletas ordenados pela média ponderada de avaliações qualitativas.
                    A pontuação considera a qualidade técnica das ações avaliadas em treinos e jogos.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-[600px]">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : atletasExibidos.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Nenhum atleta encontrado</h3>
              <p className="text-muted-foreground">
                Não foram encontrados atletas com avaliações no período selecionado.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px] text-center">#</TableHead>
                  <TableHead>Atleta</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-center">Média de Desempenho</TableHead>
                  <TableHead className="text-center">Avaliações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {atletasExibidos.map((atleta, index) => (
                  <TableRow key={atleta.id}>
                    <TableCell className="text-center font-medium">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {atleta.nome}
                    </TableCell>
                    <TableCell>{atleta.time}</TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        className={`${getDesempenhoColor(atleta.mediaDesempenho)} font-medium`}
                      >
                        {atleta.mediaDesempenho.toFixed(1)}%
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {descreverDesempenho(atleta.mediaDesempenho)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {atleta.totalAvaliacoes > 0 ? (
                        <div className="flex flex-col items-center">
                          <span className="font-medium">{atleta.totalAvaliacoes}</span>
                          <span className="text-xs text-muted-foreground">eventos avaliados</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Sem avaliações</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default RankingDesempenho; 