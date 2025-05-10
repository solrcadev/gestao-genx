import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, MinusCircle, RotateCcw, ArrowLeft, Save, ClipboardCheck, BarChart } from 'lucide-react';
import { registrarAvaliacaoDesempenho } from '@/services/athletes/evaluations';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  FUNDAMENTOS, 
  CONFIG_EVENTOS_QUALIFICADOS, 
  salvarEventoQualificado, 
  EventoQualificado 
} from '@/services/avaliacaoQualitativaService';

// Extended interface to include exercicio_id
interface ExercicioEventoQualificado extends Omit<EventoQualificado, 'atleta_id'> {
  exercicio_id: string;
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
  const [acertos, setAcertos] = useState(0);
  const [erros, setErros] = useState(0);
  const [selectedFundamento, setSelectedFundamento] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avaliacaoTipo, setAvaliacaoTipo] = useState<'quantitativa' | 'qualitativa'>('quantitativa');
  const [observacoes, setObservacoes] = useState('');
  const [eventosRegistrados, setEventosRegistrados] = useState<ExercicioEventoQualificado[]>([]);
  
  const { user, userRole } = useAuth();

  // Reset counters
  const handleReset = () => {
    setAcertos(0);
    setErros(0);
  };

  // Reset qualitative evaluation
  const handleResetQualitative = () => {
    setEventosRegistrados([]);
    setObservacoes('');
  };

  // Função para converter ExercicioEventoQualificado para EventoQualificado
  const adaptToEventoQualificado = (evento: ExercicioEventoQualificado): EventoQualificado => {
    const { exercicio_id, ...rest } = evento;
    return {
      ...rest,
      atleta_id: '', // Campo obrigatório, mas não utilizado neste contexto
    };
  };

  // Handle completion of evaluation
  const handleComplete = async () => {
    if (!selectedFundamento) {
      toast({
        title: "Selecione um fundamento",
        description: "Você precisa selecionar um fundamento para registrar a avaliação.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      if (avaliacaoTipo === 'quantitativa') {
        const evaluationData = {
          exercicio_id: exercise.id,
          treino_id: treinoDoDiaId,
          fundamento: selectedFundamento,
          acertos,
          erros,
          timestamp: new Date().toISOString(),
          precisaAprovacao: isMonitor,
          monitor_id: isMonitor ? user?.id : undefined,
          observacoes: observacoes || undefined
        };

        // Registrar avaliação quantitativa
        await registrarAvaliacaoDesempenho(evaluationData);

        toast({
          title: isMonitor ? "Avaliação enviada para aprovação" : "Avaliação registrada",
          description: isMonitor 
            ? "Um técnico precisa aprovar esta avaliação para que ela seja contabilizada." 
            : "Avaliação registrada com sucesso!",
        });

        onComplete(evaluationData);
      } else {
        // Registrar avaliação qualitativa
        if (eventosRegistrados.length === 0) {
          toast({
            title: "Nenhum evento registrado",
            description: "Você precisa registrar pelo menos um evento qualitativo.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }

        // Salvar todos os eventos qualificados
        const salvosComSucesso = await Promise.all(
          eventosRegistrados.map(evento => salvarEventoQualificado(adaptToEventoQualificado(evento)))
        );

        // Verificar se todos foram salvos com sucesso
        const todosComSucesso = salvosComSucesso.every(id => id !== null);

        toast({
          title: todosComSucesso 
            ? "Avaliação qualitativa registrada" 
            : "Avaliação salva parcialmente",
          description: todosComSucesso
            ? `${eventosRegistrados.length} eventos registrados com sucesso.`
            : "Alguns eventos foram salvos apenas localmente e serão sincronizados quando houver conexão.",
          variant: todosComSucesso ? "default" : "destructive",
        });

        // Criar um resumo dos eventos para passar para o componente de resumo
        const evaluationData = {
          exercicio_id: exercise.id,
          treino_id: treinoDoDiaId,
          fundamento: selectedFundamento,
          eventos_qualitativos: eventosRegistrados.length,
          timestamp: new Date().toISOString(),
          observacoes: observacoes || undefined,
          tipo: 'qualitativa'
        };

        onComplete(evaluationData);
      }
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

  // Registrar evento qualitativo
  const registrarEventoQualitativo = async (tipoEvento: string, peso: number) => {
    if (!selectedFundamento) {
      toast({
        title: "Selecione um fundamento",
        description: "Você precisa selecionar um fundamento primeiro.",
        variant: "destructive",
      });
      return;
    }

    const novoEvento: ExercicioEventoQualificado = {
      exercicio_id: exercise.id,
      treino_id: treinoDoDiaId,
      fundamento: selectedFundamento,
      tipo_evento: tipoEvento,
      peso: peso,
      timestamp: new Date().toISOString(),
      observacoes: ''
    };

    // Adicionar ao estado para mostrar na interface
    setEventosRegistrados(prev => [...prev, novoEvento]);

    toast({
      title: "Evento registrado",
      description: `${tipoEvento} (${peso > 0 ? '+' : ''}${peso}) registrado.`,
      duration: 2000,
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with back button */}
      <div className="flex items-center mb-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-semibold ml-2">
          {exercise?.exercicio?.nome || exercise?.nome || "Avaliação em Tempo Real"}
        </h2>
      </div>

      {/* Fundamento selection */}
      <div className="mb-6">
        <label className="text-sm font-medium block mb-2">Selecione o fundamento:</label>
        <div className="grid grid-cols-2 gap-2">
          {FUNDAMENTOS.map((fundamento) => (
            <Button
              key={fundamento}
              variant={selectedFundamento === fundamento ? "default" : "outline"}
              onClick={() => setSelectedFundamento(fundamento)}
              className="justify-start"
            >
              {fundamento}
            </Button>
          ))}
        </div>
      </div>

      {/* Tipo de avaliação */}
      <Tabs value={avaliacaoTipo} onValueChange={(value) => setAvaliacaoTipo(value as 'quantitativa' | 'qualitativa')} className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="quantitativa">
            <BarChart className="h-4 w-4 mr-2" /> Quantitativa
          </TabsTrigger>
          <TabsTrigger value="qualitativa">
            <ClipboardCheck className="h-4 w-4 mr-2" /> Qualitativa
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quantitativa" className="space-y-6">
          {/* Counter display */}
          <div className="flex flex-row justify-between items-center bg-card p-4 rounded-lg shadow-sm">
            <div className="text-center flex-1">
              <span className="block text-sm font-medium text-muted-foreground mb-1">Acertos</span>
              <span className="text-4xl font-bold text-green-500">{acertos}</span>
            </div>
            <div className="h-12 w-px bg-border mx-2"></div>
            <div className="text-center flex-1">
              <span className="block text-sm font-medium text-muted-foreground mb-1">Erros</span>
              <span className="text-4xl font-bold text-red-500">{erros}</span>
            </div>
            <div className="h-12 w-px bg-border mx-2"></div>
            <div className="text-center flex-1">
              <span className="block text-sm font-medium text-muted-foreground mb-1">Total</span>
              <span className="text-4xl font-bold">{acertos + erros}</span>
            </div>
          </div>

          {/* Counter buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              size="lg" 
              className="h-20 text-green-500 border-green-200 bg-green-50 hover:bg-green-100"
              onClick={() => setAcertos(prev => prev + 1)}
            >
              <PlusCircle className="mr-2 h-6 w-6" />
              <span className="text-lg">Acerto</span>
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="h-20 text-red-500 border-red-200 bg-red-50 hover:bg-red-100"
              onClick={() => setErros(prev => prev + 1)}
            >
              <MinusCircle className="mr-2 h-6 w-6" />
              <span className="text-lg">Erro</span>
            </Button>
          </div>

          <Button variant="outline" onClick={handleReset} className="w-full">
            <RotateCcw className="mr-2 h-4 w-4" />
            Reiniciar contadores
          </Button>
        </TabsContent>

        <TabsContent value="qualitativa" className="space-y-6">
          {selectedFundamento && (
            <>
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-2">
                    {CONFIG_EVENTOS_QUALIFICADOS
                      .find(config => config.fundamento === selectedFundamento)
                      ?.eventos.map(evento => (
                        <Button
                          key={evento.tipo}
                          variant="outline"
                          className={`justify-between ${evento.peso > 0 ? 'text-green-600' : evento.peso < 0 ? 'text-red-600' : ''}`}
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

              {/* Eventos registrados */}
              {eventosRegistrados.length > 0 && (
                <div className="bg-muted/30 p-3 rounded-lg">
                  <h3 className="text-sm font-medium mb-2">Eventos registrados:</h3>
                  <div className="space-y-2 max-h-[150px] overflow-y-auto">
                    {eventosRegistrados.map((evento, index) => (
                      <div key={index} className="flex items-center justify-between bg-card p-2 rounded-md text-sm">
                        <div>
                          <span className="font-medium">{evento.tipo_evento}</span>
                          <span className="text-muted-foreground ml-2 text-xs">
                            {new Date(evento.timestamp).toLocaleTimeString()}
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

              <Button variant="outline" onClick={handleResetQualitative} className="w-full">
                <RotateCcw className="mr-2 h-4 w-4" />
                Limpar eventos
              </Button>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Observações */}
      <div className="mb-6">
        <label className="text-sm font-medium block mb-2">Observações (opcional):</label>
        <Textarea 
          placeholder="Observações sobre a performance..." 
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          className="resize-none"
          rows={3}
        />
      </div>

      {/* Reset and complete buttons */}
      <div className="flex flex-col gap-3 mt-auto">
        <Button onClick={handleComplete} disabled={isSubmitting}>
          <Save className="mr-2 h-4 w-4" />
          {isSubmitting ? "Salvando..." : "Concluir Avaliação"}
        </Button>
        
        {isMonitor && (
          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-700">
              <strong>Nota:</strong> Como monitor, suas avaliações serão enviadas para aprovação por um técnico antes de serem contabilizadas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
