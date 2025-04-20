import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import PageTitle from '@/components/PageTitle';
import { Meta, MetaInput, getMetas, criarMeta, verificarECriarTabelaMetas } from '@/services/metasService';
import MetaDetalhes from '@/components/metas/MetaDetalhes';
import { CalendarIcon, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';
import { sendGoalNotification } from '@/services/notificationService';

const MetasEvolucao = () => {
  const { toast } = useToast();
  const [filtroAtleta, setFiltroAtleta] = useState<string>("todos");
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroTime, setFiltroTime] = useState<string>("todos");
  const [metaSelecionada, setMetaSelecionada] = useState<string | null>(null);
  const [modalNovaMetaAberto, setModalNovaMetaAberto] = useState(false);
  const [modalConfiguracaoAberto, setModalConfiguracaoAberto] = useState(false);
  const [tabelaExiste, setTabelaExiste] = useState<boolean | null>(null);
  const [criandoTabela, setCriandoTabela] = useState(false);
  const [novaMetaForm, setNovaMetaForm] = useState<MetaInput>({
    atleta_id: '',
    titulo: '',
    descricao: '',
    progresso: 0,
    data_alvo: '',
    observacoes: ''
  });

  // Consulta para buscar atletas
  const { data: atletas, isLoading: carregandoAtletas } = useQuery({
    queryKey: ['atletas'],
    queryFn: async () => {
      try {
        // Buscar atletas diretamente do Supabase em vez de usar a API
        const { data, error } = await supabase
          .from('athletes')
          .select('id, nome, time')
          .order('nome');
          
        if (error) throw error;
        
        // Filtrar atletas sem id (por segurança)
        return (data || []).filter(atleta => !!atleta.id);
      } catch (error) {
        console.error('Erro ao buscar atletas:', error);
        return [];
      }
    }
  });

  // Consulta para buscar metas
  const { 
    data: metas, 
    isLoading: carregandoMetas,
    refetch: recarregarMetas
  } = useQuery({
    queryKey: ['metas', filtroAtleta, filtroStatus, filtroTime],
    queryFn: async () => {
      try {
        return await getMetas({
          atletaId: filtroAtleta === "todos" ? undefined : filtroAtleta,
          status: filtroStatus === 'todos' ? undefined : (filtroStatus as 'concluido' | 'pendente' | 'atrasado' | undefined),
          time: filtroTime === "todos" ? undefined : (filtroTime as 'masculino' | 'feminino' | undefined)
        });
      } catch (error) {
        console.error('Erro ao buscar metas:', error);
        return [];
      }
    }
  });

  // Agrupar metas por status
  const metasConcluidas = metas?.filter(meta => meta.progresso === 100) || [];
  const metasPendentes = metas?.filter(meta => {
    const dataAlvo = new Date(meta.data_alvo);
    const hoje = new Date();
    return meta.progresso < 100 && dataAlvo >= hoje;
  }) || [];
  const metasAtrasadas = metas?.filter(meta => {
    const dataAlvo = new Date(meta.data_alvo);
    const hoje = new Date();
    return meta.progresso < 100 && dataAlvo < hoje;
  }) || [];

  // Verificar se a tabela existe ao montar o componente
  useEffect(() => {
    const verificarTabela = async () => {
      try {
        const resultado = await verificarECriarTabelaMetas();
        setTabelaExiste(resultado);
      } catch (error) {
        console.error('Erro ao verificar tabela:', error);
        setTabelaExiste(false);
      }
    };
    
    verificarTabela();
  }, []);

  const handleCriarTabela = async () => {
    try {
      setCriandoTabela(true);
      const resultado = await verificarECriarTabelaMetas();
      setTabelaExiste(resultado);
      
      if (resultado) {
        toast({
          title: 'Tabela criada',
          description: 'A estrutura de dados foi criada com sucesso!',
        });
        recarregarMetas();
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível criar a estrutura de dados',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível criar a estrutura de dados',
        variant: 'destructive',
      });
    } finally {
      setCriandoTabela(false);
      setModalConfiguracaoAberto(false);
    }
  };

  const handleCriarMeta = async () => {
    try {
      // Validar formulário
      if (!novaMetaForm.atleta_id) {
        toast({
          title: 'Campo obrigatório',
          description: 'Selecione um atleta',
          variant: 'destructive',
        });
        return;
      }

      if (!novaMetaForm.titulo) {
        toast({
          title: 'Campo obrigatório',
          description: 'Preencha o título da meta',
          variant: 'destructive',
        });
        return;
      }

      if (!novaMetaForm.data_alvo) {
        toast({
          title: 'Campo obrigatório',
          description: 'Defina uma data alvo',
          variant: 'destructive',
        });
        return;
      }

      // Criar meta
      const novaMeta = await criarMeta(novaMetaForm);

      // Enviar notificação
      try {
        await sendGoalNotification(
          novaMetaForm.atleta_id,
          novaMetaForm.titulo,
          novaMetaForm.descricao
        );
        console.log('Notificação de meta enviada com sucesso');
      } catch (notificationError) {
        console.error('Erro ao enviar notificação de meta:', notificationError);
        // Continuar com o fluxo mesmo se a notificação falhar
      }

      // Fechar modal e resetar formulário
      setModalNovaMetaAberto(false);
      setNovaMetaForm({
        atleta_id: '',
        titulo: '',
        descricao: '',
        progresso: 0,
        data_alvo: '',
        observacoes: ''
      });

      // Recarregar metas
      recarregarMetas();

      toast({
        title: 'Meta criada',
        description: 'A meta foi criada com sucesso',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível criar a meta',
        variant: 'destructive',
      });
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNovaMetaForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Componente de Card para Meta
  const MetaCard = ({ meta }: { meta: Meta }) => {
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
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{meta.titulo}</CardTitle>
              <CardDescription>{meta.nome_atleta}</CardDescription>
            </div>
            <Badge className={statusClass} variant="outline">
              <div className="flex items-center gap-1">
                {statusIcon}
                <span>{statusText}</span>
              </div>
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-2">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Progresso</span>
              <span className="text-sm">{meta.progresso}%</span>
            </div>
            <Progress value={meta.progresso} className="h-2" />
          </div>
          <div className="flex items-center text-sm text-muted-foreground mt-2">
            <CalendarIcon size={14} className="mr-1" />
            <span>
              {format(new Date(meta.data_alvo), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </span>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setMetaSelecionada(meta.id)}
          >
            Ver Evolução
          </Button>
        </CardFooter>
      </Card>
    );
  };

  // Se a tabela não existir, mostrar mensagem
  if (tabelaExiste === false) {
    return (
      <div className="container px-4 py-6">
        <PageTitle title="Metas & Evolução" />
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Configuração Necessária</CardTitle>
            <CardDescription>
              A estrutura de dados para metas ainda não foi configurada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Para utilizar o recurso de Metas & Evolução, é necessário criar a estrutura de dados no banco. 
              Isso é um processo único que criará as tabelas necessárias para armazenar as metas e o histórico de evolução.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleCriarTabela}
              disabled={criandoTabela}
            >
              {criandoTabela ? 'Criando estrutura...' : 'Configurar Agora'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container px-4 py-6">
      <PageTitle title="Metas & Evolução" />
      
      {metaSelecionada ? (
        <MetaDetalhes 
          metaId={metaSelecionada} 
          onVoltar={() => setMetaSelecionada(null)}
          onAtualizacao={() => recarregarMetas()}
        />
      ) : (
        <>
          {/* Filtros */}
          <div className="flex flex-col md:flex-row gap-2 mb-6">
            <Select
              value={filtroAtleta}
              onValueChange={setFiltroAtleta}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Atleta" />
              </SelectTrigger>
              <SelectContent>
                {atletas && atletas.length > 0 ? (
                  <>
                    <SelectItem value="todos">Todos os atletas</SelectItem>
                    {atletas.map((atleta) => (
                      atleta.id && (
                        <SelectItem key={atleta.id} value={atleta.id}>
                          {atleta.nome}
                        </SelectItem>
                      )
                    ))}
                  </>
                ) : (
                  <SelectItem value="carregando">Carregando atletas...</SelectItem>
                )}
              </SelectContent>
            </Select>
            
            <Select
              value={filtroStatus}
              onValueChange={setFiltroStatus}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="pendente">Em andamento</SelectItem>
                <SelectItem value="concluido">Concluídas</SelectItem>
                <SelectItem value="atrasado">Atrasadas</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={filtroTime}
              onValueChange={setFiltroTime}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os times</SelectItem>
                <SelectItem value="masculino">Masculino</SelectItem>
                <SelectItem value="feminino">Feminino</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex-grow"></div>
            
            <AlertDialog open={modalNovaMetaAberto} onOpenChange={setModalNovaMetaAberto}>
              <AlertDialogTrigger asChild>
                <Button>Criar Nova Meta</Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-[500px]">
                <AlertDialogHeader>
                  <AlertDialogTitle>Criar Nova Meta</AlertDialogTitle>
                  <AlertDialogDescription>
                    Preencha os dados para adicionar uma nova meta de evolução para o atleta.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="atleta_id">Atleta</Label>
                    <Select
                      name="atleta_id"
                      value={novaMetaForm.atleta_id}
                      onValueChange={(value) => setNovaMetaForm(prev => ({ ...prev, atleta_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um atleta" />
                      </SelectTrigger>
                      <SelectContent>
                        {atletas && atletas.length > 0 ? (
                          atletas.map((atleta) => (
                            atleta.id && (
                              <SelectItem key={atleta.id} value={atleta.id}>
                                {atleta.nome}
                              </SelectItem>
                            )
                          ))
                        ) : (
                          <SelectItem value="carregando" disabled>
                            Carregando atletas...
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="titulo">Título</Label>
                    <Input
                      id="titulo"
                      name="titulo"
                      value={novaMetaForm.titulo}
                      onChange={handleInputChange}
                      placeholder="Ex: Melhorar saque com salto"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      name="descricao"
                      value={novaMetaForm.descricao}
                      onChange={handleInputChange}
                      placeholder="Descreva detalhes da meta"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="data_alvo">Data Alvo</Label>
                    <Input
                      id="data_alvo"
                      name="data_alvo"
                      type="date"
                      value={novaMetaForm.data_alvo}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="progresso">Progresso Inicial (%)</Label>
                    <Input
                      id="progresso"
                      name="progresso"
                      type="number"
                      min="0"
                      max="100"
                      value={novaMetaForm.progresso}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      name="observacoes"
                      value={novaMetaForm.observacoes}
                      onChange={handleInputChange}
                      placeholder="Observações adicionais"
                      rows={2}
                    />
                  </div>
                </div>
                
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCriarMeta}>Criar Meta</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          
          {/* Tabs para os diferentes status */}
          <Tabs defaultValue="todas">
            <TabsList className="mb-4">
              <TabsTrigger value="todas">
                Todas ({metas?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="andamento">
                Em Andamento ({metasPendentes.length})
              </TabsTrigger>
              <TabsTrigger value="concluidas">
                Concluídas ({metasConcluidas.length})
              </TabsTrigger>
              <TabsTrigger value="atrasadas">
                Atrasadas ({metasAtrasadas.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="todas">
              {carregandoMetas ? (
                <div className="flex justify-center items-center h-40">
                  <p>Carregando metas...</p>
                </div>
              ) : metas?.length === 0 ? (
                <div className="text-center p-8 border rounded-lg">
                  <p className="text-muted-foreground">Nenhuma meta encontrada.</p>
                  <Button onClick={() => setModalNovaMetaAberto(true)} className="mt-4">
                    Criar Nova Meta
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {metas?.map(meta => (
                    <MetaCard key={meta.id} meta={meta} />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="andamento">
              {metasPendentes.length === 0 ? (
                <div className="text-center p-8 border rounded-lg">
                  <p className="text-muted-foreground">Nenhuma meta em andamento.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {metasPendentes.map(meta => (
                    <MetaCard key={meta.id} meta={meta} />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="concluidas">
              {metasConcluidas.length === 0 ? (
                <div className="text-center p-8 border rounded-lg">
                  <p className="text-muted-foreground">Nenhuma meta concluída.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {metasConcluidas.map(meta => (
                    <MetaCard key={meta.id} meta={meta} />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="atrasadas">
              {metasAtrasadas.length === 0 ? (
                <div className="text-center p-8 border rounded-lg">
                  <p className="text-muted-foreground">Nenhuma meta atrasada.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {metasAtrasadas.map(meta => (
                    <MetaCard key={meta.id} meta={meta} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default MetasEvolucao; 