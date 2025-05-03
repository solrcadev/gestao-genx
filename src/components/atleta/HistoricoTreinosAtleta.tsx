
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, ChevronRight } from 'lucide-react';

// Definindo as interfaces necessárias diretamente no arquivo para evitar dependências externas
interface FundamentoAvaliacao {
  fundamento: string;
  pontuacao: number;
  totalEventos: number;
  acertos?: number;
  erros?: number;
}

export interface HistoricoTreinoPorAtleta {
  treinoId: string;
  nomeTreino: string;
  data: string;
  local: string;
  presenca: boolean;
  justificativa?: string;
  fundamentos: FundamentoAvaliacao[];
}

export interface HistoricoTreino {
  id: string;
  nome: string;
  data: string;
  dataFormatada: string;
  avaliacoes: {
    fundamento: string;
    acertos: number;
    erros: number;
    eficiencia: number;
  }[];
  eficienciaGeral?: number;
  treinoId: string;
  nomeTreino: string;
  local: string;
  presenca: boolean;
  justificativa?: string;
  fundamentos: FundamentoAvaliacao[];
}

interface HistoricoTreinosAtletaProps {
  historico: HistoricoTreinoPorAtleta[];
  title?: string;
}

export function HistoricoTreinosAtleta({ historico, title = 'Histórico de Treinos' }: HistoricoTreinosAtletaProps) {
  const [historicoParsed, setHistoricoParsed] = useState<HistoricoTreino[]>([]);
  const [selectedTreinoId, setSelectedTreinoId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>('treinos');

  useEffect(() => {
    if (historico && historico.length > 0) {
      // Converter o formato recebido para o formato usado internamente
      const parsedData = historico.map(treino => {
        // Calcular a eficiência para os fundamentos
        const avaliacoes = treino.fundamentos.map(fund => {
          // Se os campos acertos e erros não existirem, calculá-los a partir da pontuação
          const acertos = fund.acertos !== undefined ? fund.acertos : Math.round(fund.pontuacao * fund.totalEventos / 100);
          const erros = fund.erros !== undefined ? fund.erros : fund.totalEventos - acertos;
          
          const eficiencia = fund.totalEventos > 0
            ? (acertos / fund.totalEventos) * 100
            : 0;
            
          return {
            fundamento: fund.fundamento,
            acertos,
            erros,
            eficiencia
          };
        });

        // Calcular a eficiência geral
        let eficienciaGeral = 0;
        if (avaliacoes.length > 0) {
          const totalAcertos = avaliacoes.reduce((sum, av) => sum + av.acertos, 0);
          const totalEventos = avaliacoes.reduce((sum, av) => sum + (av.acertos + av.erros), 0);
          eficienciaGeral = totalEventos > 0 ? (totalAcertos / totalEventos) * 100 : 0;
        }

        // Formatar a data
        const dataObj = new Date(treino.data);
        const dataFormatada = format(dataObj, "dd 'de' MMMM", { locale: ptBR });

        return {
          id: treino.treinoId,
          nome: treino.nomeTreino,
          data: treino.data,
          dataFormatada,
          avaliacoes,
          eficienciaGeral,
          treinoId: treino.treinoId,
          nomeTreino: treino.nomeTreino,
          local: treino.local,
          presenca: treino.presenca,
          justificativa: treino.justificativa,
          fundamentos: treino.fundamentos,
        };
      });

      setHistoricoParsed(parsedData);

      // Selecionar o primeiro treino por padrão
      if (parsedData.length > 0 && !selectedTreinoId) {
        setSelectedTreinoId(parsedData[0].id);
      }
    }
  }, [historico, selectedTreinoId]);

  if (!historico || historico.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>Nenhum histórico de treino encontrado.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Encontrar o treino selecionado para exibir detalhes
  const selectedTreino = historicoParsed.find(treino => treino.id === selectedTreinoId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>
          Acompanhe o histórico de participação em treinos e desempenho por fundamento
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="treinos">Últimos Treinos</TabsTrigger>
            <TabsTrigger value="detalhes">Detalhes do Treino</TabsTrigger>
          </TabsList>

          <TabsContent value="treinos">
            <div className="grid gap-2">
              {historicoParsed.map((treino) => (
                <div
                  key={treino.id}
                  className={`p-3 border rounded flex justify-between items-center cursor-pointer hover:bg-accent ${
                    treino.id === selectedTreinoId ? 'border-primary' : ''
                  }`}
                  onClick={() => {
                    setSelectedTreinoId(treino.id);
                    setSelectedTab('detalhes');
                  }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{treino.nomeTreino}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {treino.dataFormatada} | {treino.local || 'Local não informado'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className={`font-medium ${treino.presenca ? 'text-green-600' : 'text-red-600'}`}>
                        {treino.presenca ? 'Presente' : 'Ausente'}
                      </span>
                      <div className="text-sm text-muted-foreground">
                        {treino.avaliacoes.length} fundamentos avaliados
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="detalhes">
            {selectedTreino && (
              <div>
                <div className="mb-4">
                  <h3 className="text-lg font-medium">{selectedTreino.nomeTreino}</h3>
                  <p className="text-muted-foreground">
                    {selectedTreino.dataFormatada} | {selectedTreino.local || 'Local não informado'}
                  </p>
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                      selectedTreino.presenca 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedTreino.presenca ? 'Presente' : 'Ausente'}
                    </span>
                    {!selectedTreino.presenca && selectedTreino.justificativa && (
                      <p className="mt-1 italic text-sm">
                        Justificativa: {selectedTreino.justificativa}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Desempenho por Fundamento</h4>
                  {selectedTreino.avaliacoes.length > 0 ? (
                    <div className="space-y-2">
                      {selectedTreino.avaliacoes.map((av, index) => (
                        <div key={index} className="bg-accent/40 p-3 rounded">
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">{av.fundamento}</span>
                            <span>{av.eficiencia.toFixed(0)}% de eficiência</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="text-green-600">Acertos: {av.acertos}</div>
                            <div className="text-red-600">Erros: {av.erros}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      Nenhum fundamento avaliado neste treino.
                    </p>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4">
        <p className="text-sm text-muted-foreground">
          Total de treinos: {historicoParsed.length}
        </p>
        {selectedTreino && (
          <p className="text-sm">
            Eficiência geral: <span className="font-medium">{selectedTreino.eficienciaGeral?.toFixed(0) || 0}%</span>
          </p>
        )}
      </CardFooter>
    </Card>
  );
}

// Exportar também como default para compatibilidade com imports existentes
export default HistoricoTreinosAtleta;
