import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Edit, 
  BarChart3,
  ClipboardList
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { fetchPresencasAtletas } from "@/services/treinosDoDiaService";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  EventoQualificado, 
  buscarEventosQualificados,
} from "@/services/avaliacaoQualitativaService";

interface EvaluationSummaryProps {
  exercise: any;
  treinoDoDiaId: string;
  evaluationData: any; // Mantido apenas para retrocompatibilidade
  onEdit: () => void;
  onSave: () => void;
}

const EvaluationSummary = ({
  exercise,
  treinoDoDiaId,
  onEdit,
  onSave
}: EvaluationSummaryProps) => {
  const [activeTab, setActiveTab] = useState<"atletas" | "fundamentos">("atletas");
  const { toast } = useToast();
  const [eventosQualificados, setEventosQualificados] = useState<EventoQualificado[]>([]);
  const [isLoadingEventos, setIsLoadingEventos] = useState(true);

  // Fetch athletes with attendance
  const { data: athletesWithAttendance = [], isLoading: isLoadingAthletes } = useQuery({
    queryKey: ["athletes-attendance", treinoDoDiaId],
    queryFn: () => fetchPresencasAtletas(treinoDoDiaId),
    enabled: !!treinoDoDiaId,
  });

  // Carregar eventos qualificados ao montar o componente
  useEffect(() => {
    const carregarEventos = async () => {
      try {
        setIsLoadingEventos(true);
        const eventos = await buscarEventosQualificados({
          treino_id: treinoDoDiaId
        });
        setEventosQualificados(eventos);
      } catch (error) {
        console.error("Erro ao carregar eventos qualificados:", error);
        toast({
          title: "Erro ao carregar avaliações",
          description: "Não foi possível carregar as avaliações qualitativas",
          variant: "destructive"
        });
      } finally {
        setIsLoadingEventos(false);
      }
    };

    if (treinoDoDiaId) {
      carregarEventos();
    }
  }, [treinoDoDiaId, toast]);

  // Get all fundamentos that have evaluations
  const fundamentos = Array.from(
    new Set(eventosQualificados.map(evento => evento.fundamento))
  );

  // Agrupar dados de atletas para exibição
  const dadosPorAtleta = eventosQualificados.reduce((acc, evento) => {
    if (!acc[evento.atleta_id]) {
      acc[evento.atleta_id] = {
        eventos: [],
        totalPontos: 0,
        fundamentos: new Set()
      };
    }
    
    acc[evento.atleta_id].eventos.push(evento);
    acc[evento.atleta_id].totalPontos += evento.peso;
    acc[evento.atleta_id].fundamentos.add(evento.fundamento);
    
    return acc;
  }, {} as Record<string, { eventos: EventoQualificado[], totalPontos: number, fundamentos: Set<string> }>);

  // Agrupar dados por fundamento para exibição
  const dadosPorFundamento = eventosQualificados.reduce((acc, evento) => {
    if (!acc[evento.fundamento]) {
      acc[evento.fundamento] = {
        eventos: [],
        totalPontos: 0,
        atletasAvaliados: new Set()
      };
    }
    
    acc[evento.fundamento].eventos.push(evento);
    acc[evento.fundamento].totalPontos += evento.peso;
    acc[evento.fundamento].atletasAvaliados.add(evento.atleta_id);
    
    return acc;
  }, {} as Record<string, { eventos: EventoQualificado[], totalPontos: number, atletasAvaliados: Set<string> }>);

  const handleSalvarEFechar = () => {
    toast({
      title: "Avaliações salvas",
      description: "As avaliações qualitativas já foram registradas no sistema.",
    });
    onSave();
  };

  // Get athletes with evaluations
  const athletesWithEvaluations = athletesWithAttendance
    .filter(a => a.presente && dadosPorAtleta[a.atleta.id]);

  if (isLoadingAthletes || isLoadingEventos) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <LoadingSpinner />
        <p className="mt-4 text-muted-foreground">Carregando dados...</p>
      </div>
    );
  }

  if (eventosQualificados.length === 0) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-600">
          <ClipboardList className="h-8 w-8" />
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-1">Nenhuma avaliação registrada</h3>
          <p className="text-muted-foreground text-sm">
            Volte e registre avaliações para os atletas.
          </p>
        </div>
        
        <Button onClick={onEdit} className="mt-4">
          <Edit className="h-4 w-4 mr-2" />
          Voltar para avaliação
        </Button>
      </div>
    );
  }

  // Calcular estatísticas gerais
  const totalEventos = eventosQualificados.length;
  const eventosPositivos = eventosQualificados.filter(e => e.peso > 0).length;
  const eventosNegativos = eventosQualificados.filter(e => e.peso < 0).length;
  const totalPontos = eventosQualificados.reduce((sum, e) => sum + e.peso, 0);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-1">Resumo da Avaliação</h2>
        <p className="text-sm text-muted-foreground">
          {exercise.exercicio?.nome || "Exercício"}
        </p>
      </div>

      {/* Overall statistics */}
      <div className="bg-muted/30 rounded-md p-4 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium flex items-center">
            <BarChart3 className="h-4 w-4 mr-1" />
            Estatísticas Gerais
          </h3>
          <Badge variant="outline" className="font-normal">
            {totalEventos} eventos registrados
          </Badge>
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-muted/50 p-2 rounded-md">
            <div className="text-2xl font-bold">{totalPontos.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">Total de pontos</div>
          </div>
          <div className="bg-green-500/10 p-2 rounded-md">
            <div className="text-2xl font-bold text-green-600">{eventosPositivos}</div>
            <div className="text-xs text-muted-foreground">Eventos positivos</div>
          </div>
          <div className="bg-red-500/10 p-2 rounded-md">
            <div className="text-2xl font-bold text-red-600">{eventosNegativos}</div>
            <div className="text-xs text-muted-foreground">Eventos negativos</div>
          </div>
        </div>
      </div>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "atletas" | "fundamentos")} className="w-full">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="atletas">Por atletas</TabsTrigger>
          <TabsTrigger value="fundamentos">Por fundamentos</TabsTrigger>
        </TabsList>

        {/* Athletes tab */}
        <TabsContent value="atletas" className="space-y-3 max-h-[40vh] overflow-y-auto">
          {athletesWithEvaluations.map(({ atleta }) => {
            const atletaData = dadosPorAtleta[atleta.id];
            const totalEventosAtleta = atletaData?.eventos.length || 0;
            const totalPontosAtleta = atletaData?.totalPontos || 0;
            const fundamentosAvaliados = Array.from(atletaData?.fundamentos || []);
            
            return (
              <div key={atleta.id} className="border rounded-lg p-3 bg-background">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage src={atleta.imagem_url} alt={atleta.nome} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {atleta.nome.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{atleta.nome}</p>
                      <p className="text-xs text-muted-foreground">{atleta.posicao}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{totalPontosAtleta.toFixed(1)} pts</p>
                    <p className="text-xs text-muted-foreground">{totalEventosAtleta} eventos</p>
                  </div>
                </div>
                
                <div className="mt-2 flex flex-wrap gap-1">
                  {fundamentosAvaliados.map(fund => (
                    <Badge key={fund} variant="outline" className="text-xs">
                      {fund}
                    </Badge>
                  ))}
                </div>
              </div>
            );
          })}
        </TabsContent>
        
        {/* Fundamentos tab */}
        <TabsContent value="fundamentos" className="space-y-3 max-h-[40vh] overflow-y-auto">
          {fundamentos.map(fundamento => {
            const fundData = dadosPorFundamento[fundamento] || { eventos: [], totalPontos: 0, atletasAvaliados: new Set() };
            const tiposEvento = fundData.eventos.reduce((acc, ev) => {
              if (!acc[ev.tipo_evento]) {
                acc[ev.tipo_evento] = 0;
              }
              acc[ev.tipo_evento]++;
              return acc;
            }, {} as Record<string, number>);
            
            return (
              <div key={fundamento} className="border rounded-lg p-3 bg-background">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="font-medium">{fundamento}</p>
                    <p className="text-xs text-muted-foreground">
                      {fundData.atletasAvaliados.size} atletas avaliados
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{fundData.totalPontos.toFixed(1)} pts</p>
                    <p className="text-xs text-muted-foreground">{fundData.eventos.length} eventos</p>
                  </div>
                </div>
                
                <div className="mt-2">
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(tiposEvento).map(([tipo, count]) => (
                      <div key={tipo} className="text-xs flex justify-between px-2 py-1 bg-muted/30 rounded">
                        <span>{tipo}</span>
                        <span className="font-medium">{count}x</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </TabsContent>
      </Tabs>

      <div className="pt-4 mt-4 flex justify-center">
        <Button onClick={handleSalvarEFechar} className="w-full">
          Concluir
        </Button>
      </div>
    </div>
  );
};

export default EvaluationSummary;
