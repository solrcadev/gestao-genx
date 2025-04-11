
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Plus, CalendarDays, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import { fetchTrainings } from '@/services/trainingService';

const Trainings = () => {
  const navigate = useNavigate();
  const { data: trainings = [], isLoading } = useQuery({
    queryKey: ['trainings'],
    queryFn: fetchTrainings
  });
  
  return (
    <div className="mobile-container pb-16">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <CalendarDays className="mr-2 h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Treinos</h1>
        </div>
        <Button 
          onClick={() => navigate('/montar-treino')}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Treino
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner />
        </div>
      ) : trainings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Calendar className="h-16 w-16 text-muted mb-4" />
          <h2 className="text-xl font-semibold mb-2">Nenhum treino encontrado</h2>
          <p className="text-muted-foreground max-w-xs mb-6">
            Você ainda não criou nenhum treino. Crie seu primeiro treino agora!
          </p>
          <Button 
            onClick={() => navigate('/montar-treino')}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Criar Treino
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 animate-fade-in">
          {trainings.map(training => (
            <Card 
              key={training.id} 
              className="overflow-hidden hover:border-primary/50 transition-all duration-200"
              onClick={() => navigate(`/treinos/${training.id}`)}
            >
              <CardContent className="p-4">
                <h3 className="font-bold text-lg">{training.nome}</h3>
                
                <div className="flex flex-col gap-1 mt-2 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    <span>{format(new Date(training.data), 'PPP', { locale: ptBR })}</span>
                  </div>
                  
                  {training.local && (
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="mr-2 h-4 w-4" />
                      <span>{training.local}</span>
                    </div>
                  )}
                </div>
                
                {training.descricao && (
                  <p className="text-sm mt-3 text-muted-foreground line-clamp-2">
                    {training.descricao}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <Button 
        onClick={() => navigate('/montar-treino')}
        className="fixed bottom-20 right-4 rounded-full w-14 h-14 shadow-lg flex items-center justify-center"
        aria-label="Criar Treino"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
};

export default Trainings;
