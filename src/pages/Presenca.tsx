
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parse } from 'date-fns';
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
import { useGetAthleteAttendance, useGetAvailableTrainings, saveAthleteAttendance } from '@/hooks/attendance-hooks';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AtletaCard } from '@/components/atleta/AtletaCard'; 
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { TeamType } from '@/types';

const Presenca = () => {
  const { treinoDoDiaId } = useParams<{ treinoDoDiaId?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Estado para controle de dados
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTeam, setSelectedTeam] = useState<TeamType | null>(null);
  const [selectedTrainingId, setSelectedTrainingId] = useState<string | undefined>(treinoDoDiaId);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Carregar treinos disponíveis
  const { 
    data: availableTrainings, 
    isLoading: isLoadingTrainings
  } = useGetAvailableTrainings({
    date: selectedDate,
    team: selectedTeam
  });

  // Buscar dados do treino do dia selecionado
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

  // Buscar presenças dos atletas para o treino selecionado
  const { 
    data: atletas, 
    isLoading: isLoadingAttendance,
    error: attendanceError
  } = useGetAthleteAttendance(selectedTrainingId);

  // Mutation para salvar presenças
  const saveAttendanceMutation = useMutation({
    mutationFn: async (data: any[]) => {
      if (!selectedTrainingId) throw new Error('ID do treino não informado');
      
      // Formatar dados para salvar
      const dadosParaSalvar = data.map(item => ({
        id: item.id || null,
        atleta_id: item.atleta_id,
        presente: item.presente,
        justificativa: item.presente ? null : (item.justificativa || null)
      }));
      
      return await saveAthleteAttendance(selectedTrainingId, dadosParaSalvar);
    },
    onSuccess: () => {
      toast({
        title: 'Presenças salvas com sucesso!',
        description: 'Os registros de presença foram atualizados.',
        duration: 3000
      });
      
      setHasChanges(false);
      
      // Invalida a consulta para recarregar os dados
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

  // Atualizar estado local quando os dados são carregados
  useEffect(() => {
    if (atletas) {
      setAttendanceData(atletas);
    }
  }, [atletas]);

  // Função para atualizar presença de um atleta
  const handleToggleAttendance = (index: number, value: boolean) => {
    const newData = [...attendanceData];
    newData[index].presente = value;
    
    // Se marcado como presente, limpar justificativa
    if (value) {
      newData[index].justificativa = null;
    }
    
    setAttendanceData(newData);
    setHasChanges(true);
  };

  // Função para atualizar justificativa de um atleta
  const handleUpdateJustification = (index: number, value: string) => {
    const newData = [...attendanceData];
    newData[index].justificativa = value;
    setAttendanceData(newData);
    setHasChanges(true);
  };

  // Função para salvar presenças
  const handleSaveAttendance = () => {
    saveAttendanceMutation.mutate(attendanceData);
  };

  // Selecionar outro treino
  const handleTrainingSelect = (id: string) => {
    if (hasChanges) {
      // Confirmar com o usuário se deseja sair sem salvar
      if (window.confirm('Existem alterações não salvas. Deseja sair sem salvar?')) {
        setSelectedTrainingId(id);
        setHasChanges(false);
      }
    } else {
      setSelectedTrainingId(id);
    }
  };
  
  // Filtrar atletas com base na pesquisa
  const filteredAthletes = attendanceData.filter(item => 
    item.atleta?.nome?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Contagem de presentes e ausentes
  const presentCount = attendanceData.filter(p => p.presente).length;
  const absentCount = attendanceData.length - presentCount;
  const presentPercentage = attendanceData.length > 0 
    ? Math.round((presentCount / attendanceData.length) * 100) 
    : 0;

  // Formatação da data
  const formatarData = (dataStr: string) => {
    const data = new Date(dataStr);
    return format(data, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };
  
  // Iniciar com a data atual se não tiver treino selecionado
  useEffect(() => {
    if (!treinoDoDiaId) {
      setSelectedDate(new Date());
    }
  }, [treinoDoDiaId]);
  
  // Verificar se existe um treino para a data selecionada
  useEffect(() => {
    if (availableTrainings?.length && !selectedTrainingId) {
      setSelectedTrainingId(availableTrainings[0].id);
    }
  }, [availableTrainings, selectedTrainingId]);
  
  // Extrair iniciais do nome para avatar
  const getInitials = (name: string) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
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
          {/* Seletor de data */}
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
          
          {/* Seletor de time */}
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
      
      {/* Lista de treinos disponíveis */}
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
          
          {/* Estatísticas rápidas */}
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
          {/* Barra de pesquisa */}
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
          
          {/* Estatísticas para mobile */}
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
          
          {/* Loading e erros */}
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
              {/* Visualização em dispositivos maiores */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-center">Status</TableHead>
                      <TableHead>Atleta</TableHead>
                      <TableHead>Justificativa (se ausente)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAthletes.map((registro, index) => {
                      const atletaIndex = attendanceData.findIndex(a => a.atleta_id === registro.atleta_id);
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
                              <Avatar className={`${registro.atleta?.time === 'Masculino' ? 'bg-sport-blue' : 'bg-sport-red'} text-white`}>
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
                            <Input
                              placeholder={registro.presente ? 'Presente' : 'Informe a justificativa...'}
                              value={registro.justificativa || ''}
                              onChange={(e) => handleUpdateJustification(atletaIndex, e.target.value)}
                              disabled={registro.presente}
                              className={!registro.presente && !registro.justificativa ? "border-red-200" : ""}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              
              {/* Visualização em dispositivos móveis */}
              <div className="md:hidden space-y-3">
                {filteredAthletes.map((registro, index) => {
                  const atletaIndex = attendanceData.findIndex(a => a.atleta_id === registro.atleta_id);
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
                              <Avatar className={`${registro.atleta?.time === 'Masculino' ? 'bg-sport-blue' : 'bg-sport-red'} text-white`}>
                                <AvatarImage src={registro.atleta?.foto_url || ''} alt={registro.atleta?.nome} />
                                <AvatarFallback>{getInitials(registro.atleta?.nome)}</AvatarFallback>
                              </Avatar>
                            </div>
                            <div>
                              <p className="font-medium">{registro.atleta?.nome}</p>
                              <p className="text-sm text-muted-foreground">{registro.atleta?.posicao}</p>
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
                          <div className="mt-3">
                            <Input
                              placeholder="Justificativa da ausência..."
                              className={!registro.justificativa ? "border-red-200" : ""}
                              value={registro.justificativa || ''}
                              onChange={(e) => handleUpdateJustification(atletaIndex, e.target.value)}
                            />
                          </div>
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
      
      {/* Botão de salvar */}
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
