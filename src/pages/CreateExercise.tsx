
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import ExerciseForm from '@/components/ExerciseForm';
import PageTitle from '@/components/PageTitle';

const CreateExercise = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (formData: any) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('exercicios')
        .insert([formData])
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Exercício criado",
        description: `${formData.nome} foi adicionado com sucesso!`,
      });
      
      navigate("/exercises");
    } catch (error) {
      console.error("Erro ao criar exercício:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o exercício",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto px-4 py-6 pb-20">
      <PageTitle>Adicionar Novo Exercício</PageTitle>
      <ExerciseForm onSubmit={handleSubmit} />
    </div>
  );
};

export default CreateExercise;
