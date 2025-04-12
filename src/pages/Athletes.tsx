import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Athlete, Team } from "@/types";
import { getAthletes, createAthlete, updateAthlete, deleteAthlete } from "@/services/athleteService";
import AthleteCard from "@/components/AthleteCard";
import AthleteForm from "@/components/AthleteForm";
import ConfirmDialog from "@/components/ConfirmDialog";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Plus, Search, X, Users, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Transition, TransitionList } from "@/components/ui/transition";
import { CardSkeleton } from "@/components/ui/skeleton";
import { useBreakpoint } from "@/lib/responsive";
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
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();
  const breakpoint = useBreakpoint();

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
        athlete.nome.toLowerCase().includes(query)
      );
    }
    
    if (filterTeam && filterTeam !== "all") {
      filtered = filtered.filter((athlete) => athlete.time === filterTeam);
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

  const handleDeleteConfirm = async () => {
    if (!selectedAthlete) return;
    
    try {
      await deleteAthlete(selectedAthlete.id);
      
      setAthletes((prev) => 
        prev.filter((athlete) => athlete.id !== selectedAthlete.id)
      );
      
      toast({
        title: "Atleta excluído",
        description: "O atleta foi excluído com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o atleta.",
        variant: "destructive",
      });
    } finally {
      setConfirmOpen(false);
    }
  };

  const handleSaveAthlete = async (data: Omit<Athlete, "id">) => {
    try {
      if (selectedAthlete) {
        // Update
        const updatedAthlete = await updateAthlete(selectedAthlete.id, data);
        setAthletes((prev) =>
          prev.map((athlete) =>
            athlete.id === selectedAthlete.id ? updatedAthlete : athlete
          )
        );
        
        toast({
          title: "Atleta atualizado",
          description: "Os dados do atleta foram atualizados com sucesso."
        });
      } else {
        // Create
        const newAthlete = await createAthlete(data);
        setAthletes((prev) => [...prev, newAthlete]);
        
        toast({
          title: "Atleta adicionado",
          description: "O novo atleta foi adicionado com sucesso."
        });
      }
      
      setFormOpen(false);
    } catch (error) {
      console.error("Error saving athlete:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar os dados do atleta.",
        variant: "destructive",
      });
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilterTeam("all");
    setShowFilters(false);
  };

  // Loading skeletons
  const renderSkeletons = () => {
    const count = breakpoint === 'xs' || breakpoint === 'sm' ? 3 : 6;
    return Array(count).fill(0).map((_, i) => (
      <CardSkeleton key={i} />
    ));
  };

  return (
    <div className="container-md animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="title-responsive">Atletas</h1>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => setShowFilters(!showFilters)}
          className="transition-all"
        >
          <Filter className={`h-5 w-5 ${showFilters ? 'text-primary' : 'text-muted-foreground'}`} />
        </Button>
      </div>

      <Transition type={showFilters ? "slide" : "none"}>
        <div className={`space-y-4 mb-6 ${showFilters ? '' : 'hidden'}`}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9 pr-9"
              placeholder="Buscar atleta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <X 
                className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer" 
                onClick={() => setSearchQuery("")}
              />
            )}
          </div>
          
          <Select value={filterTeam} onValueChange={(value: Team | "all") => setFilterTeam(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os times</SelectItem>
              <SelectItem value="Masculino">Masculino</SelectItem>
              <SelectItem value="Feminino">Feminino</SelectItem>
            </SelectContent>
          </Select>
          
          {(searchQuery || filterTeam !== "all") && (
            <Button
              variant="outline"
              onClick={clearFilters}
              className="w-full"
            >
              <X className="mr-2 h-4 w-4" />
              Limpar filtros
            </Button>
          )}
        </div>
      </Transition>

      {isLoading ? (
        <div className="space-y-4 pb-20">
          {renderSkeletons()}
        </div>
      ) : filteredAthletes.length === 0 ? (
        <Transition type="scale">
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
        </Transition>
      ) : (
        <TransitionList className="grid gap-4 pb-20" type="slide">
          {filteredAthletes.map((athlete, index) => (
            <AthleteCard
              key={athlete.id}
              athlete={athlete}
              onEdit={handleEditAthlete}
              onDelete={handleDeleteClick}
              index={index}
            />
          ))}
        </TransitionList>
      )}
      
      <button
        onClick={handleAddAthlete}
        className="floating-action-button touch-feedback animate-scale-in"
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
        description={`Tem certeza que deseja excluir ${selectedAthlete?.nome}? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
      />
    </div>
  );
};

export default Athletes;
