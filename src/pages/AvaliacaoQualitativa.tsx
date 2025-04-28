import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Info, ListFilter, Loader2, Search, X, Check, Trash2, Filter, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Componentes UI
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';

// Serviços
import { getAthletes } from '@/services/athleteService';
import { buscarEventosQualificados, 
  salvarEventoQualificado, 
  CONFIG_EVENTOS_QUALIFICADOS, 
  FUNDAMENTOS,
  verificarECriarTabelaEventosQualificados,
  sincronizarEventosQualificados,
  excluirEventoQualificado
} from '@/services/avaliacaoQualitativaService';
import { supabase } from '@/lib/supabase';

// Tipos
import { Athlete, EventoQualificado, Team, Position } from '@/types';

// Função auxiliar para buscar atletas sem parâmetros
const fetchAllAthletes = async (): Promise<Athlete[]> => {
  try {
    const { data, error } = await supabase
      .from('athletes')
      .select('*')
      .order('nome');
    
    if (error) {
      console.error('Erro ao buscar atletas:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar todos os atletas:', error);
    return [];
  }
};

// Função para obter a variante do badge com base na posição
const getPositionBadgeVariant = (posicao: string): "default" | "secondary" | "destructive" | "outline" | null => {
  switch (posicao) {
    case 'Levantador':
      return null; // Cor personalizada
    case 'Oposto':
      return null; // Cor personalizada
    case 'Ponteiro':
      return null; // Cor personalizada
    case 'Central':
      return null; // Cor personalizada
    case 'Líbero':
      return null; // Cor personalizada
    default:
      return "secondary";
  }
};

// Função para obter classes CSS específicas para posições com cores personalizadas
const getPositionBadgeClasses = (posicao: string): string => {
  switch (posicao) {
    case 'Levantador':
      return "bg-blue-500 hover:bg-blue-600 text-white";
    case 'Oposto':
      return "bg-red-500 hover:bg-red-600 text-white";
    case 'Ponteiro':
      return "bg-purple-500 hover:bg-purple-600 text-white";
    case 'Central':
      return "bg-green-500 hover:bg-green-600 text-white";
    case 'Líbero':
      return "bg-yellow-500 text-black hover:bg-yellow-600";
    case 'Outro':
      return "bg-gray-500 hover:bg-gray-600 text-white";
    default:
      return "";
  }
};

const AvaliacaoQualitativa = () => {
  // Estados para gerenciar o fluxo da UI
  const [searchTerm, setSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState<Team | 'todos'>('todos');
  const [positionFilter, setPositionFilter] = useState<Position | 'todas'>('todas');
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [selectedFundamento, setSelectedFundamento] = useState<string | null>(null);
  const [selectedEventos, setSelectedEventos] = useState<EventoQualificado[]>([]);
  const [observacoes, setObservacoes] = useState('');
  const [isLoadingSync, setIsLoadingSync] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Referências para rolagem automática
  const avaliacaoPanelRef = useRef<HTMLDivElement>(null);
  
  // Estado para controle de carregamento inicial da tabela
  const [isTabelaVerificada, setIsTabelaVerificada] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Verificar e criar tabela no Supabase se necessário
  useEffect(() => {
    const verificarTabela = async () => {
      try {
        const resultado = await verificarECriarTabelaEventosQualificados();
        setIsTabelaVerificada(resultado);
        
        if (!resultado) {
          toast({
            title: "Aviso sobre a tabela de eventos",
            description: "Não foi possível verificar/criar a tabela no banco de dados. Os eventos serão salvos localmente.",
            duration: 6000
          });
        }
      } catch (erro) {
        console.error("Erro ao verificar tabela:", erro);
        setIsTabelaVerificada(false);
      }
    };
    
    verificarTabela();
  }, [toast]);
  
  // Efeito para rolar até o painel de avaliação quando um atleta é selecionado
  useEffect(() => {
    if (selectedAthleteId && avaliacaoPanelRef.current) {
      // Rolagem suave no mobile
      avaliacaoPanelRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start'
      });
    }
  }, [selectedAthleteId]);
  
  // Buscar atletas e eventos qualificados
  const { data: athletes = [], isLoading: isLoadingAthletes } = useQuery<Athlete[]>({
    queryKey: ['athletes'],
    queryFn: fetchAllAthletes
  });
  
  const { data: eventosQualificados = [], isLoading: isLoadingEventos, refetch: refetchEventos } = useQuery<EventoQualificado[]>({
    queryKey: ['eventos-qualificados'],
    queryFn: () => {
      // Mesmo se a tabela não for verificada, ainda podemos tentar buscar dados
      // ou usar dados offline
      return buscarEventosQualificados();
    },
    // Não depender de isTabelaVerificada para habilitar a consulta
    enabled: true
  });
  
  // Sincronizar eventos offline
  const sincronizarEventos = async () => {
    try {
      setIsLoadingSync(true);
      const total = await sincronizarEventosQualificados();
      
      if (total > 0) {
        toast({
          title: "Sincronização concluída",
          description: `Foram sincronizados ${total} eventos offline.`
        });
        
        // Atualizar a lista de eventos
        await refetchEventos();
      } else {
        toast({
          title: "Sem eventos para sincronizar",
          description: "Não há eventos offline para sincronizar."
        });
      }
    } catch (erro) {
      console.error("Erro na sincronização:", erro);
      toast({
        title: "Erro na sincronização",
        description: "Não foi possível sincronizar os eventos offline.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingSync(false);
    }
  };
  
  // Limpar filtros
  const limparFiltros = () => {
    setTeamFilter('todos');
    setPositionFilter('todas');
    setSearchTerm('');
  };
  
  // Filtrar atletas com base em todos os critérios
  const filteredAthletes = athletes.filter(athlete => {
    // Filtro por nome (busca)
    const matchesSearch = searchTerm === '' || 
      athlete.nome.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro por time
    const matchesTeam = teamFilter === 'todos' || 
      athlete.time === teamFilter;
    
    // Filtro por posição
    const matchesPosition = positionFilter === 'todas' || 
      athlete.posicao === positionFilter;
    
    return matchesSearch && matchesTeam && matchesPosition;
  });
  
  // Obter atleta selecionado
  const selectedAthlete = athletes.find(a => a.id === selectedAthleteId);
  
  // Obter configuração do fundamento selecionado
  const configFundamento = selectedFundamento 
    ? CONFIG_EVENTOS_QUALIFICADOS.find(f => f.fundamento === selectedFundamento) 
    : null;
  
  // Iniciar avaliação de um atleta
  const iniciarAvaliacao = (atletaId: string) => {
    setSelectedAthleteId(atletaId);
    setSelectedFundamento(null);
    setObservacoes('');
  };
  
  // Selecionar fundamento
  const selecionarFundamento = (fundamento: string) => {
    setSelectedFundamento(fundamento);
  };
  
  // Registrar evento qualificado
  const registrarEvento = async (tipoEvento: string, peso: number) => {
    if (!selectedAthleteId || !selectedFundamento) return;
    
    try {
      const novoEvento: EventoQualificado = {
        atleta_id: selectedAthleteId,
        fundamento: selectedFundamento,
        tipo_evento: tipoEvento,
        peso,
        observacoes,
        timestamp: new Date().toISOString()
      };
      
      const eventoId = await salvarEventoQualificado(novoEvento);
      
      toast({
        title: "Evento registrado",
        description: `${tipoEvento} registrado para ${selectedAthlete?.nome || 'atleta'}.`,
        variant: "default"
      });
      
      // Atualizar lista de eventos
      refetchEventos();
      
      // Limpar observações após salvar
      setObservacoes('');
      
      // Gerar um ID temporário único para exibição imediata
      const tempId = eventoId || `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Verificar se o ID já existe na lista local para evitar duplicação
      const eventoJaExiste = selectedEventos.some(e => e.id === tempId);
      
      if (!eventoJaExiste) {
        // Salvar localmente para rápida exibição
        setSelectedEventos([
          {
            ...novoEvento,
            id: tempId
          },
          ...selectedEventos
        ]);
      }
    } catch (erro) {
      console.error("Erro ao registrar evento:", erro);
      toast({
        title: "Erro ao registrar evento",
        description: "Não foi possível salvar o evento. Tente novamente.",
        variant: "destructive"
      });
    }
  };
  
  // Excluir evento
  const handleExcluirEvento = async (id: string) => {
    try {
      await excluirEventoQualificado(id);
      
      toast({
        title: "Evento excluído",
        description: "O evento foi excluído com sucesso."
      });
      
      // Atualizar lista de eventos
      refetchEventos();
      
      // Atualizar lista local
      setSelectedEventos(prev => prev.filter(e => e.id !== id));
    } catch (erro) {
      console.error("Erro ao excluir evento:", erro);
      toast({
        title: "Erro ao excluir evento",
        description: "Não foi possível excluir o evento. Tente novamente.",
        variant: "destructive"
      });
    }
  };
  
  // Cancelar avaliação atual
  const cancelarAvaliacao = () => {
    setSelectedAthleteId(null);
    setSelectedFundamento(null);
    setObservacoes('');
    setSelectedEventos([]);
  };
  
  // Formatação de data para exibição
  const formatarData = (dataString: string): string => {
    try {
      const data = new Date(dataString);
      return format(data, "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch (erro) {
      return "Data inválida";
    }
  };
  
  // Componente para exibir o card de atleta
  const AtletaCard = ({ atleta }: { atleta: Athlete }) => (
    <Card className="mb-2 hover:bg-muted/50 transition-colors">
      <CardHeader className="p-4 pb-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="flex-1">
            <CardTitle className="text-base">{atleta.nome}</CardTitle>
            <div className="flex items-center mt-1 gap-2 text-sm text-muted-foreground">
              <Badge variant={atleta.time === "Masculino" ? "default" : "destructive"}>
                {atleta.time}
              </Badge>
              <Badge 
                variant={getPositionBadgeVariant(atleta.posicao)}
                className={cn(getPositionBadgeClasses(atleta.posicao))}
              >
                {atleta.posicao}
              </Badge>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => iniciarAvaliacao(atleta.id)}
            className="shrink-0"
          >
            Avaliar <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
  
  // Componente para exibir o log de eventos
  const LogEventos = ({ eventos }: { eventos: EventoQualificado[] }) => {
    if (eventos.length === 0) {
      return (
        <div className="p-4 text-center text-muted-foreground">
          Nenhum evento registrado. Selecione um atleta e comece a avaliar.
        </div>
      );
    }
    
    // Garantir que todos os eventos tenham ID para evitar problemas de renderização
    const eventosComId = eventos.map((evento, index) => {
      if (!evento.id) {
        return {
          ...evento,
          id: `temp-${index}-${evento.atleta_id}-${evento.timestamp || Date.now()}`
        };
      }
      return evento;
    });
    
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Atleta</TableHead>
              <TableHead>Fundamento</TableHead>
              <TableHead>Evento</TableHead>
              <TableHead>Peso</TableHead>
              <TableHead>Data/Hora</TableHead>
              <TableHead className="w-10">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {eventosComId.map((evento, index) => {
              const atleta = athletes.find(a => a.id === evento.atleta_id);
              
              return (
                <TableRow key={evento.id}>
                  <TableCell>{atleta?.nome || 'Não encontrado'}</TableCell>
                  <TableCell>{evento.fundamento}</TableCell>
                  <TableCell>{evento.tipo_evento}</TableCell>
                  <TableCell>
                    <Badge variant={evento.peso > 0 ? "default" : "destructive"}>
                      {evento.peso.toFixed(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatarData(evento.timestamp || '')}</TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleExcluirEvento(evento.id || '')}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };
  
  // Renderização do componente principal
  return (
    <div className="container py-6">
      <div className="flex flex-col gap-6">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Avaliação Qualitativa</h1>
            <p className="text-muted-foreground mt-1">
              Registre eventos com peso técnico por fundamento
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center"
            >
              <Filter className="mr-2 h-4 w-4" />
              {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
            </Button>
            <Button 
              onClick={sincronizarEventos}
              disabled={isLoadingSync}
              className="flex items-center"
              size="sm"
            >
              {isLoadingSync ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Sincronizar
            </Button>
          </div>
        </div>
        
        {/* Filtros */}
        {showFilters && (
          <Card className="mb-0">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Filtros</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={limparFiltros}
                >
                  Limpar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label htmlFor="team-filter" className="text-sm font-medium">
                    Time
                  </label>
                  <Select
                    value={teamFilter}
                    onValueChange={(value: Team | 'todos') => setTeamFilter(value)}
                  >
                    <SelectTrigger id="team-filter">
                      <SelectValue placeholder="Todos os times" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os times</SelectItem>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Feminino">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="position-filter" className="text-sm font-medium">
                    Posição
                  </label>
                  <Select
                    value={positionFilter}
                    onValueChange={(value: Position | 'todas') => setPositionFilter(value)}
                  >
                    <SelectTrigger id="position-filter">
                      <SelectValue placeholder="Todas as posições" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas as posições</SelectItem>
                      <SelectItem value="Levantador">Levantador</SelectItem>
                      <SelectItem value="Oposto">Oposto</SelectItem>
                      <SelectItem value="Ponteiro">Ponteiro</SelectItem>
                      <SelectItem value="Central">Central</SelectItem>
                      <SelectItem value="Líbero">Líbero</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="search-input" className="text-sm font-medium">
                    Buscar por nome
                  </label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search-input"
                      type="search"
                      placeholder="Buscar atleta..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Layout principal de 2 colunas */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Coluna da esquerda - Lista de atletas */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>
                  <div className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Atletas
                    {filteredAthletes.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {filteredAthletes.length}
                      </Badge>
                    )}
                  </div>
                </CardTitle>
                {!showFilters && (
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Buscar atleta..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                )}
              </div>
              <CardDescription>
                Selecione um atleta para iniciar a avaliação.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAthletes ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {filteredAthletes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum atleta encontrado. Tente ajustar os filtros.
                    </div>
                  ) : (
                    <ScrollArea className="h-[calc(100vh-450px)]">
                      <div className="pr-3">
                        {filteredAthletes.map((atleta) => (
                          <AtletaCard key={atleta.id} atleta={atleta} />
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </>
              )}
            </CardContent>
          </Card>
          
          {/* Coluna da direita - Painel de avaliação */}
          <Card className="lg:col-span-3" ref={avaliacaoPanelRef}>
            {selectedAthleteId ? (
              <>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle>
                      <div>Avaliação de {selectedAthlete?.nome || 'Atleta'}</div>
                      {selectedAthlete && (
                        <div className="flex mt-1 gap-2 text-sm">
                          <Badge variant={selectedAthlete.time === "Masculino" ? "default" : "destructive"}>
                            {selectedAthlete.time}
                          </Badge>
                          <Badge 
                            variant={getPositionBadgeVariant(selectedAthlete.posicao)}
                            className={cn(getPositionBadgeClasses(selectedAthlete.posicao))}
                          >
                            {selectedAthlete.posicao}
                          </Badge>
                        </div>
                      )}
                    </CardTitle>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={cancelarAvaliacao}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription>
                    {selectedFundamento 
                      ? `Registrando eventos de ${selectedFundamento}` 
                      : 'Selecione o fundamento a ser avaliado'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Seleção de fundamento */}
                  {!selectedFundamento ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {FUNDAMENTOS.map((fundamento) => (
                        <Button 
                          key={fundamento} 
                          variant="outline" 
                          onClick={() => selecionarFundamento(fundamento)}
                          className="h-20 flex flex-col gap-1"
                        >
                          <span className="text-lg">{fundamento}</span>
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Header do painel de fundamento */}
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">{selectedFundamento}</h3>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setSelectedFundamento(null)}
                        >
                          Trocar Fundamento
                        </Button>
                      </div>
                      
                      {/* Opções de eventos qualitativos */}
                      <div className="grid sm:grid-cols-2 gap-3">
                        {configFundamento?.eventos.map((evento) => (
                          <TooltipProvider key={evento.tipo}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  onClick={() => registrarEvento(evento.tipo, evento.peso)}
                                  variant={evento.peso > 0 ? "default" : "destructive"}
                                  className="h-16 flex flex-col w-full"
                                >
                                  <span>{evento.tipo}</span>
                                  <Badge 
                                    variant={evento.peso > 0 ? "outline" : "destructive"} 
                                    className="mt-1"
                                  >
                                    {evento.peso.toFixed(1)}
                                  </Badge>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{evento.descricao || evento.tipo}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                      
                      {/* Campo de observações */}
                      <div className="space-y-2">
                        <label htmlFor="observacoes" className="text-sm font-medium">
                          Observações (opcional)
                        </label>
                        <Input
                          id="observacoes"
                          placeholder="Adicione observações sobre este evento..."
                          value={observacoes}
                          onChange={(e) => setObservacoes(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[calc(100vh-450px)]">
                <Info className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium">Nenhum atleta selecionado</h3>
                <p className="text-muted-foreground mt-2 text-center max-w-md">
                  Selecione um atleta na lista à esquerda para iniciar a avaliação.
                </p>
              </div>
            )}
          </Card>
        </div>
        
        {/* Tabela de log de eventos */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>Log de Eventos Registrados</CardTitle>
              {/* Área para futuros filtros */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled>
                  <ListFilter className="mr-2 h-4 w-4" />
                  Filtrar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingEventos ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <LogEventos 
                eventos={selectedAthleteId 
                  ? (() => {
                      // Combinar eventos locais e do banco de dados sem duplicação
                      const eventosDoAtleta = eventosQualificados.filter(e => e.atleta_id === selectedAthleteId);
                      // Filtrar eventos do banco que já existem nos eventosLocais (por ID)
                      const eventosUnicosDoBanco = eventosDoAtleta.filter(
                        eventoDb => !selectedEventos.some(eventoLocal => eventoLocal.id === eventoDb.id)
                      );
                      // Retornar a combinação dos eventos, colocando os locais primeiro
                      return [...selectedEventos, ...eventosUnicosDoBanco];
                    })() 
                  : eventosQualificados
                } 
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AvaliacaoQualitativa; 