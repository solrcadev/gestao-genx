
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Save,
  Search
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getAthletes } from "@/services/athleteService";
import { 
  fetchPresencas, 
  registrarPresenca, 
  registrarPresencasEmLote 
} from "@/services/treinosDoDiaService";
import { Team } from "@/types";

interface AthleteAttendanceProps {
  treinoDoDiaId: string;
  onComplete?: () => void;
  showHeader?: boolean;
}

export function AthleteAttendance({ 
  treinoDoDiaId, 
  onComplete,
  showHeader = true 
}: AthleteAttendanceProps) {
  const [selectedTeam, setSelectedTeam] = useState<Team>("Masculino");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedAbsent, setExpandedAbsent] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch athletes
  const { data: athletes = [], isLoading: isLoadingAthletes } = useQuery({
    queryKey: ["athletes", selectedTeam],
    queryFn: () => getAthletes(selectedTeam),
  });
  
  // Fetch presences
  const { data: presences = [], isLoading: isLoadingPresences } = useQuery({
    queryKey: ["presencas", treinoDoDiaId],
    queryFn: () => fetchPresencas(treinoDoDiaId),
  });
  
  // Mutation to update presence
  const updatePresenceMutation = useMutation({
    mutationFn: registrarPresenca,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["presencas", treinoDoDiaId] });
      queryClient.invalidateQueries({ queryKey: ["treino-do-dia", treinoDoDiaId] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a presença",
        variant: "destructive"
      });
      console.error("Error updating presence:", error);
    }
  });

  // Mutation to update presences in batch
  const updatePresencesBatchMutation = useMutation({
    mutationFn: registrarPresencasEmLote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["presencas", treinoDoDiaId] });
      queryClient.invalidateQueries({ queryKey: ["treino-do-dia", treinoDoDiaId] });
      toast({
        title: "Presenças salvas",
        description: "Todas as presenças foram registradas com sucesso!"
      });
      if (onComplete) onComplete();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as presenças",
        variant: "destructive"
      });
      console.error("Error updating presences in batch:", error);
    }
  });
  
  // Track local state for presences to allow for batch updates
  const [localPresences, setLocalPresences] = useState({});
  
  // Initialize local presences from fetched data
  React.useEffect(() => {
    if (presences.length) {
      const presencesMap = {};
      presences.forEach(p => {
        presencesMap[p.atleta_id] = {
          presente: p.presente,
          justificativa: p.justificativa || "",
          id: p.id
        };
      });
      setLocalPresences(presencesMap);
    }
  }, [presences]);
  
  // Handle presence toggle
  const togglePresence = (athleteId) => {
    setLocalPresences(prev => ({
      ...prev,
      [athleteId]: {
        ...prev[athleteId],
        presente: prev[athleteId] ? !prev[athleteId].presente : true
      }
    }));
  };
  
  // Handle justification change
  const updateJustification = (athleteId, justificativa) => {
    setLocalPresences(prev => ({
      ...prev,
      [athleteId]: {
        ...prev[athleteId],
        justificativa
      }
    }));
  };
  
  // Save all presences
  const saveAllPresences = () => {
    const presencesData = Object.keys(localPresences).map(athleteId => ({
      atleta_id: athleteId,
      treino_do_dia_id: treinoDoDiaId,
      presente: localPresences[athleteId].presente,
      justificativa: localPresences[athleteId].presente ? null : localPresences[athleteId].justificativa,
      id: localPresences[athleteId].id
    }));
    
    updatePresencesBatchMutation.mutate({
      treinoDoDiaId,
      presences: presencesData
    });
  };
  
  // Filter athletes
  const filteredAthletes = athletes.filter(athlete => 
    athlete.nome.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Group athletes by presence
  const presentAthletes = filteredAthletes.filter(athlete => 
    localPresences[athlete.id]?.presente !== false
  );
  
  const absentAthletes = filteredAthletes.filter(athlete => 
    localPresences[athlete.id]?.presente === false
  );
  
  // Loading states
  if (isLoadingAthletes || isLoadingPresences) {
    return (
      <div className="py-8 flex flex-col items-center justify-center">
        <LoadingSpinner />
        <p className="mt-4 text-muted-foreground">Carregando atletas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium">Registro de Presenças</h2>
          <Badge>
            {presentAthletes.length}/{filteredAthletes.length} presentes
          </Badge>
        </div>
      )}
      
      {/* Filter controls */}
      <div className="space-y-3">
        <div className="flex gap-4">
          <Button
            variant={selectedTeam === "Masculino" ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => setSelectedTeam("Masculino")}
          >
            Masculino
          </Button>
          <Button
            variant={selectedTeam === "Feminino" ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => setSelectedTeam("Feminino")}
          >
            Feminino
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar atleta..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      
      {/* Athletes list */}
      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
        {filteredAthletes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Nenhum atleta encontrado {searchQuery ? `para "${searchQuery}"` : ""}
            </p>
          </div>
        ) : (
          <>
            {/* Present athletes */}
            <div className="space-y-2">
              {presentAthletes.map(athlete => (
                <div
                  key={athlete.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-background"
                >
                  <div className="flex items-center">
                    <div className="mr-3">
                      <Checkbox
                        id={`athlete-${athlete.id}`}
                        checked={localPresences[athlete.id]?.presente !== false}
                        onCheckedChange={() => togglePresence(athlete.id)}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`athlete-${athlete.id}`}
                        className="font-medium cursor-pointer"
                      >
                        {athlete.nome}
                      </label>
                      <p className="text-xs text-muted-foreground">
                        {athlete.posicao} • {athlete.idade} anos
                      </p>
                    </div>
                  </div>
                  
                  <Badge variant="outline" className="ml-2">
                    Presente
                  </Badge>
                </div>
              ))}
            </div>
            
            {/* Absent athletes */}
            {absentAthletes.length > 0 && (
              <Accordion
                type="single"
                collapsible
                value={expandedAbsent ? "absent" : ""}
                onValueChange={value => setExpandedAbsent(value === "absent")}
              >
                <AccordionItem value="absent" className="border rounded-lg">
                  <AccordionTrigger className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">{absentAthletes.length} ausentes</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 p-2">
                      {absentAthletes.map(athlete => (
                        <div
                          key={athlete.id}
                          className="border rounded-lg p-3 bg-background"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <Checkbox
                                id={`athlete-absent-${athlete.id}`}
                                checked={localPresences[athlete.id]?.presente !== false}
                                onCheckedChange={() => togglePresence(athlete.id)}
                              />
                              <label
                                htmlFor={`athlete-absent-${athlete.id}`}
                                className="font-medium ml-3 cursor-pointer"
                              >
                                {athlete.nome}
                              </label>
                            </div>
                            <Badge variant="destructive" className="ml-2">
                              Ausente
                            </Badge>
                          </div>
                          
                          <div className="mt-2">
                            <Textarea
                              placeholder="Justificativa (opcional)"
                              value={localPresences[athlete.id]?.justificativa || ""}
                              onChange={e => updateJustification(athlete.id, e.target.value)}
                              className="text-sm min-h-[60px]"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </>
        )}
      </div>
      
      {/* Save button */}
      <div className="flex justify-end pt-4 sticky bottom-0 bg-background">
        <Button
          onClick={saveAllPresences}
          disabled={updatePresencesBatchMutation.isPending || filteredAthletes.length === 0}
          className="w-full"
        >
          {updatePresencesBatchMutation.isPending ? (
            <LoadingSpinner className="mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar Presenças
        </Button>
      </div>
    </div>
  );
}
