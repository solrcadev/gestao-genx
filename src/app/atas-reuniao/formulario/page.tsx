'use client';

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, Trash2, Plus, Save } from 'lucide-react';
import { toast } from 'sonner';

import { 
  AtaReuniao, 
  TopicoDaAta, 
  DecisaoDaAta 
} from '@/types/atasReuniao';
import { 
  fetchAtaReuniao, 
  criarAtaReuniao, 
  atualizarAtaReuniao, 
  validarAta 
} from '@/services/atasReuniaoService';

// Esquema para validação do tópico
const topicoSchema = z.object({
  id: z.string().optional(),
  descricao: z.string().min(3, { message: 'A descrição do tópico é obrigatória e deve ter pelo menos 3 caracteres' })
});

// Esquema para validação da decisão
const decisaoSchema = z.object({
  id: z.string().optional(),
  descricao: z.string().min(3, { message: 'A descrição da decisão é obrigatória e deve ter pelo menos 3 caracteres' }),
  responsavel: z.string().optional(),
  prazo: z.string().optional()
});

// Esquema para validação do formulário completo
const formSchema = z.object({
  titulo: z.string().min(3, { message: 'O título é obrigatório e deve ter pelo menos 3 caracteres' }),
  data: z.date({ required_error: 'A data da reunião é obrigatória' }),
  participantes: z.array(z.string()).min(1, { message: 'Adicione pelo menos um participante' }),
  novoParticipante: z.string().optional(),
  topicos: z.array(topicoSchema).min(1, { message: 'Adicione pelo menos um tópico' }),
  decisoes: z.array(decisaoSchema).optional(),
  observacoes: z.string().optional(),
  responsavelRegistro: z.string().min(3, { message: 'Responsável pelo registro é obrigatório' })
});

// Tipo derivado do schema do formulário
type FormValues = z.infer<typeof formSchema>;

export default function FormularioAtaReuniao() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [novoParticipante, setNovoParticipante] = useState('');

  // Configuração do formulário com React Hook Form e Zod
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titulo: '',
      data: new Date(),
      participantes: [],
      novoParticipante: '',
      topicos: [{ descricao: '' }],
      decisoes: [],
      observacoes: '',
      responsavelRegistro: ''
    }
  });

  // Configuração dos arrays de campos para tópicos e decisões
  const { fields: topicosFields, append: appendTopico, remove: removeTopico } = useFieldArray({
    control: form.control,
    name: 'topicos'
  });

  const { fields: decisoesFields, append: appendDecisao, remove: removeDecisao } = useFieldArray({
    control: form.control,
    name: 'decisoes'
  });

  // Carregar dados da ata para edição, se necessário
  useEffect(() => {
    const carregarAta = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const ata = await fetchAtaReuniao(id);
        
        if (!ata) {
          toast.error('Ata não encontrada');
          navigate('/atas-reuniao');
          return;
        }
        
        // Converter a data de string para objeto Date
        const dataAta = new Date(ata.data);
        
        // Resetar o formulário com os dados da ata
        form.reset({
          titulo: ata.titulo,
          data: dataAta,
          participantes: ata.participantes || [],
          topicos: ata.topicos?.length > 0 ? ata.topicos : [{ descricao: '' }],
          decisoes: ata.decisoes || [],
          observacoes: ata.observacoes || '',
          responsavelRegistro: ata.responsavelRegistro || ''
        });
      } catch (error) {
        console.error('Erro ao carregar ata:', error);
        toast.error('Erro ao carregar dados da ata');
      } finally {
        setLoading(false);
      }
    };
    
    carregarAta();
  }, [id, navigate, form]);

  // Função para adicionar um novo participante
  const adicionarParticipante = () => {
    if (!novoParticipante.trim()) return;
    
    const participantesAtuais = form.getValues('participantes') || [];
    
    // Verificar se o participante já existe
    if (participantesAtuais.includes(novoParticipante.trim())) {
      toast.error('Este participante já foi adicionado');
      return;
    }
    
    form.setValue('participantes', [...participantesAtuais, novoParticipante.trim()]);
    setNovoParticipante('');
  };

  // Função para remover um participante
  const removerParticipante = (index: number) => {
    const participantesAtuais = form.getValues('participantes');
    const novosParticipantes = [...participantesAtuais];
    novosParticipantes.splice(index, 1);
    form.setValue('participantes', novosParticipantes);
  };

  // Função para enviar o formulário
  const onSubmit = async (data: FormValues) => {
    setSaving(true);
    
    try {
      // Criar objeto da ata
      const ata: AtaReuniao = {
        id: id,
        titulo: data.titulo,
        data: data.data.toISOString().split('T')[0],
        participantes: data.participantes,
        topicos: data.topicos as TopicoDaAta[],
        decisoes: data.decisoes as DecisaoDaAta[],
        observacoes: data.observacoes,
        responsavelRegistro: data.responsavelRegistro
      };
      
      // Validar a ata antes de salvar
      const erros = validarAta(ata);
      if (erros.length > 0) {
        erros.forEach(erro => toast.error(erro));
        return;
      }
      
      // Salvar a ata
      if (id) {
        // Atualizar ata existente
        await atualizarAtaReuniao(ata);
        toast.success('Ata atualizada com sucesso!');
      } else {
        // Criar nova ata
        await criarAtaReuniao(ata);
        toast.success('Ata criada com sucesso!');
      }
      
      // Redirecionar para a lista de atas
      navigate('/atas-reuniao');
    } catch (error) {
      console.error('Erro ao salvar ata:', error);
      toast.error('Erro ao salvar ata de reunião');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-100px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">
        {id ? 'Editar Ata de Reunião' : 'Nova Ata de Reunião'}
      </h1>
      
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Informações básicas */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>
              Informe o título, data e responsável pelo registro da reunião
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título da Reunião</Label>
              <Input
                id="titulo"
                placeholder="Ex: Reunião de Planejamento Semanal"
                {...form.register('titulo')}
              />
              {form.formState.errors.titulo && (
                <p className="text-sm text-red-500">{form.formState.errors.titulo.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="data">Data da Reunião</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.getValues('data') ? (
                      format(form.getValues('data'), 'PPP', { locale: ptBR })
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={form.getValues('data')}
                    onSelect={(date) => date && form.setValue('data', date)}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              {form.formState.errors.data && (
                <p className="text-sm text-red-500">{form.formState.errors.data.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="responsavelRegistro">Responsável pelo Registro</Label>
              <Input
                id="responsavelRegistro"
                placeholder="Nome de quem está registrando a ata"
                {...form.register('responsavelRegistro')}
              />
              {form.formState.errors.responsavelRegistro && (
                <p className="text-sm text-red-500">{form.formState.errors.responsavelRegistro.message}</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Participantes */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Participantes</CardTitle>
            <CardDescription>
              Adicione os participantes da reunião
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Nome do participante"
                value={novoParticipante}
                onChange={(e) => setNovoParticipante(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), adicionarParticipante())}
              />
              <Button type="button" onClick={adicionarParticipante}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>
            
            {form.formState.errors.participantes && (
              <p className="text-sm text-red-500">{form.formState.errors.participantes.message}</p>
            )}
            
            <div className="mt-2">
              {form.watch('participantes')?.length > 0 ? (
                <div className="space-y-2">
                  {form.watch('participantes').map((participante, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span>{participante}</span>
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => removerParticipante(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    Nenhum participante adicionado ainda
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Tópicos */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Tópicos Discutidos</CardTitle>
            <CardDescription>
              Liste os tópicos abordados durante a reunião
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {topicosFields.map((field, index) => (
              <div key={field.id} className="flex items-start space-x-2">
                <div className="flex-1">
                  <Textarea
                    placeholder={`Tópico ${index + 1}`}
                    {...form.register(`topicos.${index}.descricao`)}
                  />
                  {form.formState.errors.topicos?.[index]?.descricao && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.topicos[index]?.descricao?.message}
                    </p>
                  )}
                </div>
                
                <Button 
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTopico(index)}
                  disabled={topicosFields.length === 1}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={() => appendTopico({ descricao: '' })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Tópico
            </Button>
            
            {form.formState.errors.topicos && !Array.isArray(form.formState.errors.topicos) && (
              <p className="text-sm text-red-500">{form.formState.errors.topicos.message}</p>
            )}
          </CardContent>
        </Card>
        
        {/* Decisões */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Decisões e Encaminhamentos</CardTitle>
            <CardDescription>
              Registre as decisões tomadas e os próximos passos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {decisoesFields.map((field, index) => (
              <div key={field.id} className="space-y-2 p-3 border rounded">
                <div className="flex items-start justify-between">
                  <Label htmlFor={`decisao-${index}`}>Decisão {index + 1}</Label>
                  <Button 
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDecisao(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
                
                <Textarea
                  id={`decisao-${index}`}
                  placeholder="Descreva a decisão tomada"
                  {...form.register(`decisoes.${index}.descricao`)}
                />
                {form.formState.errors.decisoes?.[index]?.descricao && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.decisoes[index]?.descricao?.message}
                  </p>
                )}
                
                <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
                  <div className="flex-1">
                    <Label htmlFor={`responsavel-${index}`}>Responsável</Label>
                    <Input
                      id={`responsavel-${index}`}
                      placeholder="Responsável pela ação"
                      {...form.register(`decisoes.${index}.responsavel`)}
                    />
                  </div>
                  
                  <div className="flex-1">
                    <Label htmlFor={`prazo-${index}`}>Prazo</Label>
                    <Input
                      id={`prazo-${index}`}
                      placeholder="Data limite"
                      type="date"
                      {...form.register(`decisoes.${index}.prazo`)}
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={() => appendDecisao({ descricao: '', responsavel: '', prazo: '' })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Decisão
            </Button>
          </CardContent>
        </Card>
        
        {/* Observações */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Observações</CardTitle>
            <CardDescription>
              Informações adicionais sobre a reunião
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Observações, pendências ou informações complementares..."
              className="min-h-[100px]"
              {...form.register('observacoes')}
            />
          </CardContent>
        </Card>
        
        {/* Botões de ação */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/atas-reuniao')}
          >
            Cancelar
          </Button>
          
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Ata
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
} 