import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  getMetaById, 
  atualizarMeta, 
  registrarProgressoMeta, 
  excluirMeta,
  getHistoricoProgresso
} from '@/services/metasService';
import { ArrowLeft, CalendarIcon, CheckCircle, Clock, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface DadosGrafico {
  data: string;
  progresso: number;
  observacao?: string;
}

interface MetaDetalhesProps {
  metaId: string;
  onVoltar: () => void;
  onAtualizacao: () => void;
}

const MetaDetalhes: React.FC<MetaDetalhesProps> = ({ 
  metaId, 
  onVoltar, 
  onAtualizacao 
}) => {
  const { toast } = useToast();
  const [modoEdicao, setModoEdicao] = useState(false);
  const [modoAtualizarProgresso, setModoAtualizarProgresso] = useState(false);
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [novoProgresso, setNovoProgresso] = useState<number>(0);
  const [observacaoProgresso, setObservacaoProgresso] = useState('');
  const [metaForm, setMetaForm] = useState({
    titulo: '',
    descricao: '',
    data_alvo: '',
    observacoes: ''
  });
  const isMobile = useIsMobile();

  // Buscar dados da meta
  const { 
    data: meta, 
    isLoading: carregandoMeta,
    refetch: recarregarMeta
  } = useQuery({
    queryKey: ['meta', metaId],
    queryFn: async () => {
      return await getMetaById(metaId);
    }
  });

  // Buscar histórico de progresso
  const { 
    data: historicoProgresso, 
    isLoading: carregandoHistorico,
    refetch: recarregarHistorico 
  } = useQuery({
    queryKey: ['historico-progresso', metaId],
    queryFn: async () => {
      return await getHistoricoProgresso(metaId);
    }
  });

  // Atualizar form quando meta carrega
  useEffect(() => {
    if (meta) {
      setMetaForm({
        titulo: meta.titulo,
        descricao: meta.descricao,
        data_alvo: meta.data_alvo,
        observacoes: meta.observacoes || ''
      });
      setNovoProgresso(meta.progresso);
    }
  }, [meta]);

  // Preparar dados para o gráfico
  const dadosGrafico = React.useMemo<DadosGrafico[]>(() => {
    if (!historicoProgresso || !meta) return [];

    // Criar array com data de criação e progresso inicial
    const dados: DadosGrafico[] = [
      {
        data: format(new Date(meta.created_at), 'dd/MM/yyyy'),
        progresso: meta.progresso
      }
    ];

    // Adicionar registros do histórico
    historicoProgresso.forEach(registro => {
      dados.push({
        data: format(new Date(registro.created_at), 'dd/MM/yyyy'),
        progresso: registro.progresso,
        observacao: registro.observacao || ''
      });
    });

    return dados;
  }, [historicoProgresso, meta]);

  const handleAtualizarMeta = async () => {
    try {
      if (!metaForm.titulo) {
        toast({
          title: 'Campo obrigatório',
          description: 'O título da meta é obrigatório',
          variant: 'destructive',
        });
        return;
      }

      if (!metaForm.data_alvo) {
        toast({
          title: 'Campo obrigatório',
          description: 'A data alvo é obrigatória',
          variant: 'destructive',
        });
        return;
      }

      await atualizarMeta(metaId, {
        titulo: metaForm.titulo,
        descricao: metaForm.descricao,
        data_alvo: metaForm.data_alvo,
        observacoes: metaForm.observacoes
      });

      setModoEdicao(false);
      recarregarMeta();
      onAtualizacao();

      toast({
        title: 'Meta atualizada',
        description: 'A meta foi atualizada com sucesso',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível atualizar a meta',
        variant: 'destructive',
      });
    }
  };

  const handleAtualizarProgresso = async () => {
    try {
      await registrarProgressoMeta(metaId, novoProgresso, observacaoProgresso);
      
      setModoAtualizarProgresso(false);
      setObservacaoProgresso('');
      recarregarMeta();
      recarregarHistorico();
      onAtualizacao();

      toast({
        title: 'Progresso atualizado',
        description: 'O progresso da meta foi atualizado com sucesso',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível atualizar o progresso',
        variant: 'destructive',
      });
    }
  };

  const handleExcluirMeta = async () => {
    try {
      await excluirMeta(metaId);
      
      setModalExcluirAberto(false);
      onAtualizacao();
      onVoltar();

      toast({
        title: 'Meta excluída',
        description: 'A meta foi excluída com sucesso',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível excluir a meta',
        variant: 'destructive',
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMetaForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Função para obter as iniciais de um nome
  const getInitials = (name: string): string => {
    if (!name) return '';
    
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (carregandoMeta) {
    return (
      <div className="flex justify-center items-center h-40">
        <p>Carregando detalhes da meta...</p>
      </div>
    );
  }

  if (!meta) {
    return (
      <div className="text-center p-8 border rounded-lg">
        <p className="text-muted-foreground">Meta não encontrada.</p>
        <Button onClick={onVoltar} className="mt-4">
          Voltar
        </Button>
      </div>
    );
  }

  // Determinar status
  const dataAlvo = new Date(meta.data_alvo);
  const hoje = new Date();
  
  let statusIcon;
  let statusText;
  let statusClass;
  
  if (meta.progresso === 100) {
    statusIcon = <CheckCircle size={16} className="text-green-500" />;
    statusText = "Concluída";
    statusClass = "bg-green-100 text-green-800";
  } else if (dataAlvo < hoje) {
    statusIcon = <AlertCircle size={16} className="text-red-500" />;
    statusText = "Atrasada";
    statusClass = "bg-red-100 text-red-800";
  } else {
    statusIcon = <Clock size={16} className="text-amber-500" />;
    statusText = "Em andamento";
    statusClass = "bg-amber-100 text-amber-800";
  }

  return (
    <div>
      {/* Cabeçalho */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <Button
            variant="outline"
            size="sm"
            className="touch-feedback"
            onClick={onVoltar}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          
          <div className="flex items-center gap-2">
            <AlertDialog open={modalExcluirAberto} onOpenChange={setModalExcluirAberto}>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-destructive hover:text-destructive touch-feedback"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir esta meta? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                  <AlertDialogCancel className="mt-0">Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleExcluirMeta}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Sim, excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setModoEdicao(true)}
              className="touch-feedback"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold mb-1 break-words">{meta?.titulo}</h2>
        
        <div className="text-muted-foreground break-words">
          {meta?.descricao}
        </div>
      </div>
      
      {/* Detalhes da Meta */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Status da Meta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Progresso Atual</span>
                  <span className="text-sm">{meta?.progresso}%</span>
                </div>
                <Progress value={meta?.progresso} className="h-2" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground mb-0.5">Data Alvo</span>
                  <div className="flex items-center gap-1">
                    <CalendarIcon size={14} className="text-muted-foreground" />
                    <span className="text-sm">
                      {meta?.data_alvo ? format(new Date(meta.data_alvo), "dd/MM/yyyy", { locale: ptBR }) : '-'}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground mb-0.5">Status</span>
                  <div className="flex items-center gap-1">
                    {statusIcon}
                    <span className={cn("text-sm", statusClass)}>
                      {statusText}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Atleta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>{meta?.nome_atleta ? getInitials(meta.nome_atleta) : 'NA'}</AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-medium">{meta?.nome_atleta}</h4>
                <p className="text-sm text-muted-foreground">{meta?.posicao_atleta}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Conteúdo Principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informações da Meta */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da Meta</CardTitle>
          </CardHeader>
          <CardContent>
            {modoEdicao ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="titulo">Título</Label>
                  <Input
                    id="titulo"
                    name="titulo"
                    value={metaForm.titulo}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    name="descricao"
                    value={metaForm.descricao}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="data_alvo">Data Alvo</Label>
                  <Input
                    id="data_alvo"
                    name="data_alvo"
                    type="date"
                    value={metaForm.data_alvo}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div>
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    name="observacoes"
                    value={metaForm.observacoes}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end space-x-2 mt-4">
                  <Button variant="outline" onClick={() => setModoEdicao(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAtualizarMeta}>
                    Salvar Alterações
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Status</h4>
                  <Badge className={statusClass} variant="outline">
                    <div className="flex items-center gap-1">
                      {statusIcon}
                      <span>{statusText}</span>
                    </div>
                  </Badge>
                </div>
                
                <div>
                  <h4 className="font-medium">Descrição</h4>
                  <p className="text-sm text-muted-foreground">
                    {meta.descricao || "Nenhuma descrição fornecida."}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium">Data Alvo</h4>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CalendarIcon size={14} className="mr-1" />
                    <span>
                      {format(new Date(meta.data_alvo), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium">Criado em</h4>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CalendarIcon size={14} className="mr-1" />
                    <span>
                      {format(new Date(meta.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                  </div>
                </div>
                
                {meta.observacoes && (
                  <div>
                    <h4 className="font-medium">Observações</h4>
                    <p className="text-sm text-muted-foreground">
                      {meta.observacoes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Progresso */}
        <Card>
          <CardHeader>
            <CardTitle>Progresso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {modoAtualizarProgresso ? (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <Label htmlFor="progresso">Progresso Atual: {novoProgresso}%</Label>
                  </div>
                  <Slider
                    id="progresso"
                    min={0}
                    max={100}
                    step={1}
                    value={[novoProgresso]}
                    onValueChange={(value) => setNovoProgresso(value[0])}
                    className="my-4"
                  />
                </div>
                
                <div>
                  <Label htmlFor="observacao">Observação</Label>
                  <Textarea
                    id="observacao"
                    value={observacaoProgresso}
                    onChange={(e) => setObservacaoProgresso(e.target.value)}
                    placeholder="Opcional: Adicione uma observação sobre este progresso"
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end space-x-2 mt-4">
                  <Button variant="outline" onClick={() => setModoAtualizarProgresso(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAtualizarProgresso}>
                    Registrar Progresso
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Progresso Atual</span>
                    <span className="text-sm">{meta.progresso}%</span>
                  </div>
                  <Progress value={meta.progresso} className="h-2" />
                </div>
                
                <Button 
                  className="w-full mt-4" 
                  onClick={() => setModoAtualizarProgresso(true)}
                >
                  Atualizar Progresso
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Gráfico de Evolução */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Evolução do Progresso</CardTitle>
          <CardDescription>Histórico de evolução ao longo do tempo</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          {carregandoHistorico ? (
            <div className="flex justify-center items-center h-full">
              <p>Carregando histórico...</p>
            </div>
          ) : dadosGrafico.length < 2 ? (
            <div className="flex justify-center items-center h-full">
              <p className="text-muted-foreground">
                Ainda não há histórico de evolução. Atualize o progresso para começar a registrar.
              </p>
            </div>
          ) : (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={dadosGrafico}
                  margin={{ top: 10, right: 10, bottom: 20, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="data" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      // Em telas menores, simplifica a data
                      if (window.innerWidth < 640) {
                        return value.split(' ')[0]; // Retorna apenas o dia
                      }
                      return value;
                    }}
                    angle={-25}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${value}%`}
                    width={40}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === 'progresso') return [`${value}%`, 'Progresso'];
                      return [value, name];
                    }}
                    labelFormatter={(label) => `Data: ${label}`}
                    contentStyle={{ fontSize: '12px', padding: '8px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="progresso"
                    stroke="#1d4ed8"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Histórico de Atualizações */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Histórico de Atualizações</CardTitle>
          <CardDescription>Registro de todas as atualizações de progresso</CardDescription>
        </CardHeader>
        <CardContent>
          {carregandoHistorico ? (
            <div className="flex justify-center items-center h-20">
              <p>Carregando histórico...</p>
            </div>
          ) : !historicoProgresso || historicoProgresso.length === 0 ? (
            <div className="text-center p-4">
              <p className="text-muted-foreground">
                Nenhuma atualização de progresso registrada.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {historicoProgresso.map((registro, index) => (
                <div key={index} className="border-b pb-3 last:border-b-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">Progresso: {registro.progresso}%</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(registro.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </div>
                    </div>
                    <Badge>{registro.progresso}%</Badge>
                  </div>
                  {registro.observacao && (
                    <div className="mt-2 text-sm">
                      <span className="font-medium">Observação:</span> {registro.observacao}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MetaDetalhes; 