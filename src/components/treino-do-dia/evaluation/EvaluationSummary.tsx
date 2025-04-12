
import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle, 
  XCircle, 
  User, 
  Save, 
  Edit, 
  BarChart3,
  ClipboardList
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { fetchPresencasAtletas, salvarAvaliacoesEmLote } from "@/services/treinosDoDiaService";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface EvaluationSummaryProps {
  exercise: any;
  treinoDoDiaId: string;
  evaluationData: {
    [atletaId: string]: {
      [fundamento: string]: { acertos: number; erros: number };
    };
  };
  onEdit: () => void;
  onSave: () => void;
}

const EvaluationSummary = ({
  exercise,
  treinoDoDiaId,
  evaluationData,
  onEdit,
  onSave
}: EvaluationSummaryProps) => {
  const [activeTab, setActiveTab] = useState<"atletas" | "fundamentos">("atletas");
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Fetch athletes with attendance
  const { data: athletesWithAttendance = [], isLoading: isLoadingAthletes } = useQuery({
    queryKey: ["athletes-attendance", treinoDoDiaId],
    queryFn: () => fetchPresencasAtletas(treinoDoDiaId),
    enabled: !!treinoDoDiaId,
  });

  // Get all fundamentos that have evaluations
  const fundamentos = Array.from(
    new Set(
      Object.values(evaluationData).flatMap(athlete => 
        Object.keys(athlete).filter(fund => 
          athlete[fund].acertos > 0 || athlete[fund].erros > 0
        )
      )
    )
  );

  // Get athletes with evaluations
  const athletesWithEvaluations = athletesWithAttendance
    .filter(a => a.presente && evaluationData[a.atleta.id])
    .filter(a => {
      // Only include athletes that have at least one evaluation
      const athleteData = evaluationData[a.atleta.id];
      return Object.values(athleteData).some(
        fund => fund.acertos > 0 || fund.erros > 0
      );
    });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      setIsSaving(true);
      
      // Format data for the API
      const avaliacoes = [];
      
      for (const atletaId in evaluationData) {
        for (const fundamento in evaluationData[atletaId]) {
          const { acertos, erros } = evaluationData[atletaId][fundamento];
          
          // Only save if there's actual evaluation data
          if (acertos > 0 || erros > 0) {
            avaliacoes.push({
              treinoDoDiaId,
              exercicioId: exercise.exercicio_id,
              atletaId,
              fundamento,
              acertos,
              erros
            });
          }
        }
      }
      
      if (avaliacoes.length > 0) {
        await salvarAvaliacoesEmLote(avaliacoes);
      }
    },
    onSuccess: () => {
      toast({
        title: "Avaliação salva com sucesso",
        description: "Todas as avaliações foram registradas no sistema.",
      });
      setIsSaving(false);
      onSave();
    },
    onError: (error) => {
      console.error("Erro ao salvar avaliações:", error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar as avaliações. Por favor, tente novamente.",
        variant: "destructive",
      });
      setIsSaving(false);
    }
  });

  const handleSave = () => {
    saveMutation.mutate();
  };

  // Calculate overall statistics
  const calculateOverallStats = () => {
    let totalAcertos = 0;
    let totalErros = 0;
    
    Object.values(evaluationData).forEach(athlete => {
      Object.values(athlete).forEach(fund => {
        totalAcertos += fund.acertos;
        totalErros += fund.erros;
      });
    });
    
    const total = totalAcertos + totalErros;
    const eficiencia = total > 0 ? Math.round((totalAcertos / total) * 100) : 0;
    
    return { totalAcertos, totalErros, total, eficiencia };
  };

  const stats = calculateOverallStats();

  if (isLoadingAthletes) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <LoadingSpinner />
        <p className="mt-4 text-muted-foreground">Carregando dados...</p>
      </div>
    );
  }

  if (athletesWithEvaluations.length === 0) {
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
            {stats.eficiencia}% eficiência
          </Badge>
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-muted/50 p-2 rounded-md">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="bg-green-500/10 p-2 rounded-md">
            <div className="text-2xl font-bold text-green-600">{stats.totalAcertos}</div>
            <div className="text-xs text-muted-foreground">Acertos</div>
          </div>
          <div className="bg-red-500/10 p-2 rounded-md">
            <div className="text-2xl font-bold text-red-600">{stats.totalErros}</div>
            <div className="text-xs text-muted-foreground">Erros</div>
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
            const athleteData = evaluationData[atleta.id] || {};
            let totalAcertos = 0;
            let totalErros = 0;
            
            Object.values(athleteData).forEach(fund => {
              totalAcertos += fund.acertos;
              totalErros += fund.erros;
            });
            
            const total = totalAcertos + totalErros;
            const eficiencia = total > 0 ? Math.round((totalAcertos / total) * 100) : 0;
            
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
                  <Badge variant="outline">
                    {eficiencia}% eficiência
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {Object.entries(athleteData).map(([fundamento, data]) => {
                    if (data.acertos === 0 && data.erros === 0) return null;
                    const fundTotal = data.acertos + data.erros;
                    const fundEficiencia = fundTotal > 0 ? Math.round((data.acertos / fundTotal) * 100) : 0;
                    
                    return (
                      <div key={fundamento} className="bg-muted/30 p-2 rounded-md text-sm">
                        <div className="flex justify-between items-center">
                          <span>{fundamento}</span>
                          <span className="text-xs">{fundEficiencia}%</span>
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span className="flex items-center text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {data.acertos}
                          </span>
                          <span className="flex items-center text-red-600">
                            <XCircle className="h-3 w-3 mr-1" />
                            {data.erros}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </TabsContent>

        {/* Fundamentos tab */}
        <TabsContent value="fundamentos" className="space-y-3 max-h-[40vh] overflow-y-auto">
          {fundamentos.map(fundamento => {
            let fundAcertos = 0;
            let fundErros = 0;
            const athleteResults = [];
            
            // Calculate total acertos/erros for this fundamento and prepare athlete data
            athletesWithEvaluations.forEach(({ atleta }) => {
              const fundData = evaluationData[atleta.id]?.[fundamento];
              if (fundData && (fundData.acertos > 0 || fundData.erros > 0)) {
                fundAcertos += fundData.acertos;
                fundErros += fundData.erros;
                
                athleteResults.push({
                  atleta,
                  acertos: fundData.acertos,
                  erros: fundData.erros,
                  total: fundData.acertos + fundData.erros,
                  eficiencia: Math.round((fundData.acertos / (fundData.acertos + fundData.erros)) * 100)
                });
              }
            });
            
            if (athleteResults.length === 0) return null;
            
            const fundTotal = fundAcertos + fundErros;
            const fundEficiencia = fundTotal > 0 ? Math.round((fundAcertos / fundTotal) * 100) : 0;
            
            return (
              <div key={fundamento} className="border rounded-lg p-3 bg-background">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium">{fundamento}</h3>
                  <Badge variant="outline">
                    {fundEficiencia}% eficiência
                  </Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-center mb-3">
                  <div className="bg-muted/50 p-1 rounded-md">
                    <div className="text-lg font-bold">{fundTotal}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                  <div className="bg-green-500/10 p-1 rounded-md">
                    <div className="text-lg font-bold text-green-600">{fundAcertos}</div>
                    <div className="text-xs text-muted-foreground">Acertos</div>
                  </div>
                  <div className="bg-red-500/10 p-1 rounded-md">
                    <div className="text-lg font-bold text-red-600">{fundErros}</div>
                    <div className="text-xs text-muted-foreground">Erros</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {athleteResults.map(result => (
                    <div 
                      key={result.atleta.id} 
                      className="flex items-center justify-between py-1 px-2 rounded-md bg-muted/30 text-sm"
                    >
                      <div className="flex items-center">
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarFallback className="text-xs">
                            {result.atleta.nome.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{result.atleta.nome}</span>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <span className="text-green-600">{result.acertos}</span>
                        <span className="text-red-600">{result.erros}</span>
                        <span className="text-xs bg-muted rounded px-1">
                          {result.eficiencia}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </TabsContent>
      </Tabs>

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onEdit}>
          <Edit className="h-4 w-4 mr-2" />
          Editar avaliação
        </Button>
        
        <Button 
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <LoadingSpinner className="h-4 w-4 mr-2" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Confirmar e Salvar
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default EvaluationSummary;
