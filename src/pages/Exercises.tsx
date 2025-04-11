
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter } from 'lucide-react';
import { Drawer } from '@/components/ui/drawer';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import ExerciseCard from '@/components/ExerciseCard';
import ExerciseForm from '@/components/ExerciseForm';
import ConfirmDialog from '@/components/ConfirmDialog';
import { fetchExercises, deleteExercise } from '@/services/exerciseService';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Categories for exercises
const CATEGORIES = [
  "Aquecimento",
  "Defesa",
  "Ataque",
  "Técnica",
  "Tática",
  "Condicionamento",
  "Jogo",
  "Outro"
];

const ExercisesPage = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Track window size for responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch exercises
  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ['exercises'],
    queryFn: fetchExercises
  });

  // Delete exercise mutation
  const deleteMutation = useMutation({
    mutationFn: deleteExercise,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      setConfirmOpen(false);
      toast({
        title: "Exercício excluído",
        description: `${selectedExercise?.nome} foi excluído com sucesso.`,
      });
    },
    onError: (error) => {
      console.error("Error deleting exercise:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o exercício. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Filter exercises
  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = searchQuery === "" || 
      exercise.nome.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === "" || 
      exercise.categoria === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Handlers
  const handleOpenForm = (exercise = null) => {
    setEditingExercise(exercise);
    if (isMobileView) {
      setIsDrawerOpen(true);
    } else {
      setIsDialogOpen(true);
    }
  };

  const handleDelete = (exercise) => {
    setSelectedExercise(exercise);
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedExercise) {
      deleteMutation.mutate(selectedExercise.id);
    }
  };

  const handleFormClose = () => {
    setEditingExercise(null);
    setIsDrawerOpen(false);
    setIsDialogOpen(false);
  };

  const handleFormSubmitSuccess = () => {
    setEditingExercise(null);
    setIsDrawerOpen(false);
    setIsDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['exercises'] });
  };

  return (
    <div className="mobile-container animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Biblioteca de Exercícios</h1>
      
      {/* Search and filter controls */}
      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar exercício..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Todas categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas categorias</SelectItem>
            {CATEGORIES.map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner />
        </div>
      ) : filteredExercises.length > 0 ? (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredExercises.map(exercise => (
            <ExerciseCard 
              key={exercise.id} 
              exercise={exercise}
              onEdit={() => handleOpenForm(exercise)}
              onDelete={() => handleDelete(exercise)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-muted-foreground mb-2">Nenhum exercício encontrado</p>
          <Button 
            onClick={() => handleOpenForm()}
            variant="outline"
          >
            Criar exercício
          </Button>
        </div>
      )}
      
      {/* Mobile: Drawer for exercise form */}
      <Drawer open={isDrawerOpen && isMobileView} onOpenChange={setIsDrawerOpen}>
        <Drawer.Content className="p-4 pt-8 max-h-dvh">
          <ExerciseForm 
            exercise={editingExercise}
            onClose={handleFormClose}
            onSuccess={handleFormSubmitSuccess}
            categories={CATEGORIES}
          />
        </Drawer.Content>
      </Drawer>

      {/* Desktop: Dialog for exercise form */}
      <Dialog open={isDialogOpen && !isMobileView} onOpenChange={setIsDialogOpen}>
        <Dialog.Content className="max-w-2xl overflow-y-auto max-h-[90vh]">
          <ExerciseForm 
            exercise={editingExercise}
            onClose={handleFormClose}
            onSuccess={handleFormSubmitSuccess}
            categories={CATEGORIES}
          />
        </Dialog.Content>
      </Dialog>
      
      {/* Floating action button */}
      <button 
        onClick={() => handleOpenForm()}
        className="floating-action-button"
        aria-label="Adicionar exercício"
      >
        <Plus className="h-6 w-6" />
      </button>
      
      {/* Confirm dialog */}
      <ConfirmDialog 
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Excluir exercício"
        description={`Tem certeza que deseja excluir ${selectedExercise?.nome}? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
      />
    </div>
  );
};

export default ExercisesPage;
