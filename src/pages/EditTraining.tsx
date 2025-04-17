
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LoadingSpinner from '@/components/LoadingSpinner';
import PageTitle from '@/components/PageTitle';
import { Training } from '@/types';

const EditTraining = () => {
  const { id } = useParams<{ id: string }>();
  const [training, setTraining] = useState<Training | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    data: '',
    local: '',
    time: 'Masculino',
    descricao: '',
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTraining = async () => {
      try {
        if (!id) return;
        
        const { data, error } = await supabase
          .from('treinos')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          throw error;
        }
        
        setTraining(data);
        setFormData({
          nome: data.nome || '',
          data: data.data || '',
          local: data.local || '',
          time: data.time || 'Masculino',
          descricao: data.descricao || '',
        });
      } catch (error) {
        console.error("Erro ao buscar treino:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do treino",
          variant: "destructive",
        });
        navigate("/trainings");
      } finally {
        setLoading(false);
      }
    };
    
    fetchTraining();
  }, [id, navigate, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('treinos')
        .update(formData)
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Treino atualizado",
        description: `${formData.nome} foi atualizado com sucesso!`,
      });
      
      navigate("/trainings");
    } catch (error) {
      console.error("Erro ao atualizar treino:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o treino",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!training) {
    return (
      <div className="container mx-auto px-4 py-6">
        <p>Treino não encontrado</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 pb-20">
      <PageTitle>Editar Treino</PageTitle>
      
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="nome" className="text-sm font-medium">
                Nome do Treino
              </label>
              <Input
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="data" className="text-sm font-medium">
                Data
              </label>
              <Input
                id="data"
                name="data"
                type="date"
                value={formData.data}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="local" className="text-sm font-medium">
                Local
              </label>
              <Input
                id="local"
                name="local"
                value={formData.local}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="time" className="text-sm font-medium">
                Time
              </label>
              <Select
                value={formData.time}
                onValueChange={(value) => handleSelectChange('time', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Masculino">Masculino</SelectItem>
                  <SelectItem value="Feminino">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="descricao" className="text-sm font-medium">
                Descrição
              </label>
              <Textarea
                id="descricao"
                name="descricao"
                value={formData.descricao || ''}
                onChange={handleChange}
                rows={3}
              />
            </div>
            
            <div className="flex justify-end pt-4">
              <Button type="submit">Atualizar Treino</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditTraining;
