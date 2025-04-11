
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Athlete, Team } from "@/types";
import { getAthletes, createAthlete, updateAthlete, deleteAthlete } from "@/services/athleteService";
import AthleteCard from "@/components/AthleteCard";
import AthleteForm from "@/components/AthleteForm";
import ConfirmDialog from "@/components/ConfirmDialog";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Plus, Search, X, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Athletes = () => {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [filteredAthletes, setFilteredAthletes] = useState<Athlete[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTeam, setFilterTeam] = useState<Team | "all">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | undefined>(undefined);
  const { toast } = useToast();

  useEffect(() => {
    loadAthletes();
  }, []);

  useEffect(() => {
    filterAthletes();
  }, [athletes, searchQuery, filterTeam]);

  const loadAthletes = async () => {
    setIsLoading(true);
    try {
      const loadedAthletes = await getAthletes();
      setAthletes(loadedAthletes);
    } catch (error) {
      console.error("Error loading athletes:", error);
      toast({
        title: "Erro ao carregar atletas",
        description: "Não foi possível carregar a lista de atletas.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterAthletes = () => {
    let filtered = [...athletes];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((athlete) =>
        athlete.name.toLowerCase().includes(query)
      );
    }
    
    if (filterTeam && filterTeam !== "all") {
      filtered = filtered.filter((athlete) => athlete.team === filterTeam);
    }
    
    setFilteredAthletes(filtered);
  };

  const handleAddAthlete = () => {
    setSelectedAthlete(undefined);
    setFormOpen(true);
  };

  const handleEditAthlete = (athlete: Athlete) => {
    setSelectedAthlete(athlete);
    setFormOpen(true);
  };

  const handleDeleteClick = (athlete: Athlete) => {
    setSelectedAthlete(athlete);
    setConfirmOpen(true);
  };

  const handleSaveAthlete = async (athleteData: Partial<Athlete>) => {
    try {
      if (selectedAthlete?.id) {
        const updatedAthlete = await updateAthlete(selectedAthlete.id, athleteData);
        setAthletes((prev) =>
          prev.map((a) => (a.id === updatedAthlete.id ? updatedAthlete : a))
        );
      } else {
        const newAthlete = await createAthlete(athleteData as Omit<Athlete, "id" | "created_at">);
        setAthletes((prev) => [...prev, newAthlete]);
      }
    } catch (error) {
      console.error("Error saving athlete:", error);
      throw error;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedAthlete) return;
    
    try {
      await deleteAthlete(selectedAthlete.id);
      setAthletes((prev) => prev.filter((a) => a.id !== selectedAthlete.id));
      toast({
        title: "Atleta excluído",
        description: `${selectedAthlete.name} foi excluído com sucesso.`,
      });
    } catch (error) {
      console.error("Error deleting athlete:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o atleta.",
        variant: "destructive",
      });
    } finally {
      setConfirmOpen(false);
    }
  };
  
  const clearFilters = () => {
    setSearchQuery("");
    setFilterTeam("all");
  };

  return (
    <div className="mobile-container">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Users className="mr-2 h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Atletas</h1>
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredAthletes.length} atletas
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar atleta..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2.5 text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        <Select value={filterTeam} onValueChange={(value: any) => setFilterTeam(value)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Todos times" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos times</SelectItem>
            <SelectItem value="Masculino">Masculino</SelectItem>
            <SelectItem value="Feminino">Feminino</SelectItem>
          </SelectContent>
        </Select>
        
        {(searchQuery || filterTeam !== "all") && (
          <Button variant="ghost" size="icon" onClick={clearFilters}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {isLoading ? (
        <LoadingSpinner />
      ) : filteredAthletes.length === 0 ? (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">Nenhum atleta encontrado</h2>
          <p className="mt-2 text-muted-foreground">
            {searchQuery || filterTeam !== "all"
              ? "Nenhum resultado para sua busca. Tente outros filtros."
              : "Adicione seu primeiro atleta clicando no botão +"}
          </p>
          {(searchQuery || filterTeam !== "all") && (
            <Button
              variant="outline"
              onClick={clearFilters}
              className="mt-4"
            >
              Limpar filtros
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 pb-20">
          {filteredAthletes.map((athlete) => (
            <AthleteCard
              key={athlete.id}
              athlete={athlete}
              onEdit={handleEditAthlete}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}
      
      <button
        onClick={handleAddAthlete}
        className="floating-action-button"
        aria-label="Adicionar atleta"
      >
        <Plus className="h-6 w-6" />
      </button>
      
      <AthleteForm
        athlete={selectedAthlete}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSaveAthlete}
      />
      
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Excluir atleta"
        description={`Tem certeza que deseja excluir ${selectedAthlete?.name}? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
      />
    </div>
  );
};

export default Athletes;
