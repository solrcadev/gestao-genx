import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getHistoricoTreinoPorAtleta, HistoricoTreinoPorAtleta } from '@/services/performanceService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, X } from 'lucide-react';

interface HistoricoTreinosAtletaProps {
  atletaId: string;
}

const HistoricoTreinosAtleta: React.FC<HistoricoTreinosAtletaProps> = ({ atletaId }) => {
  const [historico, setHistorico] = useState<HistoricoTreinoPorAtleta[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchHistorico = async () => {
      try {
        setIsLoading(true);
        const data = await getHistoricoTreinoPorAtleta(atletaId);
        setHistorico(data);
      } catch (error) {
        console.error('Erro ao buscar histórico de treinos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (atletaId) {
      fetchHistorico();
    }
  }, [atletaId]);

  // Formatando a data para o formato brasileiro
  const formatarData = (dataString: string) => {
    try {
      // Verifica o formato da data recebida
      let data;
      if (dataString.includes('/')) {
        // Se já estiver no formato DD/MM/YYYY
        data = parse(dataString, 'dd/MM/yyyy', new Date());
      } else {
        // Se estiver no formato ISO YYYY-MM-DD
        data = parse(dataString, 'yyyy-MM-dd', new Date());
      }
      
      return format(data, 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      console.error('Erro ao formatar data:', error, dataString);
      return dataString;
    }
  };

  // Calcular a eficiência do atleta para cada fundamento
  const calcularEficiencia = (acertos: number, erros: number) => {
    const total = acertos + erros;
    if (total === 0) return 0;
    return Math.round((acertos / total) * 100);
  };

  return (
    <Card className="p-4">
      <h3 className="text-xl font-bold mb-4">Histórico de Treinos</h3>
      
      {isLoading ? (
        <div className="flex justify-center p-4">
          <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></span>
        </div>
      ) : historico.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground">
          Nenhum registro de treino encontrado para este atleta.
        </div>
      ) : (
        <Tabs defaultValue="geral">
          <TabsList className="mb-4">
            <TabsTrigger value="geral">Visão Geral</TabsTrigger>
            <TabsTrigger value="fundamentos">Por Fundamento</TabsTrigger>
          </TabsList>
          
          <TabsContent value="geral">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Treino</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Presença</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historico.map((treino) => (
                  <TableRow key={treino.treinoId}>
                    <TableCell>{formatarData(treino.data)}</TableCell>
                    <TableCell>{treino.nomeTreino}</TableCell>
                    <TableCell>{treino.local}</TableCell>
                    <TableCell>
                      {treino.presenca ? (
                        <Badge variant="success" className="bg-green-500 text-white">Presente</Badge>
                      ) : (
                        <div>
                          <Badge variant="destructive">Faltou</Badge>
                          {treino.justificativa && (
                            <span className="block text-xs mt-1 text-muted-foreground">
                              {treino.justificativa}
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
          
          <TabsContent value="fundamentos">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Treino</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Fundamento</TableHead>
                  <TableHead className="text-right">Acertos/Total</TableHead>
                  <TableHead className="text-right">Eficiência</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historico
                  .filter(treino => treino.presenca && treino.fundamentos && treino.fundamentos.length > 0)
                  .flatMap(treino => 
                    treino.fundamentos.map((fund, idx) => (
                      <TableRow key={`${treino.treinoId}-${idx}`}>
                        <TableCell>{treino.nomeTreino}</TableCell>
                        <TableCell>{formatarData(treino.data)}</TableCell>
                        <TableCell className="capitalize">{fund.fundamento}</TableCell>
                        <TableCell className="text-right">
                          {fund.acertos}/{fund.acertos + fund.erros}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={
                            calcularEficiencia(fund.acertos, fund.erros) >= 70 ? "success" : 
                            calcularEficiencia(fund.acertos, fund.erros) >= 50 ? "outline" : 
                            "destructive"
                          }>
                            {calcularEficiencia(fund.acertos, fund.erros)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
              </TableBody>
            </Table>
            {historico.filter(treino => treino.presenca && treino.fundamentos && treino.fundamentos.length > 0).length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                Não há registros de avaliações por fundamento para este atleta.
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </Card>
  );
};

export default HistoricoTreinosAtleta;
