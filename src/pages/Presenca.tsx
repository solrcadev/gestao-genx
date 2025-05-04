
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
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
  Info
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

const Presenca = () => {
  const { profile, isLoading: authLoading } = useAuth();
  const [selectedTreinoId, setSelectedTreinoId] = useState<string | null>(null);
  const [editingAtleta, setEditingAtleta] = useState<AtletaPresenca | null>(null);
  const [justificativa, setJustificativa] = useState<string>('');
  const [justificativaTipo, setJustificativaTipo] = useState<JustificativaTipo | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Buscar treinos com presença
  const { 
    data: treinos, 
    isLoading,
    isError,
    error,
    refetch
  } = useTreinosComPresenca();
  
  // Mutation para salvar presença
  const { mutate: salvarPresenca, isPending } = useSalvarPresenca();
  
  // Encontrar o treino selecionado
  const selectedTreino = treinos?.find(t => t.id === selectedTreinoId);
  
  // Ao selecionar um treino
  const handleTreinoSelect = (treinoId: string) => {
    setSelectedTreinoId(treinoId);
  };
  
  // Formatar data
  const formatarData = (dataString: string) => {
    try {
      const data = new Date(dataString);
      return format(data, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch (e) {
      return dataString;
    }
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
    
    salvarPresenca({
      treinoId: selectedTreinoId,
      atletaId: editingAtleta.id,
      presente: editingAtleta.presente,
      justificativa: justificativa,
      justificativaTipo: justificativaTipo as JustificativaTipo
    }, {
      onSuccess: () => {
        refetch();
        setDialogOpen(false);
        setEditingAtleta(null);
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
      salvarPresenca({
        treinoId: selectedTreinoId!,
        atletaId: atleta.id,
        presente: true
      }, {
        onSuccess: () => {
          refetch();
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
  
  // Verificar faltas consecutivas
  const verificarFaltasConsecutivas = (atletas: AtletaPresenca[]) => {
    // Implementação básica - idealmente isso seria calculado no servidor
    return atletas.filter(a => !a.presente && 
      (!a.justificativa_tipo || a.justificativa_tipo === JustificativaTipo.SEM_JUSTIFICATIVA))
      .map(a => a.nome);
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
  
  // Verificar permissão (apenas técnicos)
  if (profile && profile.funcao !== 'tecnico') {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acesso restrito</AlertTitle>
          <AlertDescription>
            Somente técnicos podem acessar a gestão de presenças.
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
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Users className="h-6 w-6" />
        Gestão de Presenças
      </h1>
      
      <div className="grid md:grid-cols-12 gap-6">
        {/* Lista de treinos */}
        <div className="md:col-span-4 lg:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5" />
                Treinos Recentes
              </CardTitle>
              <CardDescription>
                Selecione um treino para gerenciar presenças
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : treinos && treinos.length > 0 ? (
                <div className="space-y-2">
                  {treinos.map(treino => (
                    <Button 
                      key={treino.id}
                      variant={selectedTreinoId === treino.id ? "default" : "outline"} 
                      className={`w-full justify-start ${selectedTreinoId === treino.id ? '' : 'hover:bg-accent'}`}
                      onClick={() => handleTreinoSelect(treino.id)}
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{treino.nome}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatarData(treino.data)}
                        </span>
                      </div>
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 text-muted-foreground">
                  Nenhum treino encontrado
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Lista de atletas do treino selecionado */}
        <div className="md:col-span-8 lg:col-span-9">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedTreino ? (
                  <div className="flex flex-col">
                    <span>{selectedTreino.nome}</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {formatarData(selectedTreino.data)}
                    </span>
                  </div>
                ) : (
                  "Selecione um treino"
                )}
              </CardTitle>
              <CardDescription>
                Gerencie a presença dos atletas neste treino
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedTreino ? (
                <>
                  {/* Alertas */}
                  {selectedTreino.atletas.some(a => !a.presente && 
                    (!a.justificativa_tipo || a.justificativa_tipo === JustificativaTipo.SEM_JUSTIFICATIVA)) && (
                    <Alert className="mb-4 border-amber-500">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Ausências sem justificativa</AlertTitle>
                      <AlertDescription>
                        Existem atletas ausentes sem justificativa neste treino.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {/* Tabela de atletas */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">Atleta</TableHead>
                        <TableHead>Presença</TableHead>
                        <TableHead>Justificativa</TableHead>
                        <TableHead>Índice de Esforço</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedTreino.atletas.map((atleta) => (
                        <TableRow key={atleta.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                {atleta.foto_url ? (
                                  <AvatarImage src={atleta.foto_url} alt={atleta.nome} />
                                ) : (
                                  <AvatarFallback>{atleta.nome.substring(0, 2).toUpperCase()}</AvatarFallback>
                                )}
                              </Avatar>
                              <div>
                                <div>{atleta.nome}</div>
                                <div className="text-xs text-muted-foreground">{atleta.posicao}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`flex items-center gap-1 ${atleta.presente ? 'text-green-600' : 'text-red-600'}`}
                              onClick={() => togglePresenca(atleta)}
                            >
                              {atleta.presente ? (
                                <>
                                  <CheckCircle className="h-4 w-4" />
                                  <span>Presente</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4" />
                                  <span>Ausente</span>
                                </>
                              )}
                            </Button>
                          </TableCell>
                          <TableCell>
                            {!atleta.presente && (
                              <>
                                {atleta.justificativa_tipo ? (
                                  <Badge variant="outline" className="font-normal">
                                    {atleta.justificativa_tipo === JustificativaTipo.MOTIVO_PESSOAL && 'Motivo Pessoal'}
                                    {atleta.justificativa_tipo === JustificativaTipo.MOTIVO_ACADEMICO && 'Motivo Acadêmico'}
                                    {atleta.justificativa_tipo === JustificativaTipo.MOTIVO_LOGISTICO && 'Motivo Logístico'}
                                    {atleta.justificativa_tipo === JustificativaTipo.MOTIVO_SAUDE && 'Motivo de Saúde'}
                                    {atleta.justificativa_tipo === JustificativaTipo.SEM_JUSTIFICATIVA && 'Sem Justificativa'}
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive" className="font-normal">Sem Justificativa</Badge>
                                )}
                                {atleta.justificativa && (
                                  <p className="text-xs text-muted-foreground mt-1 truncate max-w-xs">
                                    {atleta.justificativa}
                                  </p>
                                )}
                              </>
                            )}
                          </TableCell>
                          <TableCell>
                            {typeof atleta.indice_esforco === 'number' ? (
                              <div className="flex items-center gap-2">
                                <Progress 
                                  value={getIndiceAsPercentage(atleta.indice_esforco)} 
                                  className={`h-2 w-16 ${getEsforcoColor(atleta.indice_esforco)}`}
                                />
                                <span className="text-sm">
                                  {(atleta.indice_esforco * 100).toFixed(0)}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Não calculado</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditAtleta(atleta)}
                              disabled={isPending}
                            >
                              <Info className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              ) : (
                <div className="text-center p-6 text-muted-foreground">
                  Selecione um treino para ver a lista de atletas
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Modal de edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAtleta ? `Editar presença - ${editingAtleta.nome}` : 'Editar presença'}
            </DialogTitle>
            <DialogDescription>
              Atualize a presença e justificativa do atleta neste treino.
            </DialogDescription>
          </DialogHeader>
          
          {editingAtleta && (
            <div className="space-y-4 py-2">
              {/* Status de Presença */}
              <div className="flex items-center justify-between">
                <span className="font-medium">Status:</span>
                <div className="flex items-center gap-2">
                  <Button 
                    variant={editingAtleta.presente ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEditingAtleta({...editingAtleta, presente: true})}
                    className="gap-1"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Presente
                  </Button>
                  <Button 
                    variant={!editingAtleta.presente ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEditingAtleta({...editingAtleta, presente: false})}
                    className="gap-1"
                  >
                    <XCircle className="h-4 w-4" />
                    Ausente
                  </Button>
                </div>
              </div>
              
              {/* Tipo de Justificativa */}
              {!editingAtleta.presente && (
                <div className="space-y-2">
                  <label className="font-medium">Tipo de Justificativa:</label>
                  <Select 
                    value={justificativaTipo || JustificativaTipo.SEM_JUSTIFICATIVA} 
                    onValueChange={(value) => setJustificativaTipo(value as JustificativaTipo)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de justificativa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={JustificativaTipo.MOTIVO_PESSOAL}>Motivo Pessoal</SelectItem>
                      <SelectItem value={JustificativaTipo.MOTIVO_ACADEMICO}>Motivo Acadêmico</SelectItem>
                      <SelectItem value={JustificativaTipo.MOTIVO_LOGISTICO}>Motivo Logístico</SelectItem>
                      <SelectItem value={JustificativaTipo.MOTIVO_SAUDE}>Motivo de Saúde</SelectItem>
                      <SelectItem value={JustificativaTipo.SEM_JUSTIFICATIVA}>Sem Justificativa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* Justificativa */}
              {!editingAtleta.presente && (
                <div className="space-y-2">
                  <label className="font-medium">Justificativa:</label>
                  <Textarea 
                    placeholder="Descreva a justificativa da ausência"
                    value={justificativa}
                    onChange={(e) => setJustificativa(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
              
              {/* Índice de Esforço */}
              <div className="space-y-2 border-t pt-4">
                <label className="font-medium">Índice de Esforço Atual:</label>
                {typeof editingAtleta.indice_esforco === 'number' ? (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Progress 
                        value={getIndiceAsPercentage(editingAtleta.indice_esforco)} 
                        className={`h-2.5 ${getEsforcoColor(editingAtleta.indice_esforco)}`}
                      />
                      <span>
                        {(editingAtleta.indice_esforco * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Este valor é calculado com base nas presenças e tipos de justificativa nos últimos treinos.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Não há dados suficientes para calcular o índice de esforço.
                  </p>
                )}
              </div>
              
              {/* Impacto da Alteração */}
              {!editingAtleta.presente && (
                <div className="bg-muted p-3 rounded-md">
                  <h4 className="font-medium text-sm mb-1">Impacto desta alteração:</h4>
                  <p className="text-xs text-muted-foreground">
                    {justificativaTipo === JustificativaTipo.SEM_JUSTIFICATIVA && (
                      "Esta ausência sem justificativa terá impacto negativo no índice de esforço."
                    )}
                    {justificativaTipo === JustificativaTipo.MOTIVO_LOGISTICO && (
                      "Esta ausência por motivo logístico terá impacto parcial no índice de esforço."
                    )}
                    {(justificativaTipo === JustificativaTipo.MOTIVO_PESSOAL || 
                      justificativaTipo === JustificativaTipo.MOTIVO_ACADEMICO || 
                      justificativaTipo === JustificativaTipo.MOTIVO_SAUDE) && (
                      "Esta ausência com justificativa válida não terá impacto no índice de esforço."
                    )}
                  </p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveChanges} disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Presenca;
