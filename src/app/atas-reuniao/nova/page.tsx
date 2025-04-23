'use client';

import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { criarAta, validarAta, fetchAtaReuniao, atualizarAtaReuniao } from '@/services/atasReuniaoService';
import { AtaReuniao, Topico, Decisao } from '@/types/atasReuniao';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon, PlusIcon, TrashIcon, ArrowLeftIcon, SaveIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

export default function NovaAtaReuniao() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [carregando, setCarregando] = useState(false);
  const [carregandoDados, setCarregandoDados] = useState(false);
  const [erros, setErros] = useState<string[]>([]);
  const modoEdicao = !!id;
  
  // Inicializa com data atual
  const dataAtual = new Date();
  
  const [ata, setAta] = useState<Partial<AtaReuniao>>({
    titulo: '',
    data: format(dataAtual, 'yyyy-MM-dd'),
    participantes: [''],
    topicos: [{ titulo: '', descricao: '' }],
    decisoes: []
  });

  const [data, setData] = useState<Date>(dataAtual);

  // Carregar dados da ata para edição
  useEffect(() => {
    async function carregarAta() {
      if (!id) return;
      
      setCarregandoDados(true);
      try {
        const dadosAta = await fetchAtaReuniao(id);
        if (dadosAta) {
          setAta(dadosAta);
          if (dadosAta.data) {
            setData(new Date(dadosAta.data));
          }
        } else {
          toast.error('Ata não encontrada');
          navigate('/atas-reuniao');
        }
      } catch (error) {
        console.error('Erro ao carregar ata:', error);
        toast.error('Erro ao carregar dados da ata');
      } finally {
        setCarregandoDados(false);
      }
    }
    
    if (modoEdicao) {
      carregarAta();
    }
  }, [id, modoEdicao, navigate]);

  // Atualiza o estado da ata (campos simples)
  const atualizarAta = (campo: keyof AtaReuniao, valor: any) => {
    setAta(prev => ({ ...prev, [campo]: valor }));
  };

  // Atualiza participantes
  const atualizarParticipante = (index: number, valor: string) => {
    const novosParticipantes = [...(ata.participantes || [])];
    novosParticipantes[index] = valor;
    atualizarAta('participantes', novosParticipantes);
  };

  // Adiciona um novo participante
  const adicionarParticipante = () => {
    atualizarAta('participantes', [...(ata.participantes || []), '']);
  };

  // Remove um participante
  const removerParticipante = (index: number) => {
    const novosParticipantes = ata.participantes.filter((_, i) => i !== index);
    atualizarAta('participantes', novosParticipantes);
  };

  // Atualiza tópicos
  const atualizarTopico = (index: number, campo: keyof Topico, valor: string) => {
    const novosTopicos = [...ata.topicos];
    novosTopicos[index] = { ...novosTopicos[index], [campo]: valor };
    atualizarAta('topicos', novosTopicos);
  };

  // Adiciona um novo tópico
  const adicionarTopico = () => {
    atualizarAta('topicos', [...ata.topicos, { titulo: '', descricao: '' }]);
  };

  // Remove um tópico
  const removerTopico = (index: number) => {
    const novosTopicos = ata.topicos.filter((_, i) => i !== index);
    atualizarAta('topicos', novosTopicos);
  };

  // Atualiza decisões
  const atualizarDecisao = (index: number, campo: keyof Decisao, valor: string) => {
    const novasDecisoes = [...ata.decisoes];
    novasDecisoes[index] = { ...novasDecisoes[index], [campo]: valor };
    atualizarAta('decisoes', novasDecisoes);
  };

  // Adiciona uma nova decisão
  const adicionarDecisao = () => {
    atualizarAta('decisoes', [...ata.decisoes, { titulo: '', descricao: '', responsavel: '' }]);
  };

  // Remove uma decisão
  const removerDecisao = (index: number) => {
    const novasDecisoes = ata.decisoes.filter((_, i) => i !== index);
    atualizarAta('decisoes', novasDecisoes);
  };

  // Salva a ata
  const salvarAta = async () => {
    setCarregando(true);
    setErros([]);
    
    try {
      if (!ata.titulo || !ata.data) {
        setErros(['Título e data são obrigatórios']);
        setCarregando(false);
        return;
      }
      
      // Formatar dados
      const dadosFormatados = {
        ...ata,
        data: typeof ata.data === 'string' ? ata.data : format(ata.data, 'yyyy-MM-dd')
      };
      
      let resposta;
      
      if (modoEdicao && id) {
        resposta = await atualizarAtaReuniao(id, dadosFormatados);
        if (resposta) {
          toast.success('Ata de reunião atualizada com sucesso!');
          navigate(`/atas-reuniao/${id}`);
        }
      } else {
        // Para criação, precisamos garantir que temos os campos obrigatórios
        if (!ata.titulo || !ata.data || !ata.participantes || !ata.topicos) {
          setErros(['Informações obrigatórias incompletas']);
          setCarregando(false);
          return;
        }
        
        // Para criar, precisamos garantir o tipo completo
        const ataCompleta = {
          id: '', // Será gerado pelo backend
          titulo: ata.titulo,
          data: typeof ata.data === 'string' ? ata.data : format(ata.data, 'yyyy-MM-dd'),
          participantes: ata.participantes || [],
          topicos: ata.topicos || [],
          decisoes: ata.decisoes || [],
          dataCriacao: new Date().toISOString(),
          observacoes: ata.observacoes,
          responsavelRegistro: ata.responsavelRegistro
        } as AtaReuniao;
        
        const novoId = await criarAta(ataCompleta);
        if (novoId) {
          toast.success('Ata de reunião criada com sucesso!');
          navigate('/atas-reuniao');
        } else {
          toast.error('Erro ao criar ata de reunião');
        }
      }
    } catch (error) {
      console.error('Erro ao salvar ata:', error);
      toast.error(`Erro ao ${modoEdicao ? 'atualizar' : 'criar'} ata de reunião`);
    } finally {
      setCarregando(false);
    }
  };

  // Atualiza a data
  const atualizarData = (novaData: Date | undefined) => {
    if (novaData) {
      setData(novaData);
      atualizarAta('data', format(novaData, 'yyyy-MM-dd'));
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/atas-reuniao')}>
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{modoEdicao ? 'Editar' : 'Nova'} Ata de Reunião</h1>
            <p className="text-muted-foreground">
              {modoEdicao ? 'Atualize os detalhes da reunião' : 'Registre os detalhes da reunião realizada'}
            </p>
          </div>
        </div>
      </div>

      {erros.length > 0 && (
        <div className="bg-destructive/15 border border-destructive text-destructive p-4 rounded-md mb-6">
          <h3 className="font-semibold mb-2">Corrija os seguintes erros:</h3>
          <ul className="list-disc pl-5">
            {erros.map((erro, i) => (
              <li key={i}>{erro}</li>
            ))}
          </ul>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Informações Gerais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="titulo">Título da Reunião</Label>
            <Input
              id="titulo"
              placeholder="Ex: Planejamento Semanal"
              value={ata.titulo}
              onChange={(e) => atualizarAta('titulo', e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="data">Data</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full pl-3 text-left font-normal flex justify-between items-center",
                    !ata.data && "text-muted-foreground"
                  )}
                >
                  {ata.data ? format(data, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Selecione uma data"}
                  <CalendarIcon className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={data}
                  onSelect={atualizarData}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Participantes</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={adicionarParticipante}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>
            
            {ata.participantes.map((participante, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder="Nome do participante"
                  value={participante}
                  onChange={(e) => atualizarParticipante(index, e.target.value)}
                  className="flex-1"
                />
                {ata.participantes.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removerParticipante(index)}
                  >
                    <TrashIcon className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>

        <CardHeader>
          <CardTitle>Tópicos Discutidos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            type="button"
            variant="outline"
            onClick={adicionarTopico}
            className="mb-4"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Adicionar Tópico
          </Button>

          {ata.topicos.map((topico, index) => (
            <Card key={index} className="shadow-sm">
              <CardHeader className="py-3 px-4 flex flex-row items-start justify-between space-y-0">
                <div className="w-full">
                  <Label htmlFor={`topico-titulo-${index}`} className="text-xs font-normal text-muted-foreground">
                    Título do Tópico
                  </Label>
                  <Input
                    id={`topico-titulo-${index}`}
                    placeholder="Título do tópico"
                    value={topico.titulo}
                    onChange={(e) => atualizarTopico(index, 'titulo', e.target.value)}
                    className="mt-1"
                  />
                </div>
                {ata.topicos.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removerTopico(index)}
                    className="mt-5"
                  >
                    <TrashIcon className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="py-3 px-4">
                <Label htmlFor={`topico-descricao-${index}`} className="text-xs font-normal text-muted-foreground">
                  Descrição
                </Label>
                <Textarea
                  id={`topico-descricao-${index}`}
                  placeholder="Descreva o que foi discutido neste tópico"
                  value={topico.descricao}
                  onChange={(e) => atualizarTopico(index, 'descricao', e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </CardContent>
            </Card>
          ))}
        </CardContent>

        <CardHeader>
          <CardTitle>Decisões Tomadas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            type="button"
            variant="outline"
            onClick={adicionarDecisao}
            className="mb-4"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Adicionar Decisão
          </Button>

          {(ata.decisoes || []).map((decisao, index) => (
            <Card key={index} className="shadow-sm">
              <CardHeader className="py-3 px-4 flex flex-row items-start justify-between space-y-0">
                <div className="w-full">
                  <Label htmlFor={`decisao-titulo-${index}`} className="text-xs font-normal text-muted-foreground">
                    Decisão
                  </Label>
                  <Input
                    id={`decisao-titulo-${index}`}
                    placeholder="Título da decisão tomada"
                    value={decisao.titulo}
                    onChange={(e) => atualizarDecisao(index, 'titulo', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removerDecisao(index)}
                  className="mt-5"
                >
                  <TrashIcon className="h-4 w-4 text-destructive" />
                </Button>
              </CardHeader>
              <CardContent className="py-3 px-4 grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label htmlFor={`decisao-descricao-${index}`} className="text-xs font-normal text-muted-foreground">
                    Descrição
                  </Label>
                  <Textarea
                    id={`decisao-descricao-${index}`}
                    placeholder="Descreva a decisão em detalhes"
                    value={decisao.descricao}
                    onChange={(e) => atualizarDecisao(index, 'descricao', e.target.value)}
                    className="mt-1"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor={`decisao-responsavel-${index}`} className="text-xs font-normal text-muted-foreground">
                    Responsável
                  </Label>
                  <Input
                    id={`decisao-responsavel-${index}`}
                    placeholder="Nome do responsável"
                    value={decisao.responsavel || ''}
                    onChange={(e) => atualizarDecisao(index, 'responsavel', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>

        <CardFooter className="flex justify-between pt-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/atas-reuniao')}
          >
            Cancelar
          </Button>
          <Button 
            onClick={salvarAta} 
            disabled={carregando}
          >
            {carregando ? (
              <div className="flex items-center">
                <div className="animate-spin h-4 w-4 border-2 border-white rounded-full mr-2 border-t-transparent"></div>
                Salvando...
              </div>
            ) : (
              <>
                <SaveIcon className="h-4 w-4 mr-2" />
                {modoEdicao ? 'Atualizar' : 'Salvar'} Ata
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 