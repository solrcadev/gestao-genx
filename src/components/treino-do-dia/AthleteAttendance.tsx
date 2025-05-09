import React, { useState, useEffect } from "react";
import { fetchPresencasAtletas, registrarPresencasEmLote } from "@/services/treinosDoDiaService";
import LoadingSpinner from "../LoadingSpinner";
import { Search, X, CheckCircle2, XCircle } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { toast } from "../ui/use-toast";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { JustificativaTipo } from "@/hooks/attendance-hooks";
import { Progress } from "../ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

interface AthleteAttendanceProps {
  treinoDoDiaId: string;
  onSaved: () => void;
}

const AthleteAttendance: React.FC<AthleteAttendanceProps> = ({ treinoDoDiaId, onSaved }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [athletes, setAthletes] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [presences, setPresences] = useState<any[]>([]);
  const [effortIndices, setEffortIndices] = useState<Record<string, number>>({});
  const isMobile = useIsMobile();

  useEffect(() => {
    const loadAthletes = async () => {
      try {
        setLoading(true);
        console.log('[DEBUG] Carregando presenças de atletas para treino:', treinoDoDiaId);
        
        const data = await fetchPresencasAtletas(treinoDoDiaId);
        console.log('[DEBUG] Dados de presença carregados:', data.length, 'atletas');
        
        setAthletes(data);
        
        // Initialize presences from fetched data and load effort indices
        const initialPresences = data.map(item => ({
          atleta_id: item.atleta.id,
          presente: item.presente,
          justificativa: item.justificativa || '',
          justificativa_tipo: item.justificativa_tipo || (item.presente ? null : JustificativaTipo.SEM_JUSTIFICATIVA),
          id: item.id
        }));
        
        setPresences(initialPresences);
        console.log('[DEBUG] Presenças inicializadas:', initialPresences.length);
        
        // Load effort indices
        const indices: Record<string, number> = {};
        data.forEach(item => {
          if (item.atleta && typeof item.indice_esforco === 'number') {
            indices[item.atleta.id] = item.indice_esforco;
          } else {
            indices[item.atleta.id] = 0; // Default value
          }
        });
        setEffortIndices(indices);
      } catch (error) {
        console.error("[DEBUG] Erro ao carregar atletas:", error);
        toast({
          title: "Erro ao carregar atletas",
          description: "Não foi possível carregar a lista de atletas. Tente novamente ou contate o suporte.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadAthletes();
  }, [treinoDoDiaId]);

  const handleTogglePresence = (atletaId: string) => {
    setPresences(prev => 
      prev.map(p => 
        p.atleta_id === atletaId 
          ? { 
              ...p, 
              presente: !p.presente, 
              justificativa: !p.presente ? '' : p.justificativa,
              justificativa_tipo: !p.presente ? null : p.justificativa_tipo
            } 
          : p
      )
    );
  };

  const handleJustificativaChange = (atletaId: string, value: string) => {
    setPresences(prev => 
      prev.map(p => 
        p.atleta_id === atletaId 
          ? { ...p, justificativa: value } 
          : p
      )
    );
  };

  const handleJustificativaTipoChange = (atletaId: string, value: JustificativaTipo) => {
    setPresences(prev => 
      prev.map(p => 
        p.atleta_id === atletaId 
          ? { ...p, justificativa_tipo: value } 
          : p
      )
    );
  };

  const handleSavePresences = async () => {
    try {
      setSaving(true);
      console.log('[DEBUG] Salvando presenças para o treino:', treinoDoDiaId);
      console.log('[DEBUG] Total de presenças a salvar:', presences.length);
      
      // Verificar se presences está vazio
      if (!presences.length) {
        console.warn('[DEBUG] Não há presenças para salvar!');
        toast({
          title: "Aviso",
          description: "Não há dados de presença para salvar.",
          variant: "default",
        });
        setSaving(false);
        return;
      }
      
      // Preparar dados para salvar, garantindo que justificativa_tipo seja definido corretamente
      const presencesToSave = presences.map(p => ({
        ...p,
        justificativa_tipo: p.presente 
          ? null 
          : (p.justificativa_tipo || JustificativaTipo.SEM_JUSTIFICATIVA),
        justificativa: p.presente ? null : p.justificativa
      }));
      
      console.log('[DEBUG] Dados de presença processados:', JSON.stringify(presencesToSave, null, 2));
      
      await registrarPresencasEmLote({
        treinoDoDiaId,
        presences: presencesToSave
      });
      
      console.log('[DEBUG] Presenças salvas com sucesso');
      
      toast({
        title: "Presenças salvas",
        description: "As presenças foram registradas com sucesso.",
      });
      
      if (onSaved) {
        onSaved();
      }
    } catch (error) {
      console.error("[DEBUG] Erro detalhado ao salvar presenças:", error);
      
      // Mensagem mais detalhada para o usuário
      toast({
        title: "Erro ao salvar presenças",
        description: error instanceof Error 
          ? `Detalhes: ${error.message}` 
          : "Houve um problema ao salvar as presenças. Verifique o console para mais detalhes.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Filter athletes based on search query
  const filteredAthletes = athletes.filter(item => 
    item.atleta.nome.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Count present athletes
  const presentCount = presences.filter(p => p.presente).length;
  const totalCount = athletes.length;
  const presentPercentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  // Format effort index for display
  const formatEffortIndex = (value: number) => {
    if (value === undefined || value === null) return 'N/A';
    return value.toFixed(2);
  };
  
  // Get color class based on effort index
  const getEffortColorClass = (value: number) => {
    if (value === undefined || value === null) return 'bg-gray-200';
    if (value >= 0.7) return 'bg-green-500';
    if (value >= 0.4) return 'bg-green-300';
    if (value >= 0) return 'bg-yellow-300';
    if (value >= -0.5) return 'bg-orange-400';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-4">
      {/* Search and stats */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar atleta..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
        
        <div className="flex justify-between items-center px-1">
          <div className="text-sm text-muted-foreground">
            {presentCount} de {totalCount} presentes ({presentPercentage}%)
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              // Set all to present
              setPresences(prev => 
                prev.map(p => ({ ...p, presente: true, justificativa: '', justificativa_tipo: null }))
              );
            }}
          >
            Marcar todos
          </Button>
        </div>
      </div>

      {/* Athletes list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : filteredAthletes.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Nenhum atleta encontrado</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {filteredAthletes.map((item) => {
            const presence = presences.find(p => p.atleta_id === item.atleta.id);
            const isPresent = presence?.presente ?? true;
            const effortIndex = effortIndices[item.atleta.id] || 0;
            
            return (
              <div 
                key={item.atleta.id} 
                className={`border rounded-lg p-3 transition-colors ${
                  isPresent ? "bg-card" : "bg-muted/30"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <div className="mr-3">
                      {item.atleta.foto_url ? (
                        <img 
                          src={item.atleta.foto_url} 
                          alt={item.atleta.nome}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {item.atleta.nome.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{item.atleta.nome}</p>
                      <p className="text-sm text-muted-foreground">{item.atleta.posicao}</p>
                      
                      {/* Effort Index */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center mt-1 gap-1">
                              <div className="w-16">
                                <Progress value={(effortIndex + 1) * 50} className={`h-1.5 ${getEffortColorClass(effortIndex)}`} />
                              </div>
                              <span className="text-xs text-muted-foreground">
                                Índice: {formatEffortIndex(effortIndex)}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-medium">Índice de Esforço: {formatEffortIndex(effortIndex)}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Baseado nos últimos treinos e justificativas
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    {isPresent ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mr-2" />
                    )}
                    <Switch 
                      checked={isPresent}
                      onCheckedChange={() => handleTogglePresence(item.atleta.id)}
                    />
                  </div>
                </div>
                
                {!isPresent && (
                  <div className="mt-3 space-y-3">
                    <Select
                      value={presence?.justificativa_tipo || JustificativaTipo.SEM_JUSTIFICATIVA}
                      onValueChange={(value) => handleJustificativaTipoChange(item.atleta.id, value as JustificativaTipo)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Tipo de ausência" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={JustificativaTipo.SEM_JUSTIFICATIVA}>
                          Falta sem justificativa
                        </SelectItem>
                        <SelectItem value={JustificativaTipo.MOTIVO_PESSOAL}>
                          Falta justificada - motivo pessoal
                        </SelectItem>
                        <SelectItem value={JustificativaTipo.MOTIVO_ACADEMICO}>
                          Falta justificada - motivo acadêmico
                        </SelectItem>
                        <SelectItem value={JustificativaTipo.MOTIVO_LOGISTICO}>
                          Falta justificada - motivo logístico
                        </SelectItem>
                        <SelectItem value={JustificativaTipo.MOTIVO_SAUDE}>
                          Falta justificada - motivo de saúde
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Textarea
                      placeholder="Justificativa da ausência..."
                      className="text-sm resize-none"
                      value={presence?.justificativa || ''}
                      onChange={(e) => handleJustificativaChange(item.atleta.id, e.target.value)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      {/* Save button */}
      <div className="pt-4">
        <Button 
          className="w-full" 
          onClick={handleSavePresences}
          disabled={saving}
        >
          {saving && <LoadingSpinner className="mr-2" />}
          Salvar Presenças
        </Button>
      </div>
    </div>
  );
};

export default AthleteAttendance;
