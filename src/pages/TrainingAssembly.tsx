import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, MapPin, ArrowLeft, ArrowDown, ArrowUp, Trash2, Plus, ChevronRight, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { fetchExercises } from '@/services/exerciseService';
import { createTraining, addExercisesToTraining } from '@/services/trainingService';

const formSchema = z.object({
  nome: z.string().min(3, { message: 'Nome deve ter pelo menos 3 caracteres' }),
  local: z.string().min(2, { message: 'Informe o local do treino' }),
  data: z.date({ required_error: 'Selecione uma data para o treino' }),
  descricao: z.string().optional(),
});

const TrainingAssembly = () => {
  const [step, setStep] = useState(1);
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [trainingData, setTrainingData] = useState(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // React Hook Form setup
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      local: '',
      descricao: '',
    },
  });
  
  // Fetch exercises
  const { data: exercises = [], isLoading: isLoadingExercises } = useQuery({
    queryKey: ['exercises'],
    queryFn: fetchExercises,
  });

  // Create training mutation
  const createTrainingMutation = useMutation({
    mutationFn: createTraining,
    onSuccess: (data) => {
      setTrainingData(data);
      toast({ 
        title: 'Treino criado com sucesso!',
        description: 'Agora vamos adicionar os exercícios.',
      });
      setStep(2);
    },
    onError: (error) => {
      console.error('Error creating training:', error);
      toast({
        title: 'Erro ao criar treino',
        description: 'Não foi possível criar o treino. Tente novamente.',
        variant: 'destructive',
      });
    }
  });

  // Add exercises to training mutation
  const addExercisesMutation = useMutation({
    mutationFn: addExercisesToTraining,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      toast({ 
        title: 'Treino montado com sucesso!',
        description: 'Todos os exercícios foram adicionados ao treino.',
      });
      navigate('/treinos');
    },
    onError: (error) => {
      console.error('Error adding exercises to training:', error);
      toast({
        title: 'Erro ao adicionar exercícios',
        description: 'Não foi possível adicionar os exercícios ao treino. Tente novamente.',
        variant: 'destructive',
      });
    }
  });

  // Filter exercises based on search
  const filteredExercises = exercises.filter(exercise => 
    exercise.nome.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Step 1: Create training info
  const onSubmitTrainingInfo = (values: z.infer<typeof formSchema>) => {
    // Ensure that all required fields from TrainingInput are included
    createTrainingMutation.mutate({
      nome: values.nome,
      local: values.local,
      data: values.data,
      descricao: values.descricao || ''
    });
  };

  const addExerciseToTraining = (exercise) => {
    setSelectedExercises(prev => [...prev, { 
      ...exercise, 
      ordem: prev.length + 1,
      observacao: '' 
    }]);
    
    toast({ 
      title: 'Exercício adicionado',
      description: `${exercise.nome} adicionado ao treino.`,
    });
  };

  const removeExerciseFromTraining = (index) => {
    setSelectedExercises(prev => {
      const newList = [...prev];
      newList.splice(index, 1);
      // Reorder remaining exercises
      return newList.map((exercise, idx) => ({
        ...exercise,
        ordem: idx + 1,
      }));
    });
  };

  const moveExercise = (index, direction) => {
    if ((direction === 'up' && index === 0) || 
        (direction === 'down' && index === selectedExercises.length - 1)) {
      return;
    }

    setSelectedExercises(prev => {
      const newList = [...prev];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      
      [newList[index], newList[newIndex]] = [newList[newIndex], newList[index]];
      
      // Update ordem property
      return newList.map((exercise, idx) => ({
        ...exercise,
        ordem: idx + 1,
      }));
    });
  };

  const handleObservacaoChange = (index, value) => {
    setSelectedExercises(prev => {
      const newList = [...prev];
      newList[index] = { ...newList[index], observacao: value };
      return newList;
    });
  };

  // Step 3: Finalize training
  const finalizeTraining = () => {
    if (selectedExercises.length === 0) {
      toast({
        title: 'Nenhum exercício selecionado',
        description: 'Adicione pelo menos um exercício ao treino.',
        variant: 'destructive',
      });
      return;
    }

    setStep(3);
  };

  // Submit complete training
  const submitTraining = () => {
    if (!trainingData || selectedExercises.length === 0) return;

    const exercisesData = selectedExercises.map(ex => ({
      exercicio_id: ex.id,
      ordem: ex.ordem,
      observacao: ex.observacao || null
    }));

    addExercisesMutation.mutate({
      trainingId: trainingData.id,
      exercises: exercisesData
    });
  };

  // Calculate total estimated time
  const totalTime = selectedExercises.reduce(
    (total, exercise) => total + exercise.tempo_estimado, 0
  );

  // Render based on current step
  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="animate-fade-in">
            <h2 className="text-xl font-semibold mb-4">Informações do Treino</h2>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitTrainingInfo)} className="space-y-4">
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
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
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

                <Button 
                  type="submit" 
                  className="w-full mt-6"
                  disabled={createTrainingMutation.isPending}
                >
                  {createTrainingMutation.isPending && (
                    <LoadingSpinner className="mr-2" />
                  )}
                  Continuar para Seleção de Exercícios
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </Form>
          </div>
        );

      case 2:
        return (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Seleção de Exercícios</h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setStep(1)}
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Voltar
              </Button>
            </div>
            
            {/* Selected exercises summary */}
            <div className="mb-6 p-4 border rounded-lg bg-muted/30">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Exercícios Selecionados ({selectedExercises.length})</h3>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>Total: {totalTime} min</span>
                </div>
              </div>
              
              {selectedExercises.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  Nenhum exercício selecionado. Adicione exercícios abaixo.
                </p>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {selectedExercises.map((exercise, index) => (
                    <div 
                      key={`${exercise.id}-${index}`} 
                      className="flex items-center justify-between bg-background border rounded-md p-2 text-sm animate-fade-in"
                    >
                      <div className="flex items-center">
                        <div className="font-medium w-5 text-center mr-2">{index + 1}.</div>
                        <div>{exercise.nome}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => moveExercise(index, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => moveExercise(index, 'down')}
                          disabled={index === selectedExercises.length - 1}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => removeExerciseFromTraining(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Search for exercises */}
            <div className="mb-4">
              <Input
                placeholder="Buscar exercícios..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mb-4"
              />

              {isLoadingExercises ? (
                <div className="flex justify-center py-10">
                  <LoadingSpinner />
                </div>
              ) : (
                <div className="grid gap-4 grid-cols-1">
                  {filteredExercises.map(exercise => (
                    <div 
                      key={exercise.id}
                      className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-base">{exercise.nome}</h3>
                          <span className="inline-block px-2 py-0.5 bg-primary/20 rounded-full text-xs mt-1 mb-2">
                            {exercise.categoria}
                          </span>
                          <p className="text-sm text-muted-foreground line-clamp-2">{exercise.objetivo}</p>
                          <div className="flex text-xs text-muted-foreground gap-3 mt-2">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{exercise.tempo_estimado} min</span>
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex items-center gap-1"
                          onClick={() => addExerciseToTraining(exercise)}
                          disabled={selectedExercises.some(e => e.id === exercise.id)}
                        >
                          <Plus className="h-4 w-4" />
                          {selectedExercises.some(e => e.id === exercise.id) 
                            ? 'Adicionado' 
                            : 'Adicionar'}
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {filteredExercises.length === 0 && (
                    <div className="text-center py-10">
                      <p className="text-muted-foreground">
                        Nenhum exercício encontrado com "{searchQuery}".
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="sticky bottom-16 bg-background pt-4 pb-2">
              <Button 
                onClick={finalizeTraining} 
                className="w-full mt-2"
                disabled={selectedExercises.length === 0}
              >
                Continuar para Resumo
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Resumo do Treino</h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setStep(2)}
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Voltar
              </Button>
            </div>
            
            {/* Training details */}
            <div className="border rounded-lg p-4 mb-6 bg-muted/20">
              <h3 className="font-medium text-lg mb-2">{trainingData?.nome}</h3>
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex items-center">
                  <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(trainingData?.data), 'PPP', { locale: ptBR })}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{trainingData?.local}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Tempo total estimado: {totalTime} minutos</span>
                </div>
              </div>
              {trainingData?.descricao && (
                <p className="text-sm mt-2 text-muted-foreground border-t pt-2">
                  {trainingData.descricao}
                </p>
              )}
            </div>

            {/* Exercises list with observations */}
            <div className="space-y-4 mb-6">
              <h3 className="font-medium text-base">Exercícios ({selectedExercises.length})</h3>
              
              {selectedExercises.map((exercise, index) => (
                <div 
                  key={`${exercise.id}-${index}`}
                  className="border rounded-lg p-4 bg-card animate-fade-in"
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/20 rounded-full w-6 h-6 flex items-center justify-center shrink-0">
                      <span className="text-sm font-medium">{index + 1}</span>
                    </div>
                    <div className="w-full">
                      <h4 className="font-medium">{exercise.nome}</h4>
                      <div className="flex flex-wrap gap-2 mt-1 mb-2">
                        <span className="inline-block px-2 py-0.5 bg-primary/20 rounded-full text-xs">
                          {exercise.categoria}
                        </span>
                        <span className="inline-block px-2 py-0.5 bg-muted rounded-full text-xs flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {exercise.tempo_estimado} min
                        </span>
                      </div>
                      <Textarea
                        placeholder="Observações para este exercício..."
                        value={exercise.observacao || ''}
                        onChange={(e) => handleObservacaoChange(index, e.target.value)}
                        className="text-sm mt-2 resize-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="sticky bottom-16 bg-background pt-4 pb-2">
              <Button 
                onClick={submitTraining}
                className="w-full"
                disabled={addExercisesMutation.isPending}
              >
                {addExercisesMutation.isPending && (
                  <LoadingSpinner className="mr-2" />
                )}
                <Save className="mr-2 h-4 w-4" />
                Salvar Treino
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="mobile-container pb-16">
      <h1 className="text-2xl font-bold mb-6">Montagem de Treino</h1>
      {renderStep()}
    </div>
  );
};

export default TrainingAssembly;
