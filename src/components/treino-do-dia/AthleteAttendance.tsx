import React, { useState, useEffect } from "react";
import { fetchPresencasAtletas, registrarPresencasEmLote } from "@/services/treinosDoDiaService";
import LoadingSpinner from "../LoadingSpinner";
import { Search, X, CheckCircle2, XCircle } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { toast } from "../ui/use-toast";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";
import { useMediaQuery } from "@/hooks/use-mobile";

const AthleteAttendance = ({ treinoDoDiaId, onSaved }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [athletes, setAthletes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [presences, setPresences] = useState([]);
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    const loadAthletes = async () => {
      try {
        setLoading(true);
        const data = await fetchPresencasAtletas(treinoDoDiaId);
        setAthletes(data);
        
        // Initialize presences from fetched data
        const initialPresences = data.map(item => ({
          atleta_id: item.atleta.id,
          presente: item.presente,
          justificativa: item.justificativa || '',
          id: item.id
        }));
        
        setPresences(initialPresences);
      } catch (error) {
        console.error("Error loading athletes:", error);
        toast({
          title: "Erro ao carregar atletas",
          description: "Não foi possível carregar a lista de atletas.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadAthletes();
  }, [treinoDoDiaId]);

  const handleTogglePresence = (atletaId) => {
    setPresences(prev => 
      prev.map(p => 
        p.atleta_id === atletaId 
          ? { ...p, presente: !p.presente, justificativa: !p.presente ? '' : p.justificativa } 
          : p
      )
    );
  };

  const handleJustificativaChange = (atletaId, value) => {
    setPresences(prev => 
      prev.map(p => 
        p.atleta_id === atletaId 
          ? { ...p, justificativa: value } 
          : p
      )
    );
  };

  const handleSavePresences = async () => {
    try {
      setSaving(true);
      await registrarPresencasEmLote({
        treinoDoDiaId,
        presences
      });
      
      toast({
        title: "Presenças salvas",
        description: "As presenças foram registradas com sucesso.",
      });
      
      if (onSaved) {
        onSaved();
      }
    } catch (error) {
      console.error("Error saving presences:", error);
      toast({
        title: "Erro ao salvar presenças",
        description: "Não foi possível salvar as presenças.",
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
                prev.map(p => ({ ...p, presente: true, justificativa: '' }))
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
                  <div className="mt-3">
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
