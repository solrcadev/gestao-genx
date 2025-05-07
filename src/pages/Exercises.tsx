import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, X } from 'lucide-react';
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
import { 
  DialogContent, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import {
  DrawerContent,
  DrawerHeader,
  DrawerTitle
} from '@/components/ui/drawer';
import { useDeviceInfo } from '@/hooks/use-mobile';

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
  const [categoryFilter, setCategoryFilter] = useState("all-categories");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const { isMobile } = useDeviceInfo();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Efeito para impedir rolagem quando o modal estiver aberto
  useEffect(() => {
    if (isDialogOpen && !isMobile) {
      document.body.style.overflow = 'hidden';
    } else if (!isDrawerOpen) {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDialogOpen, isDrawerOpen, isMobile]);

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
    
    const matchesCategory = categoryFilter === "all-categories" || 
      exercise.categoria === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Handlers
  const handleOpenForm = (exercise = null) => {
    setEditingExercise(exercise);
    if (isMobile) {
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
    <div className="container mx-auto px-4 py-6 animate-fade-in max-w-7xl">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Biblioteca de Exercícios</h1>
      
      {/* Search and filter controls */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar exercício..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-[220px] h-10">
            <SelectValue placeholder="Todas categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-categories">Todas categorias</SelectItem>
            {CATEGORIES.map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-muted-foreground">Carregando exercícios...</span>
        </div>
      ) : filteredExercises.length > 0 ? (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
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
        <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <p className="text-muted-foreground mb-4">Nenhum exercício encontrado</p>
          <Button 
            onClick={() => handleOpenForm()}
            variant="default"
            size="lg"
            className="font-medium"
          >
            <Plus className="h-5 w-5 mr-2" />
            Criar Novo Exercício
          </Button>
        </div>
      )}
      
      {/* Mobile: Drawer for exercise form */}
      <Drawer open={isDrawerOpen && isMobile} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="max-h-[90vh] h-[90vh] overflow-hidden flex flex-col">
          <DrawerHeader className="border-b sticky top-0 bg-background z-10">
            <DrawerTitle>
              {editingExercise ? 'Editar Exercício' : 'Criar Exercício'}
            </DrawerTitle>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="absolute right-4 top-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </DrawerHeader>
          <div className="p-4 pb-20 overflow-y-auto flex-grow">
            <ExerciseForm 
              exercise={editingExercise}
              onClose={handleFormClose}
              onSuccess={handleFormSubmitSuccess}
              categories={CATEGORIES}
            />
          </div>
        </DrawerContent>
      </Drawer>

      {/* Desktop: Dialog for exercise form */}
      <Dialog open={isDialogOpen && !isMobile} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl w-full max-h-[90vh] p-0 overflow-hidden flex flex-col">
          <div className="p-6 border-b sticky top-0 bg-background z-10 flex justify-between items-center">
            <DialogTitle className="text-xl">
              {editingExercise ? 'Editar Exercício' : 'Criar Exercício'}
            </DialogTitle>
            <button 
              onClick={() => setIsDialogOpen(false)}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="overflow-y-auto flex-grow p-6 pt-4">
            <ExerciseForm 
              exercise={editingExercise}
              onClose={handleFormClose}
              onSuccess={handleFormSubmitSuccess}
              categories={CATEGORIES}
            />
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Floating action button */}
      <button 
        onClick={() => handleOpenForm()}
        className="fixed right-6 bottom-6 w-14 h-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 z-10"
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
