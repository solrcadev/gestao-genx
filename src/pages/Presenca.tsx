
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
  DialogTrigger
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
    error 
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
    setJustificativaTipo(atleta.justificativa_tipo || null);
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
    });
    
    setDialogOpen(false);
    setEditingAtleta(null);
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
    const atletasComFaltas = atletas.filter(a => !a.presente && 
      (!a.justificativa_tipo || a.justificativa_tipo === JustificativaTipo.SEM_JUSTIFICATIVA));
      
    if (atletasComFaltas.length > 0) {
      return atletasComFaltas.map(a => a.nome);
    }
    return [];
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
                            {atleta.indice_esforco !== null && atleta.indice_esforco !== undefined ? (
                              <div className="flex items-center gap-2">
                                <div 
                                  className={`h-3 w-3 rounded-full ${getEsforcoColor(atleta.indice_esforco)}`}
                                ></div>
                                <span>
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
      
      {/* Modal de Edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAtleta && (
                <>
                  {editingAtleta.presente ? 'Editar Presença' : 'Editar Justificativa'}:
                  {' '}{editingAtleta.nome}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {editingAtleta?.presente ? (
                'Gerencie os detalhes da presença deste atleta'
              ) : (
                'Informe a justificativa para a ausência deste atleta'
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Status de Presença */}
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="status" className="text-right">Status</label>
              <div className="col-span-3">
                <div className="flex items-center space-x-2">
                  <Button
                    variant={editingAtleta?.presente ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEditingAtleta(prev => prev ? {...prev, presente: true} : null)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Presente
                  </Button>
                  <Button
                    variant={!editingAtleta?.presente ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEditingAtleta(prev => prev ? {...prev, presente: false} : null)}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Ausente
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Justificativa (se ausente) */}
            {editingAtleta && !editingAtleta.presente && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="tipo" className="text-right">Tipo</label>
                  <div className="col-span-3">
                    <Select 
                      value={justificativaTipo || undefined}
                      onValueChange={(value) => setJustificativaTipo(value as JustificativaTipo)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de justificativa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={JustificativaTipo.MOTIVO_PESSOAL}>
                          Motivo Pessoal
                        </SelectItem>
                        <SelectItem value={JustificativaTipo.MOTIVO_ACADEMICO}>
                          Motivo Acadêmico
                        </SelectItem>
                        <SelectItem value={JustificativaTipo.MOTIVO_LOGISTICO}>
                          Motivo Logístico
                        </SelectItem>
                        <SelectItem value={JustificativaTipo.MOTIVO_SAUDE}>
                          Motivo de Saúde
                        </SelectItem>
                        <SelectItem value={JustificativaTipo.SEM_JUSTIFICATIVA}>
                          Sem Justificativa
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="justificativa" className="text-right align-top pt-2">
                    Justificativa
                  </label>
                  <Textarea
                    id="justificativa"
                    placeholder="Descreva o motivo da ausência..."
                    className="col-span-3"
                    value={justificativa}
                    onChange={(e) => setJustificativa(e.target.value)}
                  />
                </div>
              </>
            )}
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
    </div>
  );
};

export default Presenca;
