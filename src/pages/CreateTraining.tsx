
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LoadingSpinner from '@/components/LoadingSpinner';
import PageTitle from '@/components/PageTitle';

const CreateTraining = () => {
  const [formData, setFormData] = useState({
    nome: '',
    data: '',
    local: '',
    time: 'Masculino',
    descricao: '',
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

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
      
      const { data, error } = await supabase
        .from('treinos')
        .insert([formData])
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Treino criado",
        description: `${formData.nome} foi adicionado com sucesso!`,
      });
      
      navigate("/trainings");
    } catch (error) {
      console.error("Erro ao criar treino:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o treino",
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
      <PageTitle>Criar Novo Treino</PageTitle>
      
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
              <Button type="submit">Criar Treino</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateTraining;
