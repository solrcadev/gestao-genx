import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, Search, Plus, ArrowUp, ArrowDown, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import { fetchExercises } from '@/services/exerciseService';
import { getTrainingById, updateTrainingExercises } from '@/services/trainingService';

interface EditTrainingExercisesProps {
  trainingId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const EditTrainingExercises = ({ trainingId, onSuccess, onCancel }: EditTrainingExercisesProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar todos os exercícios disponíveis
  const { data: exercises = [], isLoading: isLoadingExercises } = useQuery({
    queryKey: ['exercises'],
    queryFn: fetchExercises
  });

  // Buscar dados do treino existente, incluindo seus exercícios
  const { data: training, isLoading: isLoadingTraining } = useQuery({
    queryKey: ['training', trainingId],
    queryFn: () => getTrainingById(trainingId),
    enabled: !!trainingId
  });

  // Inicializar os exercícios selecionados com os exercícios existentes do treino
  useEffect(() => {
    if (training && training.treinos_exercicios) {
      const existingExercises = training.treinos_exercicios.map(item => ({
        id: item.exercicio.id,
        nome: item.exercicio.nome,
        categoria: item.exercicio.categoria,
        tempo_estimado: item.exercicio.tempo_estimado,
        objetivo: item.exercicio.objetivo,
        ordem: item.ordem,
        observacao: item.observacao || ''
      }));
      
      // Ordenar por ordem
      existingExercises.sort((a, b) => a.ordem - b.ordem);
      
      setSelectedExercises(existingExercises);
      setIsLoading(false);
    }
  }, [training]);

  // Mutação para atualizar os exercícios do treino
  const updateExercisesMutation = useMutation({
    mutationFn: updateTrainingExercises,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training', trainingId] });
      toast({ 
        title: 'Exercícios atualizados com sucesso!',
        description: 'Os exercícios do treino foram atualizados.',
      });
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar exercícios:', error);
      toast({
        title: 'Erro ao atualizar exercícios',
        description: error.message || 'Não foi possível atualizar os exercícios do treino.',
        variant: 'destructive',
      });
    }
  });

  // Filtrar exercícios com base na busca
  const filteredExercises = exercises.filter(exercise => 
    exercise.nome.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Adicionar exercício ao treino
  const addExerciseToTraining = (exercise) => {
    setSelectedExercises(prev => {
      // Verificar se o exercício já está na lista
      const isAlreadySelected = prev.some(e => e.id === exercise.id);
      if (isAlreadySelected) {
        toast({
          title: 'Exercício já adicionado',
          description: 'Este exercício já está na lista.',
          variant: 'destructive',
        });
        return prev;
      }

      // Adicionar o exercício com a próxima ordem
      const newExercise = {
        ...exercise,
        ordem: prev.length + 1,
        observacao: ''
      };
      
      return [...prev, newExercise];
    });
  };

  // Remover exercício do treino
  const removeExerciseFromTraining = (index) => {
    setSelectedExercises(prev => {
      const newList = [...prev];
      newList.splice(index, 1);
      // Reordenar os exercícios restantes
      return newList.map((exercise, idx) => ({
        ...exercise,
        ordem: idx + 1,
      }));
    });
  };

  // Mover exercício para cima ou para baixo
  const moveExercise = (index, direction) => {
    if ((direction === 'up' && index === 0) || 
        (direction === 'down' && index === selectedExercises.length - 1)) {
      return;
    }

    setSelectedExercises(prev => {
      const newList = [...prev];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      
      [newList[index], newList[newIndex]] = [newList[newIndex], newList[index]];
      
      // Atualizar a propriedade ordem
      return newList.map((exercise, idx) => ({
        ...exercise,
        ordem: idx + 1,
      }));
    });
  };

  // Alterar observação do exercício
  const handleObservacaoChange = (index, value) => {
    setSelectedExercises(prev => {
      const newList = [...prev];
      newList[index] = { ...newList[index], observacao: value };
      return newList;
    });
  };

  // Salvar as alterações nos exercícios
  const saveExercises = () => {
    if (selectedExercises.length === 0) {
      toast({
        title: 'Nenhum exercício selecionado',
        description: 'Adicione pelo menos um exercício ao treino.',
        variant: 'destructive',
      });
      return;
    }

    const exercisesData = selectedExercises.map(ex => ({
      exercicio_id: ex.id,
      ordem: ex.ordem,
      observacao: ex.observacao || null
    }));

    updateExercisesMutation.mutate({
      trainingId,
      exercises: exercisesData
    });
  };

  // Calcular tempo total estimado
  const totalTime = selectedExercises.reduce(
    (total, exercise) => total + exercise.tempo_estimado, 0
  );

  if (isLoading || isLoadingTraining) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="animate-fade-in mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Editar Exercícios do Treino</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button 
            variant="default" 
            size="sm"
            onClick={saveExercises}
            disabled={updateExercisesMutation.isPending}
          >
            {updateExercisesMutation.isPending ? <LoadingSpinner size="sm" /> : <Save className="mr-1 h-4 w-4" />}
            Salvar Alterações
          </Button>
        </div>
      </div>
      
      {/* Resumo dos exercícios selecionados */}
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
      
      {/* Detalhes dos exercícios selecionados */}
      <div className="space-y-4 mb-6">
        <h3 className="font-medium text-base">Detalhes dos Exercícios</h3>
        
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
      
      {/* Busca de exercícios */}
      <div className="mb-4">
        <div className="flex items-center border rounded-md px-3 py-2 mb-4">
          <Search className="h-4 w-4 mr-2 text-muted-foreground" />
          <Input
            placeholder="Buscar exercícios para adicionar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>

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
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 text-primary"
                    onClick={() => addExerciseToTraining(exercise)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EditTrainingExercises; 