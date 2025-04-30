import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X, Info, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetchPresencasAtletas } from "@/services/treinosDoDiaService";
import { cn } from "@/lib/utils";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { 
  CONFIG_EVENTOS_QUALIFICADOS,
  EventoQualificado,
  salvarEventoQualificado,
  buscarEventosQualificados
} from "@/services/avaliacaoQualitativaService";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useGetAthleteAttendance } from '@/hooks/attendance-hooks';

interface RealTimeEvaluationProps {
  exercise: any;
  treinoDoDiaId: string;
  initialData?: any;
  onBack: () => void;
  onComplete: (results: any) => void;
}

// Fundamentos predefinidos (poderia vir do banco de dados)
const DEFAULT_FUNDAMENTOS = ["Saque", "Recepção", "Levantamento", "Ataque", "Bloqueio", "Defesa"];

export const RealTimeEvaluation = ({ 
  exercise, 
  treinoDoDiaId,
  initialData = {},
  onBack,
  onComplete
}: RealTimeEvaluationProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [fundamentos, setFundamentos] = useState<string[]>(DEFAULT_FUNDAMENTOS);
  const [activeFundamento, setActiveFundamento] = useState<string>("ataque");
  const [observacoes, setObservacoes] = useState<string>("");
  const [selectedAtleta, setSelectedAtleta] = useState<string | null>(null);
  
  const { toast } = useToast();

  // Fetch athletes with attendance status
  const { data: athletesWithAttendance = [], isLoading: isLoadingAthletes } = useQuery({
    queryKey: ["athletes-attendance", treinoDoDiaId],
    queryFn: () => fetchPresencasAtletas(treinoDoDiaId),
  });

  // Configuração de fundamentos e suas opções qualitativas
  const configFundamento = CONFIG_EVENTOS_QUALIFICADOS.find(
    (config) => config.fundamento.toLowerCase() === activeFundamento.toLowerCase()
  );

  // Obter todos os fundamentos disponíveis do sistema de avaliação qualitativa
  const fundamentosQualitativos = Array.from(
    new Set([
      ...exercise.exercicio?.fundamentos || ["ataque"],
      ...CONFIG_EVENTOS_QUALIFICADOS.map(config => config.fundamento.toLowerCase())
    ])
  );

  // Filter and sort athletes
  const filteredAthletes = athletesWithAttendance
    .filter(a => a.presente && a.atleta.nome.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => a.atleta.nome.localeCompare(b.atleta.nome));
    
  if (isLoadingAthletes) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <LoadingSpinner />
        <p className="mt-4 text-muted-foreground">Carregando atletas...</p>
      </div>
    );
  }

  // Busca eventos qualificados registrados para este treino
  const { data: eventosQualificados = [], isLoading: isLoadingEventos } = useQuery({
    queryKey: ['eventos-qualificados', treinoDoDiaId],
    queryFn: async () => {
      const eventos = await buscarEventosQualificados({
        treino_id: treinoDoDiaId
      });
      return eventos;
    },
    enabled: !!treinoDoDiaId
  });
  
  // Processa os eventos qualificados para exibição por atleta e fundamento
  const eventosPorAtleta = React.useMemo(() => {
    const result: Record<string, Record<string, { 
      total: number, 
      positivos: number, 
      negativos: number, 
      mediaPeso: number 
    }>> = {};
    
    eventosQualificados.forEach(evento => {
      if (!evento.atleta_id || !evento.fundamento) return;
      
      if (!result[evento.atleta_id]) {
        result[evento.atleta_id] = {};
      }
      
      if (!result[evento.atleta_id][evento.fundamento]) {
        result[evento.atleta_id][evento.fundamento] = {
          total: 0,
          positivos: 0,
          negativos: 0,
          mediaPeso: 0
        };
      }
      
      const dados = result[evento.atleta_id][evento.fundamento];
      dados.total += 1;
      if (evento.peso > 0) {
        dados.positivos += 1;
      } else if (evento.peso < 0) {
        dados.negativos += 1;
      }
      
      // Recalcula a média de peso
      const novaSoma = (dados.mediaPeso * (dados.total - 1)) + evento.peso;
      dados.mediaPeso = novaSoma / dados.total;
    });
    
    return result;
  }, [eventosQualificados]);

  // Função para registrar evento qualificado
  const registrarEventoQualificado = async (atletaId: string, tipoEvento: string, peso: number) => {
    if (!atletaId || !activeFundamento || !tipoEvento) {
      toast({
        title: "Erro",
        description: "Dados incompletos para registrar avaliação",
        variant: "destructive"
      });
      return;
    }

    const evento: EventoQualificado = {
      atleta_id: atletaId,
      treino_id: treinoDoDiaId,
      fundamento: activeFundamento,
      tipo_evento: tipoEvento,
      peso: peso,
      observacoes: observacoes || undefined
    };

    try {
      await salvarEventoQualificado(evento);
      toast({
        title: "Sucesso",
        description: `Evento "${tipoEvento}" registrado com sucesso!`
      });
      setObservacoes("");
    } catch (error) {
      console.error("Erro ao registrar evento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar o evento. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Exibe indicador de carregamento enquanto busca os eventos
  if (isLoadingEventos) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <LoadingSpinner />
        <p className="mt-4 text-muted-foreground">Carregando avaliações...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div>
        <h2 className="text-lg font-semibold">
          {exercise.exercicio?.nome || "Exercício"}
        </h2>
        <p className="text-sm text-muted-foreground mb-3">
          Avaliação qualitativa em tempo real
        </p>
      </div>
      
      {/* Fundamentos tabs */}
      <div className="overflow-x-auto pb-2">
        <div className="flex space-x-2 w-max">
          {fundamentosQualitativos.map((fundamento) => (
            <Button
              key={fundamento}
              variant={activeFundamento === fundamento ? "default" : "outline"}
              size="sm"
              className={cn(
                "rounded-full px-3 py-1", 
                activeFundamento === fundamento 
                  ? "bg-primary" 
                  : "bg-background"
              )}
              onClick={() => setActiveFundamento(fundamento)}
            >
              {fundamento}
            </Button>
          ))}
        </div>
      </div>

      {/* Painel de avaliação qualitativa */}
      <div className="bg-muted/30 rounded-md p-3 my-3">
        <div className="text-sm">
          <p className="font-medium">{activeFundamento}</p>
          <p className="text-xs text-muted-foreground">
            {selectedAtleta ? "Atleta selecionado para avaliação" : "Selecione um atleta abaixo"}
          </p>
        </div>
        
        {selectedAtleta && configFundamento && (
          <div className="mt-3 space-y-2">
            {/* Campo de observações */}
            <Input
              placeholder="Observações sobre este evento..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="text-sm"
            />
            
            {/* Botões para eventos qualitativos */}
            <div className="grid grid-cols-2 gap-2">
              {configFundamento.eventos.map((evento) => (
                <TooltipProvider key={evento.tipo}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        onClick={() => registrarEventoQualificado(selectedAtleta, evento.tipo, evento.peso)}
                        variant={evento.peso > 0 ? "default" : "destructive"}
                        className="h-9 flex items-center justify-between w-full px-3"
                        size="sm"
                      >
                        <span>{evento.tipo}</span>
                        <Badge 
                          variant={evento.peso > 0 ? "outline" : "destructive"} 
                          className="ml-1"
                        >
                          {evento.peso.toFixed(1)}
                        </Badge>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{evento.descricao || evento.tipo}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-2" 
              onClick={() => setSelectedAtleta(null)}
            >
              <X className="h-4 w-4 mr-1" /> Cancelar seleção
            </Button>
          </div>
        )}
      </div>
      
      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar atleta..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Athletes list */}
      <div className="space-y-3 flex-1 overflow-y-auto pb-4">
        {filteredAthletes.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            Nenhum atleta encontrado
          </div>
        ) : (
          filteredAthletes.map(({ atleta }) => {
            // Busca dados de avaliação para este atleta no fundamento atual
            const avaliacoesFundamento = eventosPorAtleta[atleta.id]?.[activeFundamento];
            
            return (
              <div 
                key={atleta.id} 
                className={cn(
                  "border rounded-lg p-3 flex items-center justify-between bg-background cursor-pointer",
                  selectedAtleta === atleta.id && "border-primary"
                )}
                onClick={() => setSelectedAtleta(atleta.id)}
              >
                <div className="flex items-center flex-grow">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src={atleta.imagem_url} alt={atleta.nome} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {atleta.nome.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-grow">
                    <p className="font-medium">{atleta.nome}</p>
                    <div className="text-xs text-muted-foreground flex">
                      <span>{atleta.posicao}</span>
                    </div>
                  </div>
                  
                  {/* Indicadores de avaliação para o fundamento atual */}
                  {avaliacoesFundamento && avaliacoesFundamento.total > 0 && (
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                        <span className="text-xs">{avaliacoesFundamento.positivos}</span>
                      </div>
                      <div className="flex items-center">
                        <XCircle className="h-4 w-4 text-red-500 mr-1" />
                        <span className="text-xs">{avaliacoesFundamento.negativos}</span>
                      </div>
                      <Badge 
                        variant={avaliacoesFundamento.mediaPeso > 0 ? "outline" : "destructive"} 
                        className="ml-1 text-xs"
                      >
                        {avaliacoesFundamento.mediaPeso.toFixed(1)}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <Button 
        className="mt-4"
        onClick={onBack}
      >
        Voltar ao cronômetro
      </Button>
    </div>
  );
};

export default RealTimeEvaluation;

