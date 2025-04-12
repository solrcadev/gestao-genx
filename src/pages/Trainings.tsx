import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, MapPin, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils";
import { fetchTrainings, createTraining, updateTraining, deleteTraining } from '@/services/trainingService';
import { Team, Training } from '@/types';

const formSchema = z.object({
  nome: z.string().min(3, { message: 'Nome deve ter pelo menos 3 caracteres' }),
  local: z.string().min(2, { message: 'Informe o local do treino' }),
  data: z.date({ required_error: 'Selecione uma data para o treino' }),
  descricao: z.string().optional(),
  time: z.enum(["Masculino", "Feminino"], { required_error: 'Selecione o time do treino' })
});

const Trainings = () => {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // React Hook Form setup
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      local: '',
      data: new Date(),
      descricao: '',
      time: "Masculino"
    },
  });

  // Fetch trainings
  const { data: trainings = [], isLoading, error } = useQuery({
    queryKey: ['trainings'],
    queryFn: fetchTrainings,
  });

  // Create training mutation
  const createTrainingMutation = useMutation({
    mutationFn: createTraining,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      toast({ 
        title: 'Treino criado com sucesso!',
        description: 'O treino foi adicionado à lista.',
      });
      setOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      console.error('Error creating training:', error);
      toast({
        title: 'Erro ao criar treino',
        description: error.message || 'Não foi possível criar o treino. Tente novamente.',
        variant: 'destructive',
      });
    }
  });

  // Update training mutation
  const updateTrainingMutation = useMutation({
    mutationFn: (data: { id: string; data: z.infer<typeof formSchema> }) => updateTraining({
      id: data.id,
      nome: data.data.nome,
      local: data.data.local,
      data: data.data.data,
      descricao: data.data.descricao,
      time: data.data.time
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      toast({ 
        title: 'Treino atualizado com sucesso!',
        description: 'As informações do treino foram atualizadas.',
      });
      setEditOpen(false);
      form.reset();
      setIsEditMode(false);
    },
    onError: (error: Error) => {
      console.error('Error updating training:', error);
      toast({
        title: 'Erro ao atualizar treino',
        description: error.message || 'Não foi possível atualizar o treino. Tente novamente.',
        variant: 'destructive',
      });
    }
  });

  // Delete training mutation
  const deleteTrainingMutation = useMutation({
    mutationFn: (id: string) => deleteTraining(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      toast({ 
        title: 'Treino excluído com sucesso!',
        description: 'O treino foi removido da lista.',
      });
      setDeleteOpen(false);
      form.reset();
      setIsEditMode(false);
    },
    onError: (error: Error) => {
      console.error('Error deleting training:', error);
      toast({
        title: 'Erro ao excluir treino',
        description: error.message || 'Não foi possível excluir o treino. Tente novamente.',
        variant: 'destructive',
      });
    }
  });

  // Handlers
  const handleCreateTraining = (values: z.infer<typeof formSchema>) => {
    createTrainingMutation.mutate(values);
  };

  const handleEditTraining = (training: Training) => {
    setSelectedTraining(training);
    setEditOpen(true);
    setIsEditMode(true);
    form.setValue('nome', training.nome);
    form.setValue('local', training.local);
    form.setValue('data', new Date(training.data));
    form.setValue('descricao', training.descricao || '');
    form.setValue('time', training.time);
  };

  const handleUpdateTraining = (values: z.infer<typeof formSchema>) => {
    if (!selectedTraining) return;
    updateTrainingMutation.mutate({ id: selectedTraining.id, data: values });
  };

  const handleDeleteTraining = (training: Training) => {
    setSelectedTraining(training);
    setDeleteOpen(true);
  };

  const confirmDeleteTraining = () => {
    if (!selectedTraining) return;
    deleteTrainingMutation.mutate(selectedTraining.id);
  };

  const handleOpenTreinoDoDia = (trainingId: string) => {
    navigate(`/treino-do-dia/${trainingId}`);
  };

  return (
    <div className="mobile-container pb-20">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Treinos</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Treino
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <LoadingSpinner />
          <p className="text-muted-foreground mt-4">Carregando treinos...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-destructive">Erro ao carregar treinos</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['trainings'] })} variant="outline" className="mt-2">
            Tentar novamente
          </Button>
        </div>
      ) : trainings.length > 0 ? (
        <Table>
          <TableCaption>Lista de treinos cadastrados.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Local</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Time</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trainings.map((training) => (
              <TableRow key={training.id}>
                <TableCell>{training.nome}</TableCell>
                <TableCell>{training.local}</TableCell>
                <TableCell>{format(new Date(training.data), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{training.time}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleOpenTreinoDoDia(training.id)}>
                    <Calendar className="mr-2 h-4 w-4" />
                    Treino do Dia
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEditTraining(training)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteTraining(training)} className="text-destructive hover:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-muted-foreground">Nenhum treino cadastrado</p>
        </div>
      )}

      {/* Create Training Modal */}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Novo Treino</AlertDialogTitle>
            <AlertDialogDescription>
              Preencha as informações do treino para criar um novo registro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateTraining)} className="space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Treino</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Treino Técnico Feminino" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="local"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Local</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Ginásio Principal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data do Treino</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: ptBR })
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (opcional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Detalhes ou objetivos deste treino..." 
                        className="min-h-[100px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={field.value === "Masculino" ? "default" : "outline"}
                          className="flex-1"
                          onClick={() => field.onChange("Masculino")}
                        >
                          Masculino
                        </Button>
                        <Button
                          type="button"
                          variant={field.value === "Feminino" ? "default" : "outline"}
                          className="flex-1"
                          onClick={() => field.onChange("Feminino")}
                        >
                          Feminino
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => {
                  setOpen(false);
                  form.reset();
                }}>Cancelar</AlertDialogCancel>
                <AlertDialogAction disabled={createTrainingMutation.isPending}>
                  {createTrainingMutation.isPending && (
                    <LoadingSpinner />
                  )}
                  Criar
                </AlertDialogAction>
              </AlertDialogFooter>
            </form>
          </Form>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Training Modal */}
      <AlertDialog open={editOpen} onOpenChange={setEditOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Editar Treino</AlertDialogTitle>
            <AlertDialogDescription>
              Atualize as informações do treino selecionado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateTraining)} className="space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Treino</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Treino Técnico Feminino" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="local"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Local</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Ginásio Principal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data do Treino</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: ptBR })
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (opcional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Detalhes ou objetivos deste treino..." 
                        className="min-h-[100px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={field.value === "Masculino" ? "default" : "outline"}
                          className="flex-1"
                          onClick={() => field.onChange("Masculino")}
                        >
                          Masculino
                        </Button>
                        <Button
                          type="button"
                          variant={field.value === "Feminino" ? "default" : "outline"}
                          className="flex-1"
                          onClick={() => field.onChange("Feminino")}
                        >
                          Feminino
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => {
                  setEditOpen(false);
                  form.reset();
                  setIsEditMode(false);
                }}>Cancelar</AlertDialogCancel>
                <AlertDialogAction disabled={updateTrainingMutation.isPending}>
                  {updateTrainingMutation.isPending && (
                    <LoadingSpinner />
                  )}
                  Atualizar
                </AlertDialogAction>
              </AlertDialogFooter>
            </form>
          </Form>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Training Alert */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Treino</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja excluir este treino? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTraining} disabled={deleteTrainingMutation.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteTrainingMutation.isPending && (
                <LoadingSpinner />
              )}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Trainings;
