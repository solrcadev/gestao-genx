import React, { useState, useEffect } from "react";
import { fetchPresencasAtletas, registrarPresencasEmLote } from "@/services/treinosDoDiaService";
import LoadingSpinner from "../LoadingSpinner";
import { Search, X, CheckCircle2, XCircle, Save, MoreHorizontal, AlertCircle, MessageSquarePlus, Edit3 } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { toast } from "../ui/use-toast";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { JustificativaTipo } from "@/hooks/attendance-hooks";
import { Progress } from "../ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface AthleteAttendanceProps {
  treinoDoDiaId: string;
  onSaved: () => void;
}

type PresenceStatus = "present" | "absent" | "justified";

const tableStyles = {
  wrapper: "rounded-md border overflow-x-auto",
  table: "w-full",
  mobileRow: "block sm:table-row border-b last:border-b-0 sm:border-b-0",
  mobileCell: "block sm:table-cell py-1.5 sm:py-2 before:content-[attr(data-label)] before:font-medium before:mr-2 before:inline-block sm:before:content-none",
  hideOnMobile: "hidden sm:table-cell",
  showOnMobile: "table-cell sm:hidden",
  mobileCellContent: "flex items-center justify-between sm:justify-start sm:gap-2",
  mobileCellLabel: "text-sm text-muted-foreground sm:hidden",
  mobileCellValue: "flex-1 sm:flex-none",
  avatar: "h-7 w-7 shrink-0",
  nameCell: "min-w-[120px] max-w-[180px]",
  statusCell: "w-[100px]",
  actionCell: "w-[60px]",
  effortCell: "w-[80px]",
  toggleGroup: "h-8",
  toggleItem: "h-7 w-7 p-0 data-[state=on]:bg-muted",
  progress: "h-1 w-12",
  progressValue: "text-[10px]",
  actionButton: "h-7 w-7 p-0"
};

const AthleteAttendance: React.FC<AthleteAttendanceProps> = ({ treinoDoDiaId, onSaved }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [athletes, setAthletes] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "present" | "absent">("all");
  const [presences, setPresences] = useState<any[]>([]);
  const [effortIndices, setEffortIndices] = useState<Record<string, number>>({});
  const isMobile = useIsMobile();
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

  useEffect(() => {
    const loadAthletes = async () => {
      try {
        setLoading(true);
        console.log('[DEBUG] Carregando presenças de atletas para treino:', treinoDoDiaId);
        
        const data = await fetchPresencasAtletas(treinoDoDiaId);
        console.log('[DEBUG] Dados de presença carregados:', data.length, 'atletas');
        
        setAthletes(data);
        
        // Initialize presences from fetched data and load effort indices
        const initialPresences = data.map(item => ({
          atleta_id: item.atleta.id,
          presente: item.presente,
          justificativa: item.justificativa || '',
          justificativa_tipo: item.justificativa_tipo || (item.presente ? null : JustificativaTipo.SEM_JUSTIFICATIVA),
          id: item.id
        }));
        
        setPresences(initialPresences);
        console.log('[DEBUG] Presenças inicializadas:', initialPresences.length);
        
        // Load effort indices
        const indices: Record<string, number> = {};
        data.forEach(item => {
          if (item.atleta && typeof item.indice_esforco === 'number') {
            indices[item.atleta.id] = item.indice_esforco;
          } else {
            indices[item.atleta.id] = 0; // Default value
          }
        });
        setEffortIndices(indices);
      } catch (error) {
        console.error("[DEBUG] Erro ao carregar atletas:", error);
        toast({
          title: "Erro ao carregar atletas",
          description: "Não foi possível carregar a lista de atletas. Tente novamente ou contate o suporte.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadAthletes();
  }, [treinoDoDiaId]);

  const handleTogglePresence = (atletaId: string) => {
    setPresences(prev => 
      prev.map(p => 
        p.atleta_id === atletaId 
          ? { 
              ...p, 
              presente: !p.presente, 
              justificativa: !p.presente ? '' : p.justificativa,
              justificativa_tipo: !p.presente ? null : p.justificativa_tipo
            } 
          : p
      )
    );
  };

  const handleJustificativaChange = (atletaId: string, value: string) => {
    setPresences(prev => 
      prev.map(p => 
        p.atleta_id === atletaId 
          ? { ...p, justificativa: value } 
          : p
      )
    );
  };

  const handleJustificativaTipoChange = (atletaId: string, value: JustificativaTipo) => {
    setPresences(prev => 
      prev.map(p => 
        p.atleta_id === atletaId 
          ? { ...p, justificativa_tipo: value } 
          : p
      )
    );
  };

  const handleSavePresences = async () => {
    try {
      setSaving(true);
      console.log('[DEBUG] Salvando presenças para o treino:', treinoDoDiaId);
      console.log('[DEBUG] Total de presenças a salvar:', presences.length);
      
      // Verificar se presences está vazio
      if (!presences.length) {
        console.warn('[DEBUG] Não há presenças para salvar!');
        toast({
          title: "Aviso",
          description: "Não há dados de presença para salvar.",
          variant: "default",
        });
        setSaving(false);
        return;
      }
      
      // Preparar dados para salvar
      const presencesToSave = presences.map(p => ({
        atleta_id: p.atleta_id,
        presente: p.presente,
        justificativa: p.presente ? null : p.justificativa,
        justificativa_tipo: p.presente 
          ? null 
          : (p.justificativa_tipo || JustificativaTipo.SEM_JUSTIFICATIVA),
        id: p.id
      }));
      
      await registrarPresencasEmLote({
        treinoDoDiaId,
        presences: presencesToSave
      });
      
      toast({
        title: "Presenças salvas",
        description: "As presenças foram registradas com sucesso.",
      });
      
      if (onSaved) {
        onSaved();
      }
      
      setShowSaveConfirmation(false);
    } catch (error) {
      console.error('[DEBUG] Erro ao salvar presenças:', error);
      toast({
        title: "Erro ao salvar presenças",
        description: "Não foi possível salvar as presenças. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Filter athletes based on search query and filter status
  const filteredAthletes = athletes.filter(item => {
    const matchesSearch = item.atleta.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.atleta.posicao.toLowerCase().includes(searchQuery.toLowerCase());
    
    const presence = presences.find(p => p.atleta_id === item.atleta.id);
    const matchesStatus = filterStatus === "all" || 
                         (filterStatus === "present" && presence?.presente) ||
                         (filterStatus === "absent" && !presence?.presente);
    
    return matchesSearch && matchesStatus;
  });

  // Count present athletes
  const presentCount = presences.filter(p => p.presente).length;
  const totalCount = athletes.length;
  const presentPercentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  // Format effort index for display
  const formatEffortIndex = (value: number) => {
    if (value === undefined || value === null) return 'N/A';
    return value.toFixed(2);
  };
  
  // Get color class based on effort index
  const getEffortColorClass = (value: number) => {
    if (value === undefined || value === null) return 'bg-gray-200';
    if (value >= 0.7) return 'bg-green-500';
    if (value >= 0.4) return 'bg-green-300';
    if (value >= 0) return 'bg-yellow-300';
    if (value >= -0.5) return 'bg-orange-400';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-4">
      {/* Barra de pesquisa e filtros */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Buscar atleta por nome ou posição..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={filterStatus}
            onValueChange={(value) => setFilterStatus(value as "all" | "present" | "absent")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="present">Presentes</SelectItem>
              <SelectItem value="absent">Ausentes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Resumo de presenças */}
      <div className="flex items-center justify-between bg-muted/40 p-2 rounded">
        <div className="text-sm">
          Presenças: <span className="font-medium">{presentCount}/{totalCount}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Progress value={presentPercentage} className="w-24 h-2" />
          <span className="text-sm font-medium">{presentPercentage}%</span>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Tabela de atletas */}
          <div className={tableStyles.wrapper}>
            <Table className={tableStyles.table}>
              <TableHeader>
                <TableRow>
                  <TableHead className={tableStyles.nameCell}>Atleta</TableHead>
                  <TableHead className={tableStyles.statusCell}>Status</TableHead>
                  <TableHead className={tableStyles.actionCell}></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAthletes.map((item) => {
                  const presence = presences.find(p => p.atleta_id === item.atleta.id);
                  const isPresent = presence?.presente;
                  const hasJustificativa = !isPresent && presence?.justificativa_tipo;
                  const status: PresenceStatus = isPresent ? "present" : (hasJustificativa ? "justified" : "absent");

                  // Justificativa com pesos
                  const justificativas = [
                    { value: JustificativaTipo.SEM_JUSTIFICATIVA, label: "Sem Justificativa (0%)" },
                    { value: JustificativaTipo.MOTIVO_SAUDE, label: "Motivo de Saúde (80%)" },
                    { value: JustificativaTipo.MOTIVO_ACADEMICO, label: "Motivo Acadêmico (70%)" },
                    { value: JustificativaTipo.MOTIVO_LOGISTICO, label: "Motivo Logístico (50%)" },
                    { value: JustificativaTipo.MOTIVO_PESSOAL, label: "Motivo Pessoal (30%)" },
                  ];

                  return (
                    <TableRow key={item.atleta.id} className={tableStyles.mobileRow}>
                      <TableCell className={tableStyles.mobileCell} data-label="Atleta">
                        <div className={tableStyles.mobileCellContent}>
                          <span className={tableStyles.mobileCellLabel}>Atleta</span>
                          <div className={tableStyles.mobileCellValue}>
                            <div className="flex items-center gap-2">
                              <Avatar className={tableStyles.avatar}>
                                <AvatarImage src={item.atleta.foto_url} />
                                <AvatarFallback>{item.atleta.nome.slice(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="truncate">{item.atleta.nome}</span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{item.atleta.nome}</p>
                                    <p className="text-xs text-muted-foreground">{item.atleta.posicao}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className={tableStyles.mobileCell} data-label="Status">
                        <div className={tableStyles.mobileCellContent}>
                          <span className={tableStyles.mobileCellLabel}>Status</span>
                          <div className={tableStyles.mobileCellValue}>
                            <ToggleGroup
                              type="single"
                              value={status}
                              onValueChange={(value) => {
                                if (value) {
                                  handleTogglePresence(item.atleta.id);
                                  if (value === "justified" && !hasJustificativa) {
                                    const button = document.querySelector(`[data-atleta-id=\"${item.atleta.id}\"] .justify-button`);
                                    if (button instanceof HTMLElement) {
                                      button.click();
                                    }
                                  }
                                }
                              }}
                              className={`justify-start ${tableStyles.toggleGroup}`}
                            >
                              <ToggleGroupItem value="present" aria-label="Presente" className={tableStyles.toggleItem}>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                    </TooltipTrigger>
                                    <TooltipContent>Marcar como Presente</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </ToggleGroupItem>
                              <ToggleGroupItem value="absent" aria-label="Ausente" className={tableStyles.toggleItem}>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <XCircle className="h-3.5 w-3.5 text-red-500" />
                                    </TooltipTrigger>
                                    <TooltipContent>Marcar como Ausente</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </ToggleGroupItem>
                              <ToggleGroupItem value="justified" aria-label="Justificado" className={tableStyles.toggleItem}>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <AlertCircle className="h-3.5 w-3.5 text-yellow-500" />
                                    </TooltipTrigger>
                                    <TooltipContent>Marcar como Falta Justificada</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </ToggleGroupItem>
                            </ToggleGroup>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className={`${tableStyles.mobileCell} text-right`} data-label="Ações">
                        <div className={tableStyles.mobileCellContent}>
                          <span className={tableStyles.mobileCellLabel}>Ações</span>
                          <div className={tableStyles.mobileCellValue}>
                            {!isPresent && (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className={`justify-button ${tableStyles.actionButton}`}
                                    data-atleta-id={item.atleta.id}
                                  >
                                    {hasJustificativa ? (
                                      <Edit3 className="h-3.5 w-3.5 text-yellow-500" />
                                    ) : (
                                      <MessageSquarePlus className="h-3.5 w-3.5" />
                                    )}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80">
                                  <div className="space-y-4">
                                    <div className="space-y-2">
                                      <h4 className="font-medium">Justificativa de Ausência</h4>
                                      <Select
                                        value={presence?.justificativa_tipo || JustificativaTipo.SEM_JUSTIFICATIVA}
                                        onValueChange={(value) => handleJustificativaTipoChange(item.atleta.id, value as JustificativaTipo)}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Tipo de ausência" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {justificativas.map(j => (
                                            <SelectItem key={j.value} value={j.value}>{j.label}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <Textarea
                                        placeholder="Detalhes da justificativa..."
                                        className="text-sm resize-none"
                                        value={presence?.justificativa || ''}
                                        onChange={(e) => handleJustificativaChange(item.atleta.id, e.target.value)}
                                      />
                                    </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Legenda de pesos das justificativas */}
          <div className="bg-muted/30 p-3 rounded-lg my-4">
            <h3 className="text-sm font-medium mb-2">Pesos das Justificativas no Índice de Esforço</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Presente: 100%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Motivo de Saúde: 80%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                <span>Motivo Acadêmico: 70%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span>Motivo Logístico: 50%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span>Motivo Pessoal: 30%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Sem Justificativa: 0%</span>
              </div>
            </div>
          </div>

          {/* Botão para salvar */}
          <div className="sticky bottom-0 left-0 right-0 bg-background border-t p-4 mt-6">
            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setPresences(athletes.map(item => ({
                    atleta_id: item.atleta.id,
                    presente: true,
                    justificativa: '',
                    justificativa_tipo: null,
                    id: item.id
                  })));
                }}
              >
                Resetar
              </Button>
              <Button
                onClick={() => setShowSaveConfirmation(true)}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <LoadingSpinner className="mr-2" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Presenças
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Diálogo de confirmação */}
          <Dialog open={showSaveConfirmation} onOpenChange={setShowSaveConfirmation}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmar Salvamento</DialogTitle>
                <DialogDescription>
                  Você está prestes a salvar as presenças dos atletas. Esta ação não pode ser desfeita.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total de atletas:</span>
                    <span className="font-medium">{athletes.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Presentes:</span>
                    <span className="font-medium text-green-600">
                      {presences.filter(p => p.presente).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ausentes:</span>
                    <span className="font-medium text-red-600">
                      {presences.filter(p => !p.presente).length}
                    </span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSaveConfirmation(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSavePresences} disabled={saving}>
                  {saving ? (
                    <>
                      <LoadingSpinner className="mr-2" />
                      Salvando...
                    </>
                  ) : (
                    "Confirmar e Salvar"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
};

export default AthleteAttendance;
