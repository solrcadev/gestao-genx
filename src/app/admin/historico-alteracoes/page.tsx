'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { CalendarIcon, FilterIcon, SearchIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buscarHistoricoAlteracoes, HistoricoAlteracao } from '@/services/presencaService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import PageTitle from '@/components/PageTitle';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function HistoricoAlteracoesPage() {
  const [historico, setHistorico] = useState<HistoricoAlteracao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    dataInicial: undefined as Date | undefined,
    dataFinal: undefined as Date | undefined,
    tipoOperacao: undefined as 'edicao' | 'exclusao' | 'criacao' | undefined,
    busca: ''
  });
  const [mostraFiltros, setMostraFiltros] = useState(false);

  useEffect(() => {
    carregarHistorico();
  }, [filtros.dataInicial, filtros.dataFinal, filtros.tipoOperacao]);

  const carregarHistorico = async () => {
    setLoading(true);
    try {
      const historico = await buscarHistoricoAlteracoes({
        dataInicial: filtros.dataInicial,
        dataFinal: filtros.dataFinal,
        tipoOperacao: filtros.tipoOperacao
      });
      setHistorico(historico);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      toast.error('Erro ao carregar histórico de alterações');
    } finally {
      setLoading(false);
    }
  };

  const filtrarHistorico = () => {
    if (!filtros.busca) return historico;
    
    const termoBusca = filtros.busca.toLowerCase();
    return historico.filter(item => 
      (item.atleta?.nome?.toLowerCase().includes(termoBusca)) ||
      (item.treino?.nome?.toLowerCase().includes(termoBusca)) ||
      (item.usuario?.email?.toLowerCase().includes(termoBusca))
    );
  };

  const aplicarFiltro = () => {
    carregarHistorico();
  };

  const limparFiltros = () => {
    setFiltros({
      dataInicial: undefined,
      dataFinal: undefined,
      tipoOperacao: undefined,
      busca: ''
    });
  };

  const getStatusText = (status: boolean | null) => {
    if (status === true) return 'Presente';
    if (status === false) return 'Ausente';
    return 'Não definido';
  };

  const getTipoOperacaoText = (tipo: string) => {
    switch (tipo) {
      case 'edicao': return 'Edição';
      case 'exclusao': return 'Exclusão';
      case 'criacao': return 'Criação';
      default: return tipo;
    }
  };

  const getTipoOperacaoBadge = (tipo: string) => {
    let variant = '';
    switch (tipo) {
      case 'edicao':
        variant = 'outline';
        break;
      case 'exclusao':
        variant = 'destructive';
        break;
      case 'criacao':
        variant = 'default';
        break;
      default:
        variant = 'secondary';
    }
    
    return (
      <Badge variant={variant as any}>{getTipoOperacaoText(tipo)}</Badge>
    );
  };

  const historicoFiltrado = filtrarHistorico();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageTitle title="Histórico de Alterações" subtitle="Registro de modificações na presença dos atletas" />
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Registro de Atividades</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setMostraFiltros(!mostraFiltros)}>
              <FilterIcon className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>
          <CardDescription>
            Total de {historicoFiltrado.length} registros encontrados
          </CardDescription>
        </CardHeader>
        
        {mostraFiltros && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <Label htmlFor="dataInicial">Data Inicial</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="dataInicial"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filtros.dataInicial ? (
                        format(filtros.dataInicial, 'dd/MM/yyyy', { locale: pt })
                      ) : (
                        <span>Selecione...</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filtros.dataInicial}
                      onSelect={(date) => setFiltros(prev => ({ ...prev, dataInicial: date }))}
                      locale={pt}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <Label htmlFor="dataFinal">Data Final</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="dataFinal"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filtros.dataFinal ? (
                        format(filtros.dataFinal, 'dd/MM/yyyy', { locale: pt })
                      ) : (
                        <span>Selecione...</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filtros.dataFinal}
                      onSelect={(date) => setFiltros(prev => ({ ...prev, dataFinal: date }))}
                      locale={pt}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <Label htmlFor="tipoOperacao">Tipo de Operação</Label>
                <Select
                  value={filtros.tipoOperacao}
                  onValueChange={(value) => 
                    setFiltros(prev => ({ 
                      ...prev, 
                      tipoOperacao: value as 'edicao' | 'exclusao' | 'criacao' | undefined 
                    }))
                  }
                >
                  <SelectTrigger id="tipoOperacao">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="edicao">Edição</SelectItem>
                    <SelectItem value="exclusao">Exclusão</SelectItem>
                    <SelectItem value="criacao">Criação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="busca">Buscar</Label>
                <div className="flex gap-2">
                  <Input
                    id="busca"
                    placeholder="Nome, treino, usuário..."
                    value={filtros.busca}
                    onChange={(e) => setFiltros(prev => ({ ...prev, busca: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={limparFiltros}>Limpar Filtros</Button>
              <Button onClick={aplicarFiltro}>Aplicar Filtros</Button>
            </div>
          </CardContent>
        )}
        
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="w-full h-20" />
              ))}
            </div>
          ) : historicoFiltrado.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">Nenhum registro encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Atleta</TableHead>
                  <TableHead>Treino</TableHead>
                  <TableHead>Alteração</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Justificativa</TableHead>
                  <TableHead>Usuário</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historicoFiltrado.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {new Date(item.data_alteracao).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell>{item.atleta?.nome || '-'}</TableCell>
                    <TableCell>{item.treino?.nome || '-'}</TableCell>
                    <TableCell>
                      {getTipoOperacaoBadge(item.tipo_operacao)}
                    </TableCell>
                    <TableCell>
                      {item.tipo_operacao === 'exclusao' ? (
                        <span>Excluído</span>
                      ) : (
                        <>
                          {item.status_anterior !== item.status_novo && (
                            <>
                              <div className="text-xs text-muted-foreground">
                                De: {getStatusText(item.status_anterior)}
                              </div>
                              <div>
                                Para: {getStatusText(item.status_novo)}
                              </div>
                            </>
                          )}
                          {item.status_anterior === item.status_novo && (
                            <>{getStatusText(item.status_novo)}</>
                          )}
                        </>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.tipo_operacao === 'exclusao' ? (
                        <span>-</span>
                      ) : (
                        <>
                          {item.justificativa_anterior !== item.justificativa_nova && (
                            <>
                              {item.justificativa_anterior && (
                                <div className="text-xs text-muted-foreground max-w-[200px] truncate">
                                  De: {item.justificativa_anterior || '-'}
                                </div>
                              )}
                              <div className="max-w-[200px] truncate">
                                Para: {item.justificativa_nova || '-'}
                              </div>
                            </>
                          )}
                          {item.justificativa_anterior === item.justificativa_nova && (
                            <div className="max-w-[200px] truncate">
                              {item.justificativa_nova || '-'}
                            </div>
                          )}
                        </>
                      )}
                    </TableCell>
                    <TableCell>{item.usuario?.email?.split('@')[0] || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 