
import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  PlusCircle, 
  MinusCircle, 
  Search, 
  Save, 
  UserCheck, 
  Check,
  ThumbsUp,
  ThumbsDown 
} from "lucide-react";
import {
  fetchPresencasAtletas,
  salvarAvaliacaoExercicio
} from "@/services/treinosDoDiaService";

interface ExerciseEvaluationProps {
  exerciseId: string;
  treinoDoDiaId: string;
  exerciseName: string;
}

const FUNDAMENTOS = [
  "Saque",
  "Recepção",
  "Levantamento",
  "Ataque",
  "Bloqueio",
  "Defesa"
];

export function ExerciseEvaluation({
  exerciseId,
  treinoDoDiaId,
  exerciseName
}: ExerciseEvaluationProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [selectedFundamento, setSelectedFundamento] = useState(FUNDAMENTOS[0]);
  const [acertos, setAcertos] = useState(0);
  const [erros, setErros] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch athletes with attendance
  const { data: athletesWithAttendance = [], isLoading } = useQuery({
    queryKey: ["athletes-attendance", treinoDoDiaId],
    queryFn: () => fetchPresencasAtletas(treinoDoDiaId),
  });
  
  // Filter athletes based on search and presence
  const filteredAthletes = athletesWithAttendance
    .filter(a => a.presente)
    .filter(a => 
      a.atleta.nome.toLowerCase().includes(searchQuery.toLowerCase())
    );
  
  // Select athlete effect
  const handleSelectAthlete = (athleteId: string) => {
    setSelectedAthleteId(athleteId);
    // Reset evaluation
    setAcertos(0);
    setErros(0);
  };
  
  // Mutations for saving evaluation
  const saveEvaluationMutation = useMutation({
    mutationFn: salvarAvaliacaoExercicio,
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["athlete-evaluations", treinoDoDiaId, exerciseId] 
      });
      toast({
        title: "Avaliação salva",
        description: "A avaliação do atleta foi registrada com sucesso!"
      });
      // Reset for next evaluation
      setAcertos(0);
      setErros(0);
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar avaliação",
        description: "Não foi possível salvar a avaliação. Tente novamente.",
        variant: "destructive"
      });
      console.error("Error saving evaluation:", error);
    }
  });
  
  // Save evaluation
  const handleSaveEvaluation = () => {
    if (!selectedAthleteId) {
      toast({
        title: "Selecione um atleta",
        description: "É necessário selecionar um atleta para avaliar",
        variant: "destructive"
      });
      return;
    }
    
    if (acertos === 0 && erros === 0) {
      toast({
        title: "Avaliação vazia",
        description: "Registre pelo menos um acerto ou erro",
        variant: "destructive"
      });
      return;
    }
    
    saveEvaluationMutation.mutate({
      treinoDoDiaId,
      exercicioId: exerciseId,
      atletaId: selectedAthleteId,
      fundamento: selectedFundamento,
      acertos,
      erros
    });
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <LoadingSpinner />
        <p className="mt-4 text-muted-foreground">Carregando atletas...</p>
      </div>
    );
  }
  
  // Check if no athletes are present
  if (athletesWithAttendance.filter(a => a.presente).length === 0) {
    return (
      <div className="text-center py-6">
        <UserCheck className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
        <p>Nenhum atleta marcado como presente.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Registre a presença dos atletas primeiro.
        </p>
      </div>
    );
  }
  
  // Get selected athlete
  const selectedAthlete = athletesWithAttendance.find(a => a.atleta.id === selectedAthleteId)?.atleta;
  
  return (
    <div className="space-y-4">
      {/* Header with exercise info */}
      <div>
        <Badge className="mb-2">{exerciseName}</Badge>
        <p className="text-sm text-muted-foreground">
          Selecione um atleta e avalie seu desempenho neste exercício.
        </p>
      </div>
      
      <Separator />
      
      <Tabs defaultValue="select-athlete">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="select-athlete" className="flex-1">Selecionar Atleta</TabsTrigger>
          <TabsTrigger 
            value="evaluate" 
            className="flex-1"
            disabled={!selectedAthleteId}
          >
            Avaliar
          </TabsTrigger>
        </TabsList>
        
        {/* Tab content for selecting athlete */}
        <TabsContent value="select-athlete" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar atleta..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <div className="grid gap-2 max-h-[40vh] overflow-y-auto">
            {filteredAthletes.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Nenhum atleta encontrado
              </p>
            ) : (
              filteredAthletes.map(({ atleta }) => (
                <div
                  key={atleta.id}
                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedAthleteId === atleta.id
                      ? "bg-primary/10 border-primary"
                      : "hover:bg-accent"
                  }`}
                  onClick={() => handleSelectAthlete(atleta.id)}
                >
                  <div>
                    <p className="font-medium">{atleta.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {atleta.posicao} • {atleta.idade} anos
                    </p>
                  </div>
                  {selectedAthleteId === atleta.id && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </div>
              ))
            )}
          </div>
        </TabsContent>
        
        {/* Tab content for evaluation */}
        <TabsContent value="evaluate" className="space-y-4">
          {selectedAthlete && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  {selectedAthlete.nome.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{selectedAthlete.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedAthlete.posicao} • {selectedAthlete.time}
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="fundamento">Fundamento</Label>
                  <Select
                    value={selectedFundamento}
                    onValueChange={setSelectedFundamento}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um fundamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {FUNDAMENTOS.map(fundamento => (
                        <SelectItem key={fundamento} value={fundamento}>
                          {fundamento}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {/* Acertos counter */}
                  <div className="space-y-2">
                    <Label className="flex items-center text-green-600">
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      Acertos
                    </Label>
                    <div className="flex items-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setAcertos(Math.max(0, acertos - 1))}
                        disabled={acertos <= 0}
                      >
                        <MinusCircle className="h-4 w-4" />
                      </Button>
                      <div className="px-4 py-2 border mx-2 rounded-md w-12 text-center">
                        {acertos}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setAcertos(acertos + 1)}
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Erros counter */}
                  <div className="space-y-2">
                    <Label className="flex items-center text-red-500">
                      <ThumbsDown className="h-4 w-4 mr-1" />
                      Erros
                    </Label>
                    <div className="flex items-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setErros(Math.max(0, erros - 1))}
                        disabled={erros <= 0}
                      >
                        <MinusCircle className="h-4 w-4" />
                      </Button>
                      <div className="px-4 py-2 border mx-2 rounded-md w-12 text-center">
                        {erros}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setErros(erros + 1)}
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <Button
                    className="w-full"
                    onClick={handleSaveEvaluation}
                    disabled={saveEvaluationMutation.isPending || (acertos === 0 && erros === 0)}
                  >
                    {saveEvaluationMutation.isPending ? (
                      <LoadingSpinner className="mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Salvar Avaliação
                  </Button>
                </div>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
