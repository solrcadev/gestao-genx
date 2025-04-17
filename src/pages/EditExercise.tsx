
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import ExerciseForm from '@/components/ExerciseForm';
import PageTitle from '@/components/PageTitle';

interface Exercise {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  objetivo: string;
  tempo_estimado: number;
  numero_jogadores: number;
  video_url?: string;
  imagem_url?: string;
}

const EditExercise = () => {
  const { id } = useParams<{ id: string }>();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExercise = async () => {
      try {
        if (!id) return;
        
        const { data, error } = await supabase
          .from('exercicios')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          throw error;
        }
        
        setExercise(data);
      } catch (error) {
        console.error("Erro ao buscar exercício:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do exercício",
          variant: "destructive",
        });
        navigate("/exercises");
      } finally {
        setLoading(false);
      }
    };
    
    fetchExercise();
  }, [id, navigate, toast]);

  const handleSubmit = async (formData: any) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('exercicios')
        .update(formData)
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Exercício atualizado",
        description: `${formData.nome} foi atualizado com sucesso!`,
      });
      
      navigate("/exercises");
    } catch (error) {
      console.error("Erro ao atualizar exercício:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o exercício",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!exercise) {
    return (
      <div className="container mx-auto px-4 py-6">
        <p>Exercício não encontrado</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 pb-20">
      <PageTitle>Editar Exercício</PageTitle>
      <ExerciseForm initialData={exercise} onSubmit={handleSubmit} />
    </div>
  );
};

export default EditExercise;
