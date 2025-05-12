import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Search, Users } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AtletaDesempenho } from '@/hooks/use-desempenho-qualitativo';

interface TabelaDesempenhoQualitativoProps {
  desempenho: AtletaDesempenho[];
  loading: boolean;
}

export default function TabelaDesempenhoQualitativo({ desempenho, loading }: TabelaDesempenhoQualitativoProps) {
  const [filtroTime, setFiltroTime] = useState<string>('todos');
  const [termoBusca, setTermoBusca] = useState<string>('');
  const [fundamentoSelecionado, setFundamentoSelecionado] = useState<string>('todos');
  
  // Extrair lista de fundamentos únicos de todos os atletas
  const fundamentos = desempenho.flatMap(atleta => 
    atleta.fundamentos.map(f => f.fundamento)
  );
  const fundamentosUnicos = ['todos', ...Array.from(new Set(fundamentos))].sort();
  
  // Filtrar atletas por time, termo de busca e fundamento
  const atletasFiltrados = desempenho.filter(atleta => {
    // Filtro de time
    if (filtroTime !== 'todos' && atleta.time !== filtroTime) {
      return false;
    }
    
    // Filtro de busca por nome
    if (
      termoBusca && 
      !atleta.nome.toLowerCase().includes(termoBusca.toLowerCase())
    ) {
      return false;
    }
    
    // Filtro de fundamento (apenas se um fundamento específico for selecionado)
    if (
      fundamentoSelecionado !== 'todos' && 
      !atleta.fundamentos.some(f => f.fundamento === fundamentoSelecionado)
    ) {
      return false;
    }
    
    return true;
  });
  
  // Ordenar atletas pelo desempenho médio no fundamento selecionado
  const atletasOrdenados = [...atletasFiltrados].sort((a, b) => {
    if (fundamentoSelecionado === 'todos') {
      // Ordenar pela média geral de todos os fundamentos
      const mediaA = a.fundamentos.reduce((sum, f) => sum + f.media, 0) / (a.fundamentos.length || 1);
      const mediaB = b.fundamentos.reduce((sum, f) => sum + f.media, 0) / (b.fundamentos.length || 1);
      return mediaB - mediaA; // Ordem decrescente
    } else {
      // Ordenar pelo fundamento específico
      const fundamentoA = a.fundamentos.find(f => f.fundamento === fundamentoSelecionado);
      const fundamentoB = b.fundamentos.find(f => f.fundamento === fundamentoSelecionado);
      
      const mediaA = fundamentoA ? fundamentoA.media : -Infinity;
      const mediaB = fundamentoB ? fundamentoB.media : -Infinity;
      
      return mediaB - mediaA; // Ordem decrescente
    }
  });
  
  // Função para obter a cor do badge com base na média
  const getMediaColor = (media: number) => {
    if (media >= 2) return "bg-green-500 hover:bg-green-600 text-white";
    if (media >= 1) return "bg-emerald-500 hover:bg-emerald-600 text-white";
    if (media >= 0) return "bg-blue-500 hover:bg-blue-600 text-white";
    if (media >= -1) return "bg-orange-500 hover:bg-orange-600 text-white";
    return "bg-red-500 hover:bg-red-600 text-white";
  };
  
  // Formatar valor da média para exibição
  const formatMedia = (media: number) => {
    return media.toFixed(1);
  };
  
  // Verificar se existem dados para exibir
  const semDados = atletasOrdenados.length === 0;
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0">
          <CardTitle className="text-xl">
            Desempenho Qualitativo
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Tabs value={filtroTime} onValueChange={setFiltroTime}>
              <TabsList>
                <TabsTrigger value="todos">
                  <Users className="h-4 w-4 mr-1" />
                  Todos
                </TabsTrigger>
                <TabsTrigger value="Masculino">Masculino</TabsTrigger>
                <TabsTrigger value="Feminino">Feminino</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center mt-4 space-y-2 md:space-y-0 md:space-x-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar atleta..."
              className="pl-8"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
            />
          </div>
          
          <Select 
            value={fundamentoSelecionado} 
            onValueChange={setFundamentoSelecionado}
          >
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Fundamento" />
            </SelectTrigger>
            <SelectContent>
              {fundamentosUnicos.map(fundamento => (
                <SelectItem key={fundamento} value={fundamento}>
                  {fundamento === 'todos' ? 'Todos os fundamentos' : fundamento}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="text-center p-4">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
            <p>Carregando dados de desempenho...</p>
          </div>
        ) : semDados ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Sem dados disponíveis</AlertTitle>
            <AlertDescription>
              Não há dados de avaliação qualitativa para os critérios selecionados.
              <br />
              Realize avaliações durante os treinos para exibir o desempenho dos atletas.
            </AlertDescription>
          </Alert>
        ) : (
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">#</TableHead>
                  <TableHead>Atleta</TableHead>
                  <TableHead className="text-center">Posição</TableHead>
                  {fundamentoSelecionado === 'todos' ? (
                    <>
                      <TableHead className="text-right">Média Geral</TableHead>
                      <TableHead className="text-right">Total Avaliações</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead className="text-right">{fundamentoSelecionado}</TableHead>
                      <TableHead className="text-right">Eventos +/-</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {atletasOrdenados.map((atleta, index) => {
                  // Calcular métricas com base no fundamento selecionado
                  let mediaExibida: number;
                  let eventosPositivos: number = 0;
                  let eventosNegativos: number = 0;
                  let totalEventos: number = 0;
                  
                  if (fundamentoSelecionado === 'todos') {
                    // Média de todos os fundamentos
                    const { media, positivas, negativas, total } = atleta.fundamentos.reduce(
                      (acc, fund) => ({
                        media: acc.media + fund.media,
                        positivas: acc.positivas + fund.positivas,
                        negativas: acc.negativas + fund.negativas,
                        total: acc.total + fund.total
                      }),
                      { media: 0, positivas: 0, negativas: 0, total: 0 }
                    );
                    
                    mediaExibida = atleta.fundamentos.length > 0 
                      ? media / atleta.fundamentos.length 
                      : 0;
                    eventosPositivos = positivas;
                    eventosNegativos = negativas;
                    totalEventos = total;
                  } else {
                    // Métricas do fundamento específico
                    const fundamento = atleta.fundamentos.find(f => f.fundamento === fundamentoSelecionado);
                    
                    if (fundamento) {
                      mediaExibida = fundamento.media;
                      eventosPositivos = fundamento.positivas;
                      eventosNegativos = fundamento.negativas;
                      totalEventos = fundamento.total;
                    } else {
                      mediaExibida = 0;
                      totalEventos = 0;
                    }
                  }
                  
                  return (
                    <TableRow key={atleta.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{atleta.nome}</TableCell>
                      <TableCell className="text-center">{atleta.posicao}</TableCell>
                      
                      {fundamentoSelecionado === 'todos' ? (
                        <>
                          <TableCell className="text-right">
                            <Badge className={getMediaColor(mediaExibida)}>
                              {formatMedia(mediaExibida)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{totalEventos}</TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="text-right">
                            <Badge className={getMediaColor(mediaExibida)}>
                              {formatMedia(mediaExibida)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-green-600">+{eventosPositivos}</span>
                            {' / '}
                            <span className="text-red-600">-{eventosNegativos}</span>
                          </TableCell>
                          <TableCell className="text-right">{totalEventos}</TableCell>
                        </>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
} 