
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import AthleteForm from '@/components/AthleteForm';
import PageTitle from '@/components/PageTitle';

const CreateAthlete = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (formData: any) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('athletes')
        .insert([formData])
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Atleta criado",
        description: `${formData.nome} foi adicionado com sucesso!`,
      });
      
      navigate("/athletes");
    } catch (error) {
      console.error("Erro ao criar atleta:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o atleta",
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
      <PageTitle>Adicionar Novo Atleta</PageTitle>
      <AthleteForm onSubmit={handleSubmit} />
    </div>
  );
};

export default CreateAthlete;
