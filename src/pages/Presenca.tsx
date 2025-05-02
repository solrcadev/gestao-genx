
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
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
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ArrowLeft, CalendarCheck, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useGetAthleteAttendance, saveAthleteAttendance } from '@/hooks/attendance-hooks';

const Presenca = () => {
  const { treinoDoDiaId } = useParams<{ treinoDoDiaId?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Estado para controlar os dados de presença
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Buscar dados do treino do dia
  const { 
    data: treinoDoDiaInfo, 
    isLoading: isLoadingTreino 
  } = useQuery({
    queryKey: ['treino-do-dia', treinoDoDiaId],
    queryFn: async () => {
      if (!treinoDoDiaId) return null;

      const { data, error } = await supabase
        .from('treinos_do_dia')
        .select(`
          id,
          data,
          treino:treino_id(id, nome, local, horario)
        `)
        .eq('id', treinoDoDiaId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!treinoDoDiaId
  });

  // Buscar presenças dos atletas
  const { 
    data: atletas, 
    isLoading: isLoadingAttendance,
    error: attendanceError
  } = useGetAthleteAttendance(treinoDoDiaId);

  // Mutation para salvar presenças
  const saveAttendanceMutation = useMutation({
    mutationFn: async (data: any[]) => {
      if (!treinoDoDiaId) throw new Error('ID do treino não informado');
      
      // Formatar dados para salvar
      const dadosParaSalvar = data.map(item => ({
        id: item.id || null,
        atleta_id: item.atleta_id,
        presente: item.presente,
        justificativa: item.presente ? null : (item.justificativa || null)
      }));
      
      return await saveAthleteAttendance(treinoDoDiaId, dadosParaSalvar);
    },
    onSuccess: () => {
      toast({
        title: 'Presenças salvas com sucesso!',
        description: 'Os registros de presença foram atualizados.',
        duration: 3000
      });
      
      setHasChanges(false);
      
      // Invalida a consulta para recarregar os dados
      queryClient.invalidateQueries({ queryKey: ['attendance', treinoDoDiaId] });
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

  // Voltar para o treino do dia
  const handleGoBack = () => {
    if (hasChanges) {
      // Confirmar com o usuário se deseja sair sem salvar
      if (window.confirm('Existem alterações não salvas. Deseja sair sem salvar?')) {
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  };

  // Se não houver ID de treino, redirecionar para a página de treino do dia
  useEffect(() => {
    if (!treinoDoDiaId) {
      toast({
        title: 'Treino não selecionado',
        description: 'Por favor, selecione um treino para gerenciar presenças.',
        variant: 'destructive'
      });
      navigate('/treino-do-dia');
    }
  }, [treinoDoDiaId, toast, navigate]);

  // Componente de esqueleto para carregamento
  if (isLoadingTreino || isLoadingAttendance) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32 mt-1" />
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-5 w-full max-w-md" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Componente de erro
  if (attendanceError) {
    return (
      <div className="container mx-auto py-6">
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle>Erro ao carregar presenças</CardTitle>
            </div>
            <CardDescription>
              Não foi possível carregar os dados de presença para este treino.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <p className="text-destructive">{(attendanceError as Error).message}</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/treino-do-dia')}>
                Voltar para Treinos
              </Button>
              <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['attendance'] })}>
                Tentar novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Formatação da data
  const formatarData = (dataStr: string) => {
    const data = new Date(dataStr);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={handleGoBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Gerenciar Presenças</h1>
          <p className="text-muted-foreground">
            {treinoDoDiaInfo ? (
              <>
                {treinoDoDiaInfo.treino?.nome || 'Treino'} • {formatarData(treinoDoDiaInfo.data)}
                {treinoDoDiaInfo.treino?.local && ` • ${treinoDoDiaInfo.treino.local}`}
                {treinoDoDiaInfo.treino?.horario && ` • ${treinoDoDiaInfo.treino.horario}`}
              </>
            ) : (
              'Carregando detalhes do treino...'
            )}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5" />
              Lista de Presença
            </CardTitle>
            <CardDescription>
              Marque os atletas presentes e justifique as ausências
            </CardDescription>
          </div>
          <Button 
            onClick={handleSaveAttendance} 
            disabled={!hasChanges || saveAttendanceMutation.isPending}
            className="flex items-center gap-2"
          >
            {saveAttendanceMutation.isPending ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar Presenças
          </Button>
        </CardHeader>
        <CardContent>
          {attendanceData && attendanceData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Presente</TableHead>
                  <TableHead className="w-[200px]">Atleta</TableHead>
                  <TableHead>Justificativa (se ausente)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceData.map((registro, index) => (
                  <TableRow key={registro.atleta_id}>
                    <TableCell>
                      <Checkbox
                        checked={registro.presente}
                        onCheckedChange={(value) => handleToggleAttendance(index, !!value)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{registro.atleta?.nome}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${registro.atleta?.time === 'Masculino' ? 'bg-sport-blue/10' : 'bg-sport-red/10'}`}
                        >
                          {registro.atleta?.posicao}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder={registro.presente ? 'Presente' : 'Informe a justificativa...'}
                        value={registro.justificativa || ''}
                        onChange={(e) => handleUpdateJustification(index, e.target.value)}
                        disabled={registro.presente}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Não há atletas disponíveis para este treino.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Presenca;
