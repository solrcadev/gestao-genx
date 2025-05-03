
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ArrowLeft, CalendarCheck, CalendarIcon, CheckCircle, Filter, Save, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useGetAthleteAttendance, useGetAvailableTrainings, saveAthleteAttendance, JustificativaTipo, calculateAthleteEffortIndex } from '@/hooks/attendance-hooks';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { TeamType } from '@/types';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const Presenca = () => {
  const { treinoDoDiaId } = useParams<{ treinoDoDiaId?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for data control
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTeam, setSelectedTeam] = useState<TeamType | null>(null);
  const [selectedTrainingId, setSelectedTrainingId] = useState<string | undefined>(treinoDoDiaId);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [effortIndices, setEffortIndices] = useState<Record<string, number>>({});

  // Load available trainings
  const { 
    data: availableTrainings, 
    isLoading: isLoadingTrainings
  } = useGetAvailableTrainings({
    date: selectedDate,
    team: selectedTeam
  });

  // Fetch training day data
  const { 
    data: treinoDoDiaInfo, 
    isLoading: isLoadingTreino 
  } = useQuery({
    queryKey: ['treino-do-dia', selectedTrainingId],
    queryFn: async () => {
      if (!selectedTrainingId) return null;

      const { data, error } = await supabase
        .from('treinos_do_dia')
        .select(`
          id,
          data,
          treino:treino_id(id, nome, local, horario, time)
        `)
        .eq('id', selectedTrainingId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!selectedTrainingId
  });

  // Fetch athlete attendance for selected training
  const { 
    data: atletas, 
    isLoading: isLoadingAttendance,
    error: attendanceError
  } = useGetAthleteAttendance(selectedTrainingId);

  // Mutation to save attendance
  const saveAttendanceMutation = useMutation({
    mutationFn: async (data: any[]) => {
      if (!selectedTrainingId) throw new Error('ID do treino não informado');
      
      // Format data to save
      const dadosParaSalvar = data.map(item => ({
        id: item.id || null,
        atleta_id: item.atleta_id,
        presente: item.presente,
        justificativa: item.presente ? null : (item.justificativa || null),
        justificativa_tipo: item.presente ? null : (item.justificativa_tipo || null)
      }));
      
      return await saveAthleteAttendance(selectedTrainingId, dadosParaSalvar);
    },
    onSuccess: () => {
      toast({
        title: 'Presenças salvas com sucesso!',
        description: 'Os registros de presença e justificativas foram atualizados.',
        duration: 3000
      });
      
      setHasChanges(false);
      
      // Invalidate query to reload data
      queryClient.invalidateQueries({ queryKey: ['attendance', selectedTrainingId] });
    },
    onError: (error) => {
      console.error('Erro ao salvar presenças:', error);
      toast({
        title: 'Erro ao salvar presenças',
        description: 'Não foi possível salvar as alterações. Por favor, tente novamente.',
        variant: 'destructive'
      });
    }
  });

  // Update local state when data is loaded
  useEffect(() => {
    if (atletas) {
      setAttendanceData(atletas);
      
      // Load effort indices for all athletes
      const loadEffortIndices = async () => {
        const indices: Record<string, number> = {};
        
        for (const atleta of atletas) {
          if (atleta.atleta_id) {
            const indice = await calculateAthleteEffortIndex(atleta.atleta_id);
            indices[atleta.atleta_id] = indice;
          }
        }
        
        setEffortIndices(indices);
      };
      
      loadEffortIndices();
    }
  }, [atletas]);

  // Function to update attendance for an athlete
  const handleToggleAttendance = (index: number, value: boolean) => {
    const newData = [...attendanceData];
    newData[index].presente = value;
    
    // If marked as present, clear justification
    if (value) {
      newData[index].justificativa = null;
      newData[index].justificativa_tipo = null;
    } else if (!value && !newData[index].justificativa_tipo) {
      // If marked as absent and no justification type, set default
      newData[index].justificativa_tipo = JustificativaTipo.SEM_JUSTIFICATIVA;
    }
    
    setAttendanceData(newData);
    setHasChanges(true);
  };

  // Function to update justification text
  const handleUpdateJustification = (index: number, value: string) => {
    const newData = [...attendanceData];
    newData[index].justificativa = value;
    setAttendanceData(newData);
    setHasChanges(true);
  };
  
  // Function to update justification type
  const handleUpdateJustificationType = (index: number, value: JustificativaTipo) => {
    const newData = [...attendanceData];
    newData[index].justificativa_tipo = value;
    setAttendanceData(newData);
    setHasChanges(true);
  };

  // Function to save attendance
  const handleSaveAttendance = () => {
    saveAttendanceMutation.mutate(attendanceData);
  };

  // Select another training
  const handleTrainingSelect = (id: string) => {
    if (hasChanges) {
      // Confirm with user if they want to leave without saving
      if (window.confirm('Existem alterações não salvas. Deseja sair sem salvar?')) {
        setSelectedTrainingId(id);
        setHasChanges(false);
      }
    } else {
      setSelectedTrainingId(id);
    }
  };
  
  // Filter athletes based on search
  const filteredAthletes = attendanceData.filter(item => 
    item.atleta?.nome?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Count of present and absent
  const presentCount = attendanceData.filter(p => p.presente).length;
  const absentCount = attendanceData.length - presentCount;
  const presentPercentage = attendanceData.length > 0 
    ? Math.round((presentCount / attendanceData.length) * 100) 
    : 0;
  
  // Count justification types
  const justificationCounts = attendanceData.reduce((counts: Record<string, number>, item) => {
    if (!item.presente && item.justificativa_tipo) {
      counts[item.justificativa_tipo] = (counts[item.justificativa_tipo] || 0) + 1;
    }
    return counts;
  }, {});

  // Format date
  const formatarData = (dataStr: string) => {
    const data = new Date(dataStr);
    return format(data, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };
  
  // Start with current date if no training selected
  useEffect(() => {
    if (!treinoDoDiaId) {
      setSelectedDate(new Date());
    }
  }, [treinoDoDiaId]);
  
  // Check if there is a training for selected date
  useEffect(() => {
    if (availableTrainings?.length && !selectedTrainingId) {
      setSelectedTrainingId(availableTrainings[0].id);
    }
  }, [availableTrainings, selectedTrainingId]);
  
  // Get name initials for avatar
  const getInitials = (name: string) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Format effort index to display value
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
    <div className="container mx-auto py-6 px-4 sm:px-0">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Gerenciar Presenças</h1>
            <p className="text-muted-foreground">
              {treinoDoDiaInfo ? (
                <>
                  {treinoDoDiaInfo.treino?.nome || 'Treino'} • {formatarData(treinoDoDiaInfo.data)}
                </>
              ) : (
                'Selecione um treino'
              )}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Date selector */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="min-w-[240px] justify-start">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? (
                  format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                ) : (
                  <span>Selecionar data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
          
          {/* Team selector */}
          <Select 
            value={selectedTeam || undefined} 
            onValueChange={(value) => setSelectedTeam(value as TeamType || null)}
          >
            <SelectTrigger className="min-w-[180px]">
              <SelectValue placeholder="Filtrar por time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os times</SelectItem>
              <SelectItem value="Masculino">Masculino</SelectItem>
              <SelectItem value="Feminino">Feminino</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* List of available trainings */}
      {isLoadingTrainings ? (
        <div className="mb-6">
          <Skeleton className="h-10 w-full mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : availableTrainings && availableTrainings.length > 0 ? (
        <div className="mb-6 overflow-x-auto">
          <div className="flex space-x-2 pb-2">
            {availableTrainings.map((training) => (
              <Button 
                key={training.id}
                variant={selectedTrainingId === training.id ? "default" : "outline"}
                onClick={() => handleTrainingSelect(training.id)}
                className="whitespace-nowrap"
              >
                <span className="flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4" />
                  <span>{format(new Date(training.data), 'dd/MM')}</span>
                  <span className="hidden sm:inline"> - {training.nome}</span>
                </span>
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <Card className="mb-6">
          <CardContent className="flex flex-col items-center justify-center py-6">
            <CalendarIcon className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-center text-muted-foreground">
              Nenhum treino encontrado para esta data ou filtro.
            </p>
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={() => {
                setSelectedDate(undefined);
                setSelectedTeam(null);
              }}
            >
              Limpar filtros
            </Button>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5" />
              Lista de Presença
              {attendanceData.length > 0 && (
                <Badge className="ml-2">{attendanceData.length} atletas</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Marque os atletas presentes e justifique as ausências
            </CardDescription>
          </div>
          
          {/* Quick stats */}
          {attendanceData.length > 0 && (
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50">
                  <CheckCircle className="h-3.5 w-3.5 mr-1 text-green-500" />
                  <span>{presentCount} presentes ({presentPercentage}%)</span>
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-red-50">
                  <XCircle className="h-3.5 w-3.5 mr-1 text-red-500" />
                  <span>{absentCount} ausentes</span>
                </Badge>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {/* Search bar */}
          <div className="mb-4 relative">
            <Input
              placeholder="Buscar atleta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
            <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            {searchQuery && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="absolute right-1 top-1.5 h-7 w-7 p-0" 
                onClick={() => setSearchQuery('')}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {/* Justification type stats */}
          {attendanceData.length > 0 && absentCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(justificationCounts).map(([type, count]) => {
                let label = "";
                let bgColor = "";
                
                switch(type) {
                  case JustificativaTipo.SEM_JUSTIFICATIVA:
                    label = "Sem justificativa";
                    bgColor = "bg-red-100 border-red-300";
                    break;
                  case JustificativaTipo.MOTIVO_PESSOAL:
                    label = "Motivo pessoal";
                    bgColor = "bg-blue-100 border-blue-300";
                    break;
                  case JustificativaTipo.MOTIVO_ACADEMICO:
                    label = "Motivo acadêmico";
                    bgColor = "bg-purple-100 border-purple-300";
                    break;
                  case JustificativaTipo.MOTIVO_LOGISTICO:
                    label = "Motivo logístico";
                    bgColor = "bg-yellow-100 border-yellow-300";
                    break;
                  case JustificativaTipo.MOTIVO_SAUDE:
                    label = "Motivo de saúde";
                    bgColor = "bg-green-100 border-green-300";
                    break;
                }
                
                return (
                  <Badge key={type} variant="outline" className={`${bgColor} text-gray-700`}>
                    {label}: {count}
                  </Badge>
                );
              })}
            </div>
          )}
          
          {/* Mobile stats */}
          {attendanceData.length > 0 && (
            <div className="flex md:hidden items-center gap-2 mb-4">
              <Badge variant="outline" className="bg-green-50">
                <CheckCircle className="h-3.5 w-3.5 mr-1 text-green-500" />
                <span>{presentCount} ({presentPercentage}%)</span>
              </Badge>
              <Badge variant="outline" className="bg-red-50">
                <XCircle className="h-3.5 w-3.5 mr-1 text-red-500" />
                <span>{absentCount}</span>
              </Badge>
            </div>
          )}
          
          {/* Loading and errors */}
          {isLoadingAttendance || isLoadingTreino ? (
            <div className="flex flex-col space-y-3 pt-1">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-4 border p-3 rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-40 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-6 w-6" />
                </div>
              ))}
            </div>
          ) : attendanceError ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <AlertCircle className="h-12 w-12 text-red-500" />
              <div className="text-center">
                <h3 className="font-semibold text-lg">Erro ao carregar presenças</h3>
                <p className="text-muted-foreground">
                  Não foi possível carregar os dados de presença para este treino.
                </p>
              </div>
              <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['attendance'] })}>
                Tentar novamente
              </Button>
            </div>
          ) : attendanceData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Não há atletas disponíveis para este treino.
              </p>
              {selectedTrainingId && (
                <Button 
                  variant="outline" 
                  className="mt-4" 
                  onClick={() => setSelectedTrainingId(undefined)}
                >
                  Selecionar outro treino
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* View on larger devices */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-center">Status</TableHead>
                      <TableHead>Atleta</TableHead>
                      <TableHead>Índice de Esforço</TableHead>
                      <TableHead>Justificativa (se ausente)</TableHead>
                      <TableHead>Tipo de Ausência</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAthletes.map((registro, index) => {
                      const atletaIndex = attendanceData.findIndex(a => a.atleta_id === registro.atleta_id);
                      const effortIndex = effortIndices[registro.atleta_id] || 0;
                      return (
                        <TableRow key={registro.atleta_id} className={!registro.presente ? "bg-muted/30" : ""}>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Checkbox
                                checked={registro.presente}
                                onCheckedChange={(value) => handleToggleAttendance(atletaIndex, !!value)}
                                className={registro.presente ? "border-green-500 text-green-500" : "border-red-300"}
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className={`${registro.atleta?.time === 'Masculino' ? 'bg-blue-600' : 'bg-red-600'} text-white`}>
                                <AvatarImage src={registro.atleta?.foto_url || ''} alt={registro.atleta?.nome} />
                                <AvatarFallback>{getInitials(registro.atleta?.nome)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{registro.atleta?.nome}</div>
                                <div className="text-sm text-muted-foreground">{registro.atleta?.posicao}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-2">
                                    <Progress value={(effortIndex + 1) * 50} className="w-24" />
                                    <span className="text-sm">{formatEffortIndex(effortIndex)}</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Índice de Esforço: {formatEffortIndex(effortIndex)}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Baseado nos últimos treinos e justificativas
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell>
                            <Input
                              placeholder={registro.presente ? 'Presente' : 'Informe a justificativa...'}
                              value={registro.justificativa || ''}
                              onChange={(e) => handleUpdateJustification(atletaIndex, e.target.value)}
                              disabled={registro.presente}
                              className={!registro.presente && !registro.justificativa ? "border-red-200" : ""}
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={registro.justificativa_tipo || ""}
                              onValueChange={(value) => handleUpdateJustificationType(atletaIndex, value as JustificativaTipo)}
                              disabled={registro.presente}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={JustificativaTipo.SEM_JUSTIFICATIVA}>
                                  Falta sem justificativa
                                </SelectItem>
                                <SelectItem value={JustificativaTipo.MOTIVO_PESSOAL}>
                                  Falta justificada - motivo pessoal
                                </SelectItem>
                                <SelectItem value={JustificativaTipo.MOTIVO_ACADEMICO}>
                                  Falta justificada - motivo acadêmico
                                </SelectItem>
                                <SelectItem value={JustificativaTipo.MOTIVO_LOGISTICO}>
                                  Falta justificada - motivo logístico
                                </SelectItem>
                                <SelectItem value={JustificativaTipo.MOTIVO_SAUDE}>
                                  Falta justificada - motivo de saúde
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              
              {/* View on mobile devices */}
              <div className="md:hidden space-y-3">
                {filteredAthletes.map((registro, index) => {
                  const atletaIndex = attendanceData.findIndex(a => a.atleta_id === registro.atleta_id);
                  const effortIndex = effortIndices[registro.atleta_id] || 0;
                  return (
                    <div 
                      key={registro.atleta_id} 
                      className={`border rounded-lg transition-colors ${
                        registro.presente ? "bg-card" : "bg-muted/30"
                      }`}
                    >
                      <div className="p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center">
                            <div className="mr-3">
                              <Avatar className={`${registro.atleta?.time === 'Masculino' ? 'bg-blue-600' : 'bg-red-600'} text-white`}>
                                <AvatarImage src={registro.atleta?.foto_url || ''} alt={registro.atleta?.nome} />
                                <AvatarFallback>{getInitials(registro.atleta?.nome)}</AvatarFallback>
                              </Avatar>
                            </div>
                            <div>
                              <p className="font-medium">{registro.atleta?.nome}</p>
                              <p className="text-sm text-muted-foreground">{registro.atleta?.posicao}</p>
                              <div className="flex items-center mt-1">
                                <div className="w-16 mr-2">
                                  <Progress value={(effortIndex + 1) * 50} className="h-1.5" />
                                </div>
                                <span className="text-xs">Esforço: {formatEffortIndex(effortIndex)}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            {registro.presente ? (
                              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500 mr-2" />
                            )}
                            <Checkbox 
                              checked={registro.presente}
                              onCheckedChange={(value) => handleToggleAttendance(atletaIndex, !!value)}
                              className={registro.presente ? "border-green-500 text-green-500" : "border-red-300"}
                            />
                          </div>
                        </div>
                        
                        {!registro.presente && (
                          <>
                            <div className="mt-3">
                              <Select
                                value={registro.justificativa_tipo || ""}
                                onValueChange={(value) => handleUpdateJustificationType(atletaIndex, value as JustificativaTipo)}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Tipo de ausência" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={JustificativaTipo.SEM_JUSTIFICATIVA}>
                                    Falta sem justificativa
                                  </SelectItem>
                                  <SelectItem value={JustificativaTipo.MOTIVO_PESSOAL}>
                                    Falta justificada - motivo pessoal
                                  </SelectItem>
                                  <SelectItem value={JustificativaTipo.MOTIVO_ACADEMICO}>
                                    Falta justificada - motivo acadêmico
                                  </SelectItem>
                                  <SelectItem value={JustificativaTipo.MOTIVO_LOGISTICO}>
                                    Falta justificada - motivo logístico
                                  </SelectItem>
                                  <SelectItem value={JustificativaTipo.MOTIVO_SAUDE}>
                                    Falta justificada - motivo de saúde
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="mt-3">
                              <Input
                                placeholder="Justificativa da ausência..."
                                className={!registro.justificativa ? "border-red-200" : ""}
                                value={registro.justificativa || ''}
                                onChange={(e) => handleUpdateJustification(atletaIndex, e.target.value)}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Save button */}
      {attendanceData.length > 0 && (
        <div className="flex justify-end mt-6">
          <Button 
            onClick={handleSaveAttendance} 
            disabled={!hasChanges || saveAttendanceMutation.isPending}
            className="gap-2"
            size="lg"
          >
            {saveAttendanceMutation.isPending ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar Presenças
          </Button>
        </div>
      )}
    </div>
  );
};

export default Presenca;
