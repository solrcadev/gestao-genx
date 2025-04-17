
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import AthleteForm from '@/components/AthleteForm';
import PageTitle from '@/components/PageTitle';
import { Athlete } from '@/types';

const EditAthlete = () => {
  const { id } = useParams<{ id: string }>();
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAthlete = async () => {
      try {
        if (!id) return;
        
        const { data, error } = await supabase
          .from('athletes')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          throw error;
        }
        
        setAthlete(data);
      } catch (error) {
        console.error("Erro ao buscar atleta:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do atleta",
          variant: "destructive",
        });
        navigate("/athletes");
      } finally {
        setLoading(false);
      }
    };
    
    fetchAthlete();
  }, [id, navigate, toast]);

  const handleSubmit = async (formData: any) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('athletes')
        .update(formData)
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Atleta atualizado",
        description: `${formData.nome} foi atualizado com sucesso!`,
      });
      
      navigate("/athletes");
    } catch (error) {
      console.error("Erro ao atualizar atleta:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o atleta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!athlete) {
    return (
      <div className="container mx-auto px-4 py-6">
        <p>Atleta não encontrado</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 pb-20">
      <PageTitle>Editar Atleta</PageTitle>
      <AthleteForm initialData={athlete} onSubmit={handleSubmit} />
    </div>
  );
};

export default EditAthlete;
