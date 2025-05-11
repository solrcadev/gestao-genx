import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  RotateCcw, 
  ArrowLeft, 
  Save, 
  CheckCircle,
  AlertCircle,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { 
  salvarEventoQualificado, 
  obterDetalhesDoTreinoAtual
} from '@/services/avaliacaoQualitativaService';
import { fetchPresencasAtletas } from '@/services/treinosDoDiaService';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; 
import { 
  FUNDAMENTOS, 
  CONFIG_EVENTOS_QUALIFICADOS
} from '@/services/avaliacaoQualitativaService';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { supabase } from '@/lib/supabase';

// Interface for athletes present in the training
interface AtletaPresente {
  id: string;
  nome: string;
  posicao: string;
  time: string;
  foto_url?: string | null;
}

// Interface for qualitative evaluation events
interface EventoAvaliacao {
  atleta_id: string;
  treino_id: string;
  exercicio_id?: string;
  fundamento: string;
  tipo_evento: string;
  peso: number;
  timestamp: string;
  observacoes?: string;
}

export interface RealTimeEvaluationProps {
  exercise: any;
  treinoDoDiaId: string;
  onBack: () => void;
  onComplete: (data: any) => void;
  isMonitor?: boolean;
}

export default function RealTimeEvaluation({ 
  exercise, 
  treinoDoDiaId, 
  onBack, 
  onComplete,
  isMonitor = false
}: RealTimeEvaluationProps) {
  const [atletaAtivoId, setAtletaAtivoId] = useState<string | null>(null);
  const [fundamentoAtivo, setFundamentoAtivo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [observacaoAtual, setObservacaoAtual] = useState('');
  const [eventosTemporariosAtletaAtivo, setEventosTemporariosAtletaAtivo] = useState<EventoAvaliacao[]>([]);
  const [atletasPresentes, setAtletasPresentes] = useState<AtletaPresente[]>([]);
  const [isLoadingAtletas, setIsLoadingAtletas] = useState(true);
  const [avaliacoesSalvas, setAvaliacoesSalvas] = useState<{atletaId: string, nome: string, timestamp: string}[]>([]);
  const [treinoValido, setTreinoValido] = useState<{
    treino_id: string;
    nome_treino: string;
    existe: boolean;
  } | null>(null);
  const [exercicioValido, setExercicioValido] = useState<boolean | null>(null);
  
  const { user, userRole } = useAuth();

  // Validate the treino_id and get the real treino information
  useEffect(() => {
    const validarTreino = async () => {
      try {
        if (!treinoDoDiaId) {
          console.error("Nenhum treinoDoDiaId fornecido");
          toast({
            title: "Erro",
            description: "Nenhum treino foi identificado. Por favor, recarregue a página.",
            variant: "destructive"
          });
          return;
        }
        
        console.log("Validando treinoDoDiaId:", treinoDoDiaId);
        
        // First check if exercise has a treino_id
        if (exercise?.treino_id) {
          console.log("Exercício possui treino_id:", exercise.treino_id);
          const detalhes = await obterDetalhesDoTreinoAtual(exercise.treino_id);
          setTreinoValido(detalhes);
          
          if (!detalhes.existe) {
            console.error("treino_id do exercício é inválido:", exercise.treino_id);
            // Try with treinoDoDiaId as fallback
            const detalhesFallback = await obterDetalhesDoTreinoAtual(treinoDoDiaId);
            setTreinoValido(detalhesFallback);
            
            if (!detalhesFallback.existe) {
              toast({
                title: "Aviso",
                description: "O treino não foi identificado corretamente. As avaliações serão salvas localmente.",
                variant: "destructive"
              });
            }
          }
        } else {
          // Use treinoDoDiaId
          console.log("Usando treinoDoDiaId para validação:", treinoDoDiaId);
          const detalhes = await obterDetalhesDoTreinoAtual(treinoDoDiaId);
          setTreinoValido(detalhes);
          
          if (!detalhes.existe) {
            toast({
              title: "Aviso",
              description: "O treino não foi identificado corretamente. As avaliações serão salvas localmente.",
              variant: "destructive"
            });
          }
        }
      } catch (error) {
        console.error("Erro ao validar treino:", error);
      }
    };
    
    validarTreino();
  }, [treinoDoDiaId, exercise]);

  // Validate if the exercicio_id exists before using it
  useEffect(() => {
    const validarExercicio = async () => {
      if (!exercise || !exercise.id) {
        console.log("Nenhum exercício para validar");
        setExercicioValido(null);
        return;
      }
      
      try {
        console.log("Validando exercicio_id:", exercise.id);
        
        const { data, error } = await supabase
          .from('exercicios')
          .select('id')
          .eq('id', exercise.id)
          .single();
          
        if (error) {
          console.error("Erro ao validar exercício:", error);
          setExercicioValido(false);
          
          toast({
            title: "Aviso sobre o exercício",
            description: "O exercício não foi encontrado no banco de dados. A avaliação continuará sem vincular ao exercício.",
            variant: "destructive",
            duration: 4000
          });
        } else {
          console.log("Exercício validado com sucesso:", data);
          setExercicioValido(true);
        }
      } catch (error) {
        console.error("Exceção ao validar exercício:", error);
        setExercicioValido(false);
      }
    };
    
    validarExercicio();
  }, [exercise]);

  // Fetch athletes present in this training session
  useEffect(() => {
    const loadAtletas = async () => {
      try {
        setIsLoadingAtletas(true);
        const presencas = await fetchPresencasAtletas(treinoDoDiaId);
        
        // Filter only present athletes
        const atletasPresentes = presencas
          .filter(p => p.presente)
          .map(p => ({
            id: p.atleta_id,
            nome: p.atleta.nome,
            posicao: p.atleta.posicao,
            time: p.atleta.time,
            foto_url: p.atleta.foto_url
          }));
        
        setAtletasPresentes(atletasPresentes);
      } catch (error) {
        console.error("Error loading athletes:", error);
        toast({
          title: "Erro ao carregar atletas",
          description: "Não foi possível carregar a lista de atletas presentes",
          variant: "destructive"
        });
      } finally {
        setIsLoadingAtletas(false);
      }
    };

    loadAtletas();
  }, [treinoDoDiaId]);

  // Handle athlete change - clear events when changing athlete to ensure isolation
  const handleAtletaChange = (atletaId: string) => {
    // Clear events when changing athlete (simple approach for now)
    if (eventosTemporariosAtletaAtivo.length > 0) {
      setEventosTemporariosAtletaAtivo([]);
      setObservacaoAtual('');
    }
    
    setAtletaAtivoId(atletaId);
    // We keep the active fundamento when changing athlete for a faster workflow
  };

  // Reset qualitative evaluation for current athlete
  const handleResetQualitative = () => {
    setEventosTemporariosAtletaAtivo([]);
    setObservacaoAtual('');
  };

  // Handle completion of evaluation for current athlete
  const handleComplete = async () => {
    if (!atletaAtivoId) {
      toast({
        title: "Selecione um atleta",
        description: "Você precisa selecionar um atleta para registrar a avaliação.",
        variant: "destructive",
      });
      return;
    }

    if (!fundamentoAtivo) {
      toast({
        title: "Selecione um fundamento",
        description: "Você precisa selecionar um fundamento para registrar a avaliação.",
        variant: "destructive",
      });
      return;
    }

    if (eventosTemporariosAtletaAtivo.length === 0) {
      toast({
        title: "Nenhum evento registrado",
        description: "Você precisa registrar pelo menos um evento qualitativo.",
        variant: "destructive",
      });
      return;
    }

    // Validação do treino_id
    console.log("RealTimeEvaluation: Verificando treino_id antes do salvamento");
    console.log("treinoDoDiaId:", treinoDoDiaId);
    console.log("exercise:", exercise);
    console.log("treinoValido:", treinoValido);
    console.log("exercicioValido:", exercicioValido);
    
    if (!treinoValido?.treino_id) {
      toast({
        title: "Erro de identificação do treino",
        description: "Não foi possível identificar o treino atual. A avaliação será salva localmente.",
        variant: "destructive",
      });
      // Continue anyway, the service will handle local storage
    }

    try {
      setIsSubmitting(true);

      // Recuperar o treino_id correto do estado validado
      const treino_id = treinoValido?.treino_id || exercise?.treino_id || treinoDoDiaId;
      
      // Usar exercicio_id apenas se o exercício for válido
      const exercicio_id = exercicioValido === true ? exercise?.id : undefined;
      
      console.log("RealTimeEvaluation: treino_id a ser enviado:", treino_id);
      console.log("RealTimeEvaluation: exercicio_id a ser enviado:", exercicio_id);
      console.log("RealTimeEvaluation: detalhes do exercício:", {
        id: exercise?.id,
        treino_id: exercise?.treino_id,
        treinoDoDiaId,
        treinoValidado: treinoValido,
        exercicioValidado: exercicioValido
      });

      // Update all events with observacoes if provided
      const eventosComObservacoes = eventosTemporariosAtletaAtivo.map(evento => ({
        ...evento,
        treino_id: treino_id, // Garantir que estamos usando o treino_id correto
        exercicio_id: exercicio_id, // Usar exercicio_id apenas se for válido
        observacoes: observacaoAtual || undefined
      }));

      console.log("RealTimeEvaluation: Eventos a serem salvos:", eventosComObservacoes);

      // Save all qualitative events
      const salvosComSucesso = await Promise.all(
        eventosComObservacoes.map(evento => salvarEventoQualificado(evento))
      );

      // Check if all events were saved successfully
      const todosComSucesso = salvosComSucesso.every(id => id !== null);

      toast({
        title: todosComSucesso 
          ? "Avaliação registrada" 
          : "Avaliação salva parcialmente",
        description: todosComSucesso
          ? `${eventosTemporariosAtletaAtivo.length} eventos registrados com sucesso.`
          : "Alguns eventos foram salvos apenas localmente e serão sincronizados quando houver conexão.",
        variant: todosComSucesso ? "default" : "destructive",
      });

      // Create a summary of events to pass to the summary component
      const evaluationData = {
        exercicio_id: exercicio_id,
        treino_id: treino_id,
        atleta_id: atletaAtivoId,
        fundamento: fundamentoAtivo,
        eventos_qualitativos: eventosTemporariosAtletaAtivo.length,
        timestamp: new Date().toISOString(),
        observacoes: observacaoAtual || undefined,
        tipo: 'qualitativa' as const
      };

      // Add to saved evaluations list for visual feedback
      const atletaAvaliado = getAtletaById(atletaAtivoId);
      if (atletaAvaliado) {
        setAvaliacoesSalvas(prev => [...prev, {
          atletaId: atletaAtivoId,
          nome: atletaAvaliado.nome,
          timestamp: new Date().toISOString()
        }]);
      }

      // Clear current evaluation state to prepare for next athlete
      setEventosTemporariosAtletaAtivo([]);
      setObservacaoAtual('');
      // Keeping the fundamento active for efficiency when evaluating multiple athletes on the same skill

      onComplete(evaluationData);
    } catch (error) {
      console.error("Error completing evaluation:", error);
      toast({
        title: "Erro ao registrar avaliação",
        description: "Ocorreu um erro ao salvar a avaliação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Register qualitative evaluation event
  const registrarEventoQualitativo = (tipoEvento: string, peso: number) => {
    if (!atletaAtivoId) {
      toast({
        title: "Selecione um atleta",
        description: "Você precisa selecionar um atleta primeiro.",
        variant: "destructive",
      });
      return;
    }

    if (!fundamentoAtivo) {
      toast({
        title: "Selecione um fundamento",
        description: "Você precisa selecionar um fundamento primeiro.",
        variant: "destructive",
      });
      return;
    }

    const novoEvento: EventoAvaliacao = {
      atleta_id: atletaAtivoId,
      treino_id: treinoDoDiaId,
      exercicio_id: exercise.id,
      fundamento: fundamentoAtivo,
      tipo_evento: tipoEvento,
      peso: peso,
      timestamp: new Date().toISOString()
    };

    // Add to state for display in interface
    setEventosTemporariosAtletaAtivo(prev => [...prev, novoEvento]);

    toast({
      title: "Evento registrado",
      description: `${tipoEvento} (${peso > 0 ? '+' : ''}${peso}) registrado.`,
      duration: 1500,
    });
  };

  // Get athlete by ID
  const getAtletaById = (id: string) => {
    return atletasPresentes.find(a => a.id === id);
  };

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header with Exercise Context and Back Button */}
      <div className="bg-primary/5 border-b p-3 mb-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={onBack} className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="font-semibold">
                {exercise?.exercicio?.nome || exercise?.nome || "Avaliação Qualitativa"}
              </h2>
              <p className="text-xs text-muted-foreground">
                Treino: {treinoValido?.nome_treino || "Carregando treino..."} | {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Display warnings if treino or exercicio are not valid */}
      {(treinoValido !== null && !treinoValido.existe) || exercicioValido === false ? (
        <Alert variant="destructive" className="mx-2 mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {!treinoValido?.existe && exercicioValido === false 
              ? "Treino e exercício não identificados corretamente. As avaliações serão salvas localmente."
              : !treinoValido?.existe 
                ? "Treino não identificado corretamente. As avaliações serão salvas localmente."
                : "Exercício não identificado corretamente. As avaliações serão salvas sem vínculo com exercício."}
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Horizontal athlete selection */}
      <div className="mb-4">
        <label className="text-sm font-medium block mb-2 px-2">
          Selecione o Atleta:
          <span className="text-red-500 ml-1">*</span>
        </label>
        
        {isLoadingAtletas ? (
          <div className="flex items-center space-x-2 p-4">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            <p className="text-sm text-muted-foreground">Carregando atletas...</p>
          </div>
        ) : atletasPresentes.length > 0 ? (
          <ScrollArea className="w-full pb-4">
            <div className="flex space-x-2 px-2">
              {atletasPresentes.map((atleta) => (
                <Button
                  key={atleta.id}
                  variant={atletaAtivoId === atleta.id ? "default" : "outline"}
                  className={`flex-col h-auto py-2 px-3 min-w-[100px] max-w-[120px] ${
                    atletaAtivoId === atleta.id 
                      ? "border-2 border-primary" 
                      : ""
                  }`}
                  onClick={() => handleAtletaChange(atleta.id)}
                >
                  <Avatar className={`h-12 w-12 mb-1 ${atletaAtivoId === atleta.id ? "ring-2 ring-primary-foreground" : ""}`}>
                    {atleta.foto_url ? (
                      <AvatarImage src={atleta.foto_url} alt={atleta.nome} />
                    ) : (
                      <AvatarFallback>{getInitials(atleta.nome)}</AvatarFallback>
                    )}
                  </Avatar>
                  <span className="text-xs font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                    {atleta.nome}
                  </span>
                </Button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        ) : (
          <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-md mx-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <p className="text-sm text-yellow-700">
                Não há atletas presentes neste treino ou ocorreu um erro ao carregar a lista.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Current Active Athlete Display - Shows prominently which athlete is being evaluated */}
      {atletaAtivoId && (
        <div className="bg-primary/10 rounded-lg p-3 mb-4 border border-primary/30 mx-2">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-primary">
              {getAtletaById(atletaAtivoId)?.foto_url ? (
                <AvatarImage src={getAtletaById(atletaAtivoId)?.foto_url || ''} alt={getAtletaById(atletaAtivoId)?.nome || ''} />
              ) : (
                <AvatarFallback>{getInitials(getAtletaById(atletaAtivoId)?.nome || '')}</AvatarFallback>
              )}
            </Avatar>
            <div>
              <h3 className="font-semibold text-primary">{getAtletaById(atletaAtivoId)?.nome}</h3>
              <p className="text-xs text-muted-foreground">Atleta ativo para avaliação</p>
            </div>
          </div>
        </div>
      )}

      {/* Fundamento selection - Only shown when an athlete is selected */}
      {atletaAtivoId && (
        <div className="mb-4 px-2">
          <label className="text-sm font-medium block mb-2">
            Fundamento:
            <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {FUNDAMENTOS.map((fundamento) => (
              <Button
                key={fundamento}
                variant={fundamentoAtivo === fundamento ? "default" : "outline"}
                onClick={() => setFundamentoAtivo(fundamento)}
                className="justify-start"
              >
                {fundamento}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Qualitative evaluation buttons - Only shown when both athlete and fundamento are selected */}
      {fundamentoAtivo && atletaAtivoId && (
        <Card className="mb-4 mx-2">
          <CardContent className="pt-6">
            <h3 className="text-sm font-medium mb-3 flex items-center justify-between">
              <span>Avaliação: {fundamentoAtivo}</span>
              {eventosTemporariosAtletaAtivo.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleResetQualitative}
                  className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Limpar eventos
                </Button>
              )}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {CONFIG_EVENTOS_QUALIFICADOS
                .find(config => config.fundamento === fundamentoAtivo)
                ?.eventos.map(evento => (
                  <Button
                    key={evento.tipo}
                    variant="outline"
                    className={`justify-between h-auto py-2 ${evento.peso > 0 ? 'text-green-600 hover:text-green-700' : evento.peso < 0 ? 'text-red-600 hover:text-red-700' : ''}`}
                    onClick={() => registrarEventoQualitativo(evento.tipo, evento.peso)}
                  >
                    <span>{evento.tipo}</span>
                    <Badge variant={evento.peso > 0 ? 'default' : 'destructive'} className="ml-2">
                      {evento.peso > 0 ? `+${evento.peso}` : evento.peso}
                    </Badge>
                  </Button>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Eventos registrados para o atleta ativo */}
      {atletaAtivoId && eventosTemporariosAtletaAtivo.length > 0 && (
        <div className="bg-muted/30 p-3 rounded-lg mb-4 mx-2">
          <h3 className="text-sm font-medium mb-2">Eventos registrados ({eventosTemporariosAtletaAtivo.length}):</h3>
          <div className="space-y-2 max-h-[150px] overflow-y-auto">
            {eventosTemporariosAtletaAtivo.map((evento, index) => (
              <div key={index} className="flex items-center justify-between bg-card p-2 rounded-md text-sm">
                <div>
                  <span className="font-medium">{evento.tipo_evento}</span>
                  <span className="text-muted-foreground ml-2 text-xs">
                    {new Date(evento.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                  </span>
                </div>
                <Badge variant={evento.peso > 0 ? 'default' : 'destructive'}>
                  {evento.peso > 0 ? `+${evento.peso}` : evento.peso}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Observações - Vinculadas ao atleta ativo */}
      {atletaAtivoId && (
        <div className="mb-4 mx-2">
          <label className="text-sm font-medium block mb-2">Observações (opcional):</label>
          <Textarea 
            placeholder="Observações sobre a performance do atleta..." 
            value={observacaoAtual}
            onChange={(e) => setObservacaoAtual(e.target.value)}
            className="resize-none"
            rows={3}
          />
        </div>
      )}

      {/* Concluir button - Salva avaliações do atleta atual */}
      {atletaAtivoId && (
        <div className="sticky bottom-0 left-0 right-0 bg-background p-2 border-t">
          <Button 
            onClick={handleComplete} 
            disabled={isSubmitting || !fundamentoAtivo || eventosTemporariosAtletaAtivo.length === 0}
            className="bg-green-600 hover:bg-green-700 w-full"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting 
              ? "Salvando..." 
              : `Concluir Avaliação ${getAtletaById(atletaAtivoId)?.nome.split(' ')[0] || 'Atleta'}`}
          </Button>
        </div>
      )}

      {/* Avaliações já salvas nesta sessão - Feedback visual */}
      {avaliacoesSalvas.length > 0 && (
        <div className="mt-4 bg-green-50 border border-green-100 rounded-lg p-4 mx-2 mb-20">
          <h3 className="text-sm font-medium text-green-800 flex items-center mb-2">
            <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
            Avaliações já salvas nesta sessão
          </h3>
          <div className="space-y-2 max-h-[150px] overflow-y-auto">
            {avaliacoesSalvas.map((avaliacao, index) => (
              <div key={index} className="flex items-center justify-between bg-white p-2 rounded-md text-sm">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    {getAtletaById(avaliacao.atletaId)?.foto_url ? (
                      <AvatarImage src={getAtletaById(avaliacao.atletaId)?.foto_url || ''} alt={avaliacao.nome} />
                    ) : (
                      <AvatarFallback>{getInitials(avaliacao.nome)}</AvatarFallback>
                    )}
                  </Avatar>
                  <span className="font-medium">{avaliacao.nome}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(avaliacao.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
