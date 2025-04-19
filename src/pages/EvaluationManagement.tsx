
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  Search, Filter, Calendar, User, X, Edit, Trash2, Eye, 
  Sliders, ArrowUpDown, ChevronLeft, ChevronRight, RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { AthleteEvaluation } from '@/types';
import {
  getAthletesEvaluations,
  getEvaluationById,
  updateEvaluation,
  deleteEvaluation,
  getFundamentos
} from '@/services/athletes/evaluationManagement';

// Componente principal
const EvaluationManagement = () => {
  // Estados para filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date()
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFundamento, setSelectedFundamento] = useState<string>('');
  const [scoreRange, setScoreRange] = useState([0, 100]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    acertos: 0,
    erros: 0,
    timestamp: ''
  });
  
  const { user } = useAuth();
  const { profile } = useProfile();
  const isAdmin = profile?.role === 'admin';
  const isCoach = profile?.role === 'coach';
  const canEdit = isAdmin || isCoach;
  
  // Buscar avaliações com filtros
  const { data: evaluationsData, isLoading, refetch } = useQuery({
    queryKey: ['athleteEvaluations', page, pageSize, searchQuery, dateRange, selectedFundamento, scoreRange],
    queryFn: async () => {
      const filters: any = {};
      
      if (searchQuery) {
        // A pesquisa por nome é tratada no frontend por enquanto
        // Futuramente pode-se implementar uma busca mais sofisticada no backend
      }
      
      if (dateRange.from) {
        filters.data_inicio = format(dateRange.from, 'yyyy-MM-dd');
      }
      
      if (dateRange.to) {
        filters.data_fim = format(dateRange.to, 'yyyy-MM-dd');
      }
      
      if (selectedFundamento) {
        filters.fundamento = selectedFundamento;
      }
      
      const result = await getAthletesEvaluations(filters, page, pageSize);
      return result;
    }
  });
  
  // Buscar detalhes de uma avaliação específica
  const { data: selectedEvaluation, refetch: refetchEvaluation } = useQuery({
    queryKey: ['evaluationDetail', selectedEvaluationId],
    queryFn: () => getEvaluationById(selectedEvaluationId || ''),
    enabled: !!selectedEvaluationId,
  });
  
  // Buscar lista de fundamentos para o filtro
  const { data: fundamentos } = useQuery({
    queryKey: ['fundamentos'],
    queryFn: getFundamentos
  });
  
  // Filtra avaliações com base na pesquisa de texto
  const filteredEvaluations = evaluationsData?.data.filter(evaluation => {
    const matchesSearch = !searchQuery || 
      (evaluation.atleta?.nome?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       evaluation.exercicio?.nome?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       evaluation.fundamento?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const percentual = evaluation.percentual_acerto || 0;
    const matchesScore = percentual >= scoreRange[0] && percentual <= scoreRange[1];
    
    return matchesSearch && matchesScore;
  }) || [];
  
  // Função para visualizar detalhes
  const handleViewEvaluation = (id: string) => {
    setSelectedEvaluationId(id);
    setIsViewModalOpen(true);
  };
  
  // Função para abrir modal de edição
  const handleEditEvaluation = (evaluation: AthleteEvaluation) => {
    setSelectedEvaluationId(evaluation.id);
    setEditFormData({
      acertos: evaluation.acertos,
      erros: evaluation.erros,
      timestamp: evaluation.timestamp
    });
    setIsEditModalOpen(true);
  };
  
  // Função para abrir diálogo de exclusão
  const handleDeletePrompt = (id: string) => {
    setSelectedEvaluationId(id);
    setIsDeleteDialogOpen(true);
  };
  
  // Função para salvar edição
  const handleSaveEdit = async () => {
    if (!selectedEvaluationId || !user?.id) return;
    
    try {
      const success = await updateEvaluation(
        selectedEvaluationId,
        {
          acertos: editFormData.acertos,
          erros: editFormData.erros,
          timestamp: editFormData.timestamp
        },
        user.id
      );
      
      if (success) {
        toast({
          title: "Avaliação atualizada",
          description: "Os dados da avaliação foram atualizados com sucesso.",
        });
        refetch();
        refetchEvaluation();
        setIsEditModalOpen(false);
      } else {
        toast({
          title: "Erro ao atualizar",
          description: "Não foi possível atualizar a avaliação.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar avaliação:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Ocorreu um erro ao tentar atualizar a avaliação.",
        variant: "destructive",
      });
    }
  };
  
  // Função para confirmar exclusão
  const handleConfirmDelete = async () => {
    if (!selectedEvaluationId || !user?.id) return;
    
    try {
      const success = await deleteEvaluation(selectedEvaluationId, user.id);
      
      if (success) {
        toast({
          title: "Avaliação excluída",
          description: "A avaliação foi excluída com sucesso.",
        });
        refetch();
        setIsDeleteDialogOpen(false);
      } else {
        toast({
          title: "Erro ao excluir",
          description: "Não foi possível excluir a avaliação.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao excluir avaliação:", error);
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro ao tentar excluir a avaliação.",
        variant: "destructive",
      });
    }
  };
  
  // Função para formatar data
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, 'dd/MM/yyyy HH:mm');
    } catch (error) {
      return dateStr;
    }
  };
  
  // Função para renderizar indicador colorido baseado na porcentagem
  const renderPercentIndicator = (percent: number) => {
    let color = 'bg-red-500';
    if (percent >= 80) color = 'bg-green-500';
    else if (percent >= 60) color = 'bg-yellow-500';
    
    return (
      <div className="flex items-center">
        <div className={`h-2 w-2 rounded-full ${color} mr-2`}></div>
        <span>{percent.toFixed(1)}%</span>
      </div>
    );
  };

  return (
    <div className="container py-6 space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Gerência de Avaliações</h1>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          
          <Button 
            variant={showFilters ? "secondary" : "outline"} 
            size="sm" 
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por atleta, exercício ou fundamento..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-md bg-background/50">
            <div className="space-y-2">
              <Label htmlFor="date-range">Período</Label>
              <DatePickerWithRange
                date={{
                  from: dateRange.from,
                  to: dateRange.to,
                }}
                onDateChange={(range) => {
                  if (range?.from) {
                    setDateRange({
                      from: range.from,
                      to: range.to || new Date()
                    });
                  }
                }}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fundamento">Fundamento</Label>
              <Select
                value={selectedFundamento}
                onValueChange={setSelectedFundamento}
              >
                <SelectTrigger id="fundamento">
                  <SelectValue placeholder="Selecione o fundamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {fundamentos?.map((fundamento, index) => (
                    <SelectItem key={index} value={fundamento}>
                      {fundamento}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Nota</Label>
                <span className="text-xs text-muted-foreground">
                  {scoreRange[0]}% - {scoreRange[1]}%
                </span>
              </div>
              <Slider
                defaultValue={[0, 100]}
                max={100}
                step={1}
                value={scoreRange}
                onValueChange={setScoreRange}
                className="py-4"
              />
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setSelectedFundamento('');
                  setScoreRange([0, 100]);
                  setDateRange({
                    from: new Date(new Date().setDate(new Date().getDate() - 30)),
                    to: new Date()
                  });
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        )}
        
        <div className="rounded-md border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Atleta</TableHead>
                <TableHead>Fundamento</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Acertos/Erros</TableHead>
                <TableHead>% Acerto</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Carregando avaliações...
                  </TableCell>
                </TableRow>
              ) : filteredEvaluations.length > 0 ? (
                filteredEvaluations.map((evaluation) => (
                  <TableRow key={evaluation.id}>
                    <TableCell className="font-medium">
                      {evaluation.atleta?.nome || 'Atleta não encontrado'}
                      {evaluation.atleta?.time && (
                        <Badge variant="outline" className="ml-2">
                          {evaluation.atleta.time}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{evaluation.fundamento}</TableCell>
                    <TableCell>{formatDate(evaluation.timestamp)}</TableCell>
                    <TableCell>{evaluation.acertos}/{evaluation.acertos + evaluation.erros}</TableCell>
                    <TableCell>
                      {renderPercentIndicator(evaluation.percentual_acerto || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewEvaluation(evaluation.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {canEdit && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditEvaluation(evaluation)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeletePrompt(evaluation.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Nenhuma avaliação encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {evaluationsData && evaluationsData.count > pageSize && (
          <div className="flex items-center justify-between px-2">
            <div className="text-sm text-muted-foreground">
              Mostrando {page * pageSize + 1} - {Math.min((page + 1) * pageSize, evaluationsData.count)} 
              de {evaluationsData.count} resultados
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => p + 1)}
                disabled={(page + 1) * pageSize >= (evaluationsData.count || 0)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Modal de Visualização */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes da Avaliação</DialogTitle>
            <DialogDescription>
              Informações completas sobre esta avaliação.
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvaluation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Atleta</h4>
                  <p>{selectedEvaluation.atleta?.nome}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Time</h4>
                  <p>{selectedEvaluation.atleta?.time}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Posição</h4>
                  <p>{selectedEvaluation.atleta?.posicao}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Treino</h4>
                  <p>{selectedEvaluation.treino?.nome || "N/A"}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Fundamento</h4>
                  <p>{selectedEvaluation.fundamento}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Data</h4>
                  <p>{formatDate(selectedEvaluation.timestamp)}</p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Desempenho</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Acertos:</span>
                    <span className="font-medium">{selectedEvaluation.acertos}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Erros:</span>
                    <span className="font-medium">{selectedEvaluation.erros}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total execuções:</span>
                    <span className="font-medium">{selectedEvaluation.acertos + selectedEvaluation.erros}</span>
                  </div>
                  
                  <div className="pt-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Percentual de acerto:</span>
                      <span className="font-medium">
                        {(selectedEvaluation.percentual_acerto || 0).toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={selectedEvaluation.percentual_acerto || 0} 
                      className="h-2"
                    />
                  </div>
                </div>
              </div>
              
              {selectedEvaluation.historico_edicoes && selectedEvaluation.historico_edicoes.length > 0 && (
                <>
                  <Separator />
                  
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Histórico de Edições</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedEvaluation.historico_edicoes.map((historico, index) => (
                        <div key={index} className="text-xs p-2 bg-muted rounded-md">
                          <div className="flex justify-between">
                            <span>{formatDate(historico.data)}</span>
                            <span>{historico.tecnico}</span>
                          </div>
                          <div>
                            Alterado de {historico.acertos_anterior}/{historico.acertos_anterior + historico.erros_anterior}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsViewModalOpen(false)}>
              Fechar
            </Button>
            
            {canEdit && selectedEvaluation && (
              <Button 
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleEditEvaluation(selectedEvaluation);
                }}
              >
                Editar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Avaliação</DialogTitle>
            <DialogDescription>
              Edite os dados da avaliação. Esta ação será registrada no histórico.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="acertos">Acertos</Label>
                <Input
                  id="acertos"
                  type="number"
                  min="0"
                  value={editFormData.acertos}
                  onChange={(e) => setEditFormData({
                    ...editFormData,
                    acertos: parseInt(e.target.value) || 0
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="erros">Erros</Label>
                <Input
                  id="erros"
                  type="number"
                  min="0"
                  value={editFormData.erros}
                  onChange={(e) => setEditFormData({
                    ...editFormData,
                    erros: parseInt(e.target.value) || 0
                  })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timestamp">Data e Hora</Label>
              <Input
                id="timestamp"
                type="datetime-local"
                value={editFormData.timestamp.split('.')[0]}
                onChange={(e) => setEditFormData({
                  ...editFormData,
                  timestamp: e.target.value
                })}
              />
            </div>
            
            <div className="pt-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Percentual de acerto após edição:</span>
                <span className="font-medium">
                  {editFormData.acertos + editFormData.erros > 0
                    ? ((editFormData.acertos / (editFormData.acertos + editFormData.erros)) * 100).toFixed(1)
                    : "0.0"}%
                </span>
              </div>
              <Progress 
                value={editFormData.acertos + editFormData.erros > 0
                  ? (editFormData.acertos / (editFormData.acertos + editFormData.erros)) * 100
                  : 0} 
                className="h-2"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de Confirmação de Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Esta avaliação será permanentemente removida
              do sistema e afetará os rankings e relatórios de desempenho.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDelete}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EvaluationManagement;
