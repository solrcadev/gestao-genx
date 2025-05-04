
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle, Loader2, Timer, UserRound, XCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
} from "@/components/ui/alert-dialog"

interface Athlete {
  id: string;
  nome: string;
  posicao: string;
  time: string;
  foto_url?: string;
}

interface Exercise {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  objetivo: string;
  numero_jogadores: number;
  tempo_estimado: number;
  imagem_url?: string;
  video_url?: string;
}

interface TrainingExercise {
  id: string;
  ordem: number;
  tempo_real: number | null;
  concluido: boolean;
  observacao: string | null;
  exercicio: Exercise;
}

interface Evaluation {
  id?: string;
  treino_do_dia_id: string;
  exercicio_id: string;
  atleta_id: string;
  fundamento: string;
  acertos: number;
  erros: number;
}

interface RealTimeEvaluationProps {
  exercise?: any;
  treinoDoDiaId: string;
  onComplete?: (data: any) => void;
  onBack?: () => void;
  initialData?: any;
}

export const RealTimeEvaluation: React.FC<RealTimeEvaluationProps> = ({ 
  exercise,
  treinoDoDiaId,
  onComplete,
  onBack,
  initialData = {}
}) => {
  const { toast } = useToast();
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<TrainingExercise | null>(null);
  const [evaluationData, setEvaluationData] = useState<Evaluation>({
    treino_do_dia_id: treinoDoDiaId,
    exercicio_id: exercise?.id || '',
    atleta_id: '',
    fundamento: '',
    acertos: 0,
    erros: 0,
  });
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isExerciseCompleted, setIsExerciseCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Fetch athletes
  const { data: athletes, isLoading: isLoadingAthletes } = useQuery({
    queryKey: ['athletes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('athletes')
        .select('id, nome, posicao, time, foto_url')
        .order('nome');
      
      if (error) throw error;
      return data as Athlete[];
    }
  });
  
  // Fetch training exercises
  const { data: trainingExercises, isLoading: isLoadingExercises } = useQuery({
    queryKey: ['training-exercises', treinoDoDiaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('treinos_exercicios')
        .select(`
          id,
          ordem,
          tempo_real,
          concluido,
          observacao,
          exercicio:exercicio_id(id, nome, descricao, categoria, objetivo, numero_jogadores, tempo_estimado, imagem_url, video_url)
        `)
        .eq('treino_id', treinoDoDiaId)
        .order('ordem');
      
      if (error) throw error;
      return data as unknown as TrainingExercise[];
    },
    enabled: !!treinoDoDiaId
  });

  // Initialize with the exercise passed as prop if available
  useEffect(() => {
    if (exercise) {
      setSelectedExercise(exercise);
      setEvaluationData(prev => ({
        ...prev,
        exercicio_id: exercise.id
      }));
    }
    
    // Initialize with data from props if available
    if (initialData && Object.keys(initialData).length > 0) {
      setEvaluationData(prev => ({
        ...prev,
        ...initialData
      }));
    }
  }, [exercise, initialData]);
  
  // Function to start the timer
  const startTimer = () => {
    setIsTimerRunning(true);
    timerRef.current = setInterval(() => {
      setTimeElapsed(prevTime => prevTime + 1);
    }, 1000);
  };
  
  // Function to stop the timer
  const stopTimer = () => {
    setIsTimerRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };
  
  // Function to reset the timer
  const resetTimer = () => {
    stopTimer();
    setTimeElapsed(0);
  };
  
  // Function to toggle the timer
  const toggleTimer = () => {
    if (isTimerRunning) {
      stopTimer();
    } else {
      startTimer();
    }
  };
  
  // Function to format time in HH:MM:SS
  const formatTime = (timeInSeconds: number): string => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = timeInSeconds % 60;
    
    return [hours, minutes, seconds]
      .map(unit => String(unit).padStart(2, '0'))
      .join(':');
  };
  
  // Function to handle athlete selection
  const handleAthleteSelect = (athlete: Athlete) => {
    setSelectedAthlete(athlete);
    setEvaluationData(prev => ({
      ...prev,
      atleta_id: athlete.id
    }));
    
    if (onComplete) {
      onComplete({
        ...evaluationData,
        atleta_id: athlete.id
      });
    }
  };
  
  // Function to handle exercise selection
  const handleExerciseSelect = (exercise: TrainingExercise) => {
    setSelectedExercise(exercise);
    setEvaluationData(prev => ({
      ...prev,
      exercicio_id: exercise.id
    }));
    
    if (onComplete) {
      onComplete({
        ...evaluationData,
        exercicio_id: exercise.id
      });
    }
  };
  
  // Function to handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEvaluationData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (onComplete) {
      onComplete({
        ...evaluationData,
        [name]: value
      });
    }
  };
  
  // Function to handle increment
  const handleIncrement = (field: 'acertos' | 'erros') => {
    setEvaluationData(prev => ({
      ...prev,
      [field]: prev[field] + 1
    }));
    
    if (onComplete) {
      onComplete({
        ...evaluationData,
        [field]: evaluationData[field] + 1
      });
    }
  };
  
  // Function to handle decrement
  const handleDecrement = (field: 'acertos' | 'erros') => {
    setEvaluationData(prev => ({
      ...prev,
      [field]: Math.max(0, prev[field] - 1)
    }));
    
    if (onComplete) {
      onComplete({
        ...evaluationData,
        [field]: Math.max(0, evaluationData[field] - 1)
      });
    }
  };
  
  // Function to handle save evaluation
  const handleSaveEvaluation = async () => {
    setIsSaving(true);
    try {
      // Validate data
      if (!selectedAthlete || !selectedExercise) {
        toast({
          title: "Erro ao salvar avaliação",
          description: "Selecione um atleta e um exercício para salvar a avaliação.",
          variant: "destructive"
        });
        return;
      }
      
      // Call API to save evaluation
      const { data, error } = await supabase
        .from('training_evaluations')
        .insert(evaluationData)
        .select();
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Avaliação salva com sucesso!",
        description: `Avaliação de ${selectedAthlete.nome} para o exercício ${selectedExercise.exercicio.nome} salva.`,
        duration: 3000
      });
      
      // Reset form
      setEvaluationData({
        treino_do_dia_id: treinoDoDiaId,
        exercicio_id: exercise?.id || '',
        atleta_id: '',
        fundamento: '',
        acertos: 0,
        erros: 0,
      });
      setSelectedAthlete(null);
      setSelectedExercise(null);
    } catch (error) {
      console.error("Error saving evaluation:", error);
      toast({
        title: "Erro ao salvar avaliação",
        description: "Ocorreu um erro ao tentar salvar a avaliação. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Function to handle exercise completion
  const handleCompleteExercise = async () => {
    setIsSaving(true);
    try {
      // Stop timer
      stopTimer();
      
      // Call API to mark exercise as complete
      const { data, error } = await supabase
        .from('treinos_exercicios')
        .update({
          concluido: true,
          tempo_real: timeElapsed
        })
        .eq('id', selectedExercise?.id)
        .select();
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Exercício concluído!",
        description: `O exercício ${selectedExercise?.exercicio.nome} foi marcado como concluído.`,
        duration: 3000
      });
      
      setIsExerciseCompleted(true);
    } catch (error) {
      console.error("Error completing exercise:", error);
      toast({
        title: "Erro ao concluir exercício",
        description: "Ocorreu um erro ao tentar concluir o exercício. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Function to handle exercise reset
  const handleResetExercise = async () => {
    setIsResetting(true);
    try {
      // Call API to reset exercise
      const { data, error } = await supabase
        .from('treinos_exercicios')
        .update({
          concluido: false,
          tempo_real: null
        })
        .eq('id', selectedExercise?.id)
        .select();
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Exercício reiniciado!",
        description: `O exercício ${selectedExercise?.exercicio.nome} foi reiniciado.`,
        duration: 3000
      });
      
      setIsExerciseCompleted(false);
      resetTimer();
    } catch (error) {
      console.error("Error resetting exercise:", error);
      toast({
        title: "Erro ao reiniciar exercício",
        description: "Ocorreu um erro ao tentar reiniciar o exercício. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsResetting(false);
    }
  };
  
  // Get name initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Handle back button click
  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left Panel - Athletes and Exercises */}
      <div className="space-y-6">
        {/* Athlete Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Selecione o Atleta</CardTitle>
            <CardDescription>Escolha o atleta para avaliar o exercício.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingAthletes ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : athletes && athletes.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {athletes.map(atleta => (
                  <Button
                    key={atleta.id}
                    variant={selectedAthlete?.id === atleta.id ? "default" : "outline"}
                    className="justify-start"
                    onClick={() => handleAthleteSelect(atleta)}
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className={`${atleta.time === 'Masculino' ? 'bg-blue-600' : 'bg-red-600'} text-white`}>
                        {atleta.foto_url ? (
                          <AvatarImage src={atleta.foto_url} alt={atleta.nome} />
                        ) : (
                          <AvatarFallback>{getInitials(atleta.nome)}</AvatarFallback>
                        )}
                      </Avatar>
                      <span>{atleta.nome}</span>
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhum atleta encontrado.</p>
            )}
          </CardContent>
        </Card>
        
        {/* Exercise Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Selecione o Exercício</CardTitle>
            <CardDescription>Escolha o exercício para avaliar o atleta.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingExercises ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : trainingExercises && trainingExercises.length > 0 ? (
              <div className="space-y-3">
                {trainingExercises.map(exercise => (
                  <Button
                    key={exercise.id}
                    variant={selectedExercise?.id === exercise.id ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => handleExerciseSelect(exercise)}
                    disabled={exercise.concluido}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{exercise.exercicio.nome}</span>
                      {exercise.concluido && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhum exercício encontrado.</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Right Panel - Evaluation Form and Timer */}
      <div className="space-y-6">
        {/* Evaluation Form */}
        <Card>
          <CardHeader>
            <CardTitle>Avaliação em Tempo Real</CardTitle>
            <CardDescription>Registre o desempenho do atleta no exercício.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedAthlete && selectedExercise ? (
              <>
                <div className="flex items-center space-x-4">
                  <Avatar className="h-10 w-10">
                    {selectedAthlete.foto_url ? (
                      <AvatarImage src={selectedAthlete.foto_url} alt={selectedAthlete.nome} />
                    ) : (
                      <AvatarFallback>{selectedAthlete.nome.substring(0, 2).toUpperCase()}</AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedAthlete.nome}</h3>
                    <p className="text-sm text-muted-foreground">{selectedAthlete.posicao}</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <Label htmlFor="fundamento">Fundamento</Label>
                  <Input
                    id="fundamento"
                    name="fundamento"
                    type="text"
                    placeholder="Ex: Saque, Recepção, Ataque"
                    value={evaluationData.fundamento}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="acertos">Acertos</Label>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="icon" onClick={() => handleDecrement('acertos')}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                      <Input
                        id="acertos"
                        name="acertos"
                        type="number"
                        value={evaluationData.acertos.toString()}
                        readOnly
                        className="text-center"
                      />
                      <Button variant="outline" size="icon" onClick={() => handleIncrement('acertos')}>
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="erros">Erros</Label>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="icon" onClick={() => handleDecrement('erros')}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                      <Input
                        id="erros"
                        name="erros"
                        type="number"
                        value={evaluationData.erros.toString()}
                        readOnly
                        className="text-center"
                      />
                      <Button variant="outline" size="icon" onClick={() => handleIncrement('erros')}>
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <Button className="w-full" onClick={handleSaveEvaluation} disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Avaliação
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground">Selecione um atleta e um exercício para começar a avaliação.</p>
            )}
          </CardContent>
        </Card>
        
        {/* Timer and Exercise Completion */}
        <Card>
          <CardHeader>
            <CardTitle>Controle do Exercício</CardTitle>
            <CardDescription>Gerencie o tempo e a conclusão do exercício.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedExercise ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold">{selectedExercise.exercicio.nome}</h3>
                    <p className="text-sm text-muted-foreground">
                      Tempo Estimado: {selectedExercise.exercicio.tempo_estimado} minutos
                    </p>
                  </div>
                  <Timer className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="text-4xl font-bold text-center">
                  {formatTime(timeElapsed)}
                </div>
                <div className="flex space-x-2">
                  <Button className="flex-1" onClick={toggleTimer} disabled={isExerciseCompleted}>
                    {isTimerRunning ? 'Parar' : 'Iniciar'}
                  </Button>
                  {!isExerciseCompleted ? (
                    <Button className="flex-1" variant="secondary" onClick={handleCompleteExercise} disabled={isSaving}>
                      {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Concluir
                    </Button>
                  ) : (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button className="flex-1" variant="destructive" disabled={isResetting}>
                          {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Reiniciar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Reiniciar Exercício</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza de que deseja reiniciar este exercício? O tempo e a conclusão serão resetados.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => {
                            handleResetExercise();
                          }}>Confirmar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">Selecione um exercício para controlar o tempo.</p>
            )}
          </CardContent>
        </Card>
        
        {/* Back Button */}
        {onBack && (
          <Button variant="outline" onClick={handleBack} className="w-full">
            Voltar
          </Button>
        )}
      </div>
    </div>
  );
};

export default RealTimeEvaluation;
