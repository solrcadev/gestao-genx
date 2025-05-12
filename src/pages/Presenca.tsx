import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  useTreinosComPresenca, 
  useSalvarPresenca, 
  JustificativaTipo,
  TreinoComPresenca,
  AtletaPresenca
} from '@/hooks/attendance-hooks';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  CalendarClock,
  Users,
  Info,
  BarChart,
  ChevronDown,
  ListChecks,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import ResumoPresencas from '@/components/presenca/ResumoPresencas';
import { ResumoPresencaAtleta, buscarResumoPresencas, buscarHistoricoPresenca } from '@/services/presencaService';
import { HistoricoPresenca } from '@/components/presenca/DetalhePresencaModal';
import DetalhePresencaModal from '@/components/presenca/DetalhePresencaModal';
import DocumentacaoLink from '@/components/presenca/DocumentacaoLink';
import HistoricoButton from '@/components/presenca/HistoricoButton';

const Presenca = () => {
  const { user, userRole, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('resumo');
  const [selectedTreinoId, setSelectedTreinoId] = useState<string | null>(null);
  const [editingAtleta, setEditingAtleta] = useState<AtletaPresenca | null>(null);
  const [justificativa, setJustificativa] = useState<string>('');
  const [justificativaTipo, setJustificativaTipo] = useState<JustificativaTipo | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resumos, setResumos] = useState<ResumoPresencaAtleta[]>([]);
  const [loadingResumos, setLoadingResumos] = useState(false);
  
  // Estado para o modal de histórico detalhado
  const [historico, setHistorico] = useState<HistoricoPresenca[]>([]);
  const [selectedAtletaParaHistorico, setSelectedAtletaParaHistorico] = useState<{id: string; nome: string; indice_esforco?: number} | null>(null);
  const [historicoModalOpen, setHistoricoModalOpen] = useState(false);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  
  // Verificar se o usuário é técnico ou monitor
  const isTecnico = userRole === 'tecnico';
  const isMonitor = userRole === 'monitor';
  
  // Buscar treinos com presença (para a aba de listagem por treino)
  const { 
    data: treinos, 
    isLoading: loadingTreinos,
    isError,
    error,
    refetch: refetchTreinos
  } = useTreinosComPresenca();
  
  // Mutation para salvar presença
  const { mutate: salvarPresenca, isPending } = useSalvarPresenca();
  
  // Encontrar o treino selecionado
  const selectedTreino = treinos?.find(t => t.id === selectedTreinoId);
  
  // Carregar dados de resumo
  useEffect(() => {
    const loadResumos = async () => {
      setLoadingResumos(true);
      try {
        const data = await buscarResumoPresencas();
        setResumos(data);
      } catch (error) {
        console.error('Erro ao carregar resumos:', error);
        toast.error('Erro ao carregar resumos de presença');
      } finally {
        setLoadingResumos(false);
      }
    };
    
    loadResumos();
  }, []);
  
  // Buscar histórico detalhado de presença para um atleta
  const handleVerHistorico = async (atletaId: string): Promise<HistoricoPresenca[]> => {
    return await buscarHistoricoPresenca(atletaId);
  };
  
  // Ver histórico detalhado do atleta na visualização por treino
  const handleVerHistoricoTreino = async (atleta: AtletaPresenca) => {
    setLoadingHistorico(true);
    setSelectedAtletaParaHistorico({
      id: atleta.id,
      nome: atleta.nome,
      indice_esforco: atleta.indice_esforco
    });
    
    try {
      console.log('Buscando histórico para:', atleta.nome, 'ID:', atleta.id);
      const data = await buscarHistoricoPresenca(atleta.id);
      console.log('Histórico recebido:', data.length, 'registros');
      setHistorico(data);
      setHistoricoModalOpen(true);
    } catch (error) {
      console.error('Erro ao carregar histórico de presença:', error);
      toast.error('Não foi possível carregar o histórico de presença');
    } finally {
      setLoadingHistorico(false);
    }
  };
  
  // Ao selecionar um treino
  const handleTreinoSelect = (treinoId: string) => {
    setSelectedTreinoId(treinoId);
  };
  
  // Abrir modal de edição
  const handleEditAtleta = (atleta: AtletaPresenca) => {
    setEditingAtleta(atleta);
    setJustificativa(atleta.justificativa || '');
    setJustificativaTipo(atleta.justificativa_tipo || JustificativaTipo.SEM_JUSTIFICATIVA);
    setDialogOpen(true);
  };
  
  // Salvar alterações
  const handleSaveChanges = () => {
    if (!editingAtleta || !selectedTreinoId) return;
    
    const data = {
      treinoId: selectedTreinoId,
      atletaId: editingAtleta.id,
      presente: editingAtleta.presente,
      justificativa: justificativa,
      justificativaTipo: justificativaTipo as JustificativaTipo,
      precisaAprovacao: isMonitor // Marcar para aprovação se for monitor
    };
    
    salvarPresenca(data, {
      onSuccess: async () => {
        // Recarregar ambas listas de dados
        refetchTreinos();
        
        // Recarregar resumos também
        const newResumos = await buscarResumoPresencas();
        setResumos(newResumos);
        
        setDialogOpen(false);
        setEditingAtleta(null);
        
        if (isMonitor) {
          toast.success('Alteração salva e enviada para aprovação do técnico');
        } else {
          toast.success('Alteração salva com sucesso');
        }
      }
    });
  };
  
  // Alternar presença/ausência
  const togglePresenca = (atleta: AtletaPresenca) => {
    const novoStatus = !atleta.presente;
    
    if (!novoStatus) {
      // Se marcar como ausente, abrir diálogo para justificativa
      setEditingAtleta({...atleta, presente: false});
      setJustificativa(atleta.justificativa || '');
      setJustificativaTipo(atleta.justificativa_tipo || JustificativaTipo.SEM_JUSTIFICATIVA);
      setDialogOpen(true);
    } else {
      // Se marcar como presente, salvar diretamente
      const data = {
        treinoId: selectedTreinoId!,
        atletaId: atleta.id,
        presente: true,
        precisaAprovacao: isMonitor // Marcar para aprovação se for monitor
      };
      
      salvarPresenca(data, {
        onSuccess: async () => {
          // Recarregar ambas listas de dados
          refetchTreinos();
          
          // Recarregar resumos também
          const newResumos = await buscarResumoPresencas();
          setResumos(newResumos);
          
          if (isMonitor) {
            toast.success('Alteração salva e enviada para aprovação do técnico');
          } else {
            toast.success('Alteração salva com sucesso');
          }
        }
      });
    }
  };
  
  // Calcular cor do índice de esforço
  const getEsforcoColor = (indice?: number) => {
    if (indice === undefined || indice === null) return "bg-gray-200";
    if (indice >= 0.8) return "bg-green-500";
    if (indice >= 0.5) return "bg-green-300";
    if (indice >= 0) return "bg-yellow-300";
    if (indice >= -0.5) return "bg-orange-400";
    return "bg-red-500";
  };
  
  // Converter índice em percentual
  const getIndiceAsPercentage = (indice: number | undefined) => {
    if (indice === undefined || indice === null) return 50;
    // Convert from -1..1 to 0..100
    return (indice + 1) * 50;
  };
  
  if (authLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <h1 className="text-2xl font-bold mb-6">Carregando...</h1>
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </div>
    );
  }
  
  // Verificar permissão (apenas técnicos ou monitores)
  if (user && !['tecnico', 'monitor'].includes(userRole)) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acesso restrito</AlertTitle>
          <AlertDescription>
            Somente técnicos e monitores podem acessar a gestão de presenças.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <h1 className="text-2xl font-bold mb-6">Gestão de Presenças</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar dados</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : 'Ocorreu um erro ao carregar os treinos.'}
          </AlertDescription>
        </Alert>
        
        <div className="mt-4 p-4 bg-gray-100 rounded-md">
          <h3 className="font-medium mb-2">Informações para suporte técnico:</h3>
          <p className="text-sm text-muted-foreground mb-2">
            Se o problema persistir, verifique se:
          </p>
          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
            <li>A tabela <code className="bg-gray-200 px-1 rounded">treinos_presencas</code> está configurada corretamente no Supabase</li>
            <li>Os relacionamentos entre as tabelas estão funcionando</li>
            <li>O usuário tem permissões para acessar as tabelas relacionadas a treinos e presenças</li>
          </ul>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Users className="h-6 w-6" />
        Gerenciar Presenças
      </h1>
      
      {isMonitor && (
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>Modo Monitor</AlertTitle>
          <AlertDescription>
            Como monitor, suas alterações serão enviadas para aprovação dos técnicos.
          </AlertDescription>
        </Alert>
      )}
      
      <DocumentacaoLink />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4 mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="resumo" className="flex items-center gap-1">
            <BarChart className="h-4 w-4" /> 
            Resumo por Atleta
          </TabsTrigger>
          <TabsTrigger value="treinos" className="flex items-center gap-1">
            <ListChecks className="h-4 w-4" /> 
            Listagem por Treino
          </TabsTrigger>
        </TabsList>
      
        <TabsContent value="resumo" className="space-y-4">
          <ResumoPresencas 
            resumos={resumos}
            isLoading={loadingResumos}
            onVerHistorico={handleVerHistorico}
          />
        </TabsContent>
        
        <TabsContent value="treinos" className="space-y-4">
          {loadingTreinos ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-6 w-48" />
                </CardTitle>
                <CardDescription>
                  <Skeleton className="h-4 w-64" />
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[400px] w-full" />
              </CardContent>
            </Card>
          ) : treinos && treinos.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {treinos.map(treino => (
                  <Card 
                    key={treino.id}
                    className={`cursor-pointer hover:bg-accent transition-colors ${
                      selectedTreinoId === treino.id ? 'border-primary bg-accent' : ''
                    }`}
                    onClick={() => handleTreinoSelect(treino.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{treino.nome}</CardTitle>
                        {selectedTreinoId === treino.id && (
                          <Badge variant="default">Selecionado</Badge>
                        )}
                      </div>
                      <CardDescription>{treino.dataFormatada}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm">
                        <div className="flex items-center gap-1 mb-1">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>
                            {treino.atletas.filter(a => a.presente).length} presentes
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span>
                            {treino.atletas.filter(a => !a.presente).length} ausentes
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {selectedTreino && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarClock className="h-5 w-5" />
                      {selectedTreino.nome}
                    </CardTitle>
                    <CardDescription>
                      {selectedTreino.dataFormatada} - Lista de Presenças
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Atleta</TableHead>
                          <TableHead>Posição</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Justificativa</TableHead>
                          <TableHead className="text-right">Esforço</TableHead>
                          <TableHead>Ações</TableHead>
                          <TableHead className="w-8"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedTreino.atletas.map(atleta => (
                          <TableRow key={atleta.id}>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Avatar className="h-8 w-8">
                                  {atleta.foto_url ? <AvatarImage src={atleta.foto_url} /> : null}
                                  <AvatarFallback>
                                    {atleta.nome.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{atleta.nome}</span>
                              </div>
                            </TableCell>
                            <TableCell>{atleta.posicao}</TableCell>
                            <TableCell>
                              {atleta.presente ? (
                                <Badge className="bg-green-500 hover:bg-green-600">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Presente
                                </Badge>
                              ) : (
                                <Badge className="bg-red-500 hover:bg-red-600">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Ausente
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {!atleta.presente ? (
                                atleta.justificativa ? (
                                  <div className="flex flex-col">
                                    <span className="text-sm">
                                      {atleta.justificativa}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {atleta.justificativa_tipo === JustificativaTipo.MOTIVO_ACADEMICO && "Motivo Acadêmico"}
                                      {atleta.justificativa_tipo === JustificativaTipo.MOTIVO_SAUDE && "Motivo de Saúde"}
                                      {atleta.justificativa_tipo === JustificativaTipo.MOTIVO_LOGISTICO && "Motivo Logístico"}
                                      {atleta.justificativa_tipo === JustificativaTipo.MOTIVO_PESSOAL && "Motivo Pessoal"}
                                      {atleta.justificativa_tipo === JustificativaTipo.SEM_JUSTIFICATIVA && "Sem Justificativa"}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground italic">Sem justificativa</span>
                                )
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {atleta.indice_esforco !== undefined && (
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-12 h-2 rounded-full overflow-hidden bg-gray-200">
                                    <div 
                                      className={`h-full ${getEsforcoColor(atleta.indice_esforco)}`}
                                      style={{ width: `${getIndiceAsPercentage(atleta.indice_esforco)}%` }}
                                    />
                                  </div>
                                  <span className="text-xs">
                                    {Math.round(getIndiceAsPercentage(atleta.indice_esforco))}%
                                  </span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-8"
                                onClick={() => togglePresenca(atleta)}
                                disabled={isPending}
                              >
                                {atleta.presente ? 'Marcar Ausente' : 'Marcar Presente'}
                              </Button>
                            </TableCell>
                            <TableCell>
                              <HistoricoButton 
                                onClick={() => handleVerHistoricoTreino(atleta)}
                                isLoading={loadingHistorico}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <CalendarClock className="h-12 w-12 mb-2 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-1">Nenhum treino registrado</h3>
                <p className="text-muted-foreground">
                  Não há treinos com registros de presença disponíveis.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Modal para edição de justificativa */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Justificativa</DialogTitle>
            <DialogDescription>
              {editingAtleta?.nome} - {selectedTreino?.dataFormatada}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <Select
              value={justificativaTipo || JustificativaTipo.SEM_JUSTIFICATIVA}
              onValueChange={(value) => setJustificativaTipo(value as JustificativaTipo)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de justificativa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={JustificativaTipo.SEM_JUSTIFICATIVA}>
                  Falta sem Justificativa
                </SelectItem>
                <SelectItem value={JustificativaTipo.MOTIVO_PESSOAL}>
                  Falta Justificada - Motivo Pessoal
                </SelectItem>
                <SelectItem value={JustificativaTipo.MOTIVO_LOGISTICO}>
                  Falta Justificada - Motivo Logístico
                </SelectItem>
                <SelectItem value={JustificativaTipo.MOTIVO_ACADEMICO}>
                  Falta Justificada - Motivo Acadêmico
                </SelectItem>
                <SelectItem value={JustificativaTipo.MOTIVO_SAUDE}>
                  Falta Justificada - Motivo de Saúde
                </SelectItem>
              </SelectContent>
            </Select>
            
            <Textarea
              placeholder="Descreva detalhes da justificativa (opcional)"
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              rows={4}
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveChanges} disabled={isPending}>
              {isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal para visualização detalhada do histórico */}
      {selectedAtletaParaHistorico && (
        <DetalhePresencaModal
          isOpen={historicoModalOpen}
          onClose={() => setHistoricoModalOpen(false)}
          atleta={selectedAtletaParaHistorico}
          historico={historico}
        />
      )}
    </div>
  );
};

export default Presenca;
