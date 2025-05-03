
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIsMobile } from '@/hooks/use-mobile';

interface ExerciseFormProps {
  onSubmit: (exercise: any) => void;
  exercise?: any;
  isLoading?: boolean;
}

export function ExerciseForm({ onSubmit, exercise, isLoading = false }: ExerciseFormProps) {
  const { isMobile } = useIsMobile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple form submission
    onSubmit({
      nome: "Novo Exercício",
      categoria: "Ataque",
      objetivo: "Melhorar técnica",
      descricao: "Descrição do exercício",
      tempo_estimado: 20,
      numero_jogadores: 6,
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{exercise ? 'Editar Exercício' : 'Novo Exercício'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="nome" className="block text-sm font-medium mb-1">
                Nome do Exercício
              </label>
              <Input
                id="nome"
                placeholder="Ex: Manchete em dupla"
                defaultValue={exercise?.nome || ''}
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="categoria" className="block text-sm font-medium mb-1">
                Categoria
              </label>
              <Select defaultValue={exercise?.categoria || 'ataque'} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aquecimento">Aquecimento</SelectItem>
                  <SelectItem value="ataque">Ataque</SelectItem>
                  <SelectItem value="defesa">Defesa</SelectItem>
                  <SelectItem value="levantamento">Levantamento</SelectItem>
                  <SelectItem value="bloqueio">Bloqueio</SelectItem>
                  <SelectItem value="saque">Saque</SelectItem>
                  <SelectItem value="recepção">Recepção</SelectItem>
                  <SelectItem value="jogo">Jogo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="objetivo" className="block text-sm font-medium mb-1">
              Objetivo
            </label>
            <Textarea
              id="objetivo"
              placeholder="Qual o objetivo deste exercício?"
              rows={2}
              defaultValue={exercise?.objetivo || ''}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="descricao" className="block text-sm font-medium mb-1">
              Descrição
            </label>
            <Textarea
              id="descricao"
              placeholder="Descreva detalhadamente como executar o exercício"
              rows={4}
              defaultValue={exercise?.descricao || ''}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="tempo" className="block text-sm font-medium mb-1">
                Tempo Estimado (min)
              </label>
              <Input
                id="tempo"
                type="number"
                min="1"
                defaultValue={exercise?.tempo_estimado || 15}
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="numJogadores" className="block text-sm font-medium mb-1">
                Nº de Jogadores
              </label>
              <Input
                id="numJogadores"
                type="number"
                min="1"
                defaultValue={exercise?.numero_jogadores || 6}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button type="button" variant="outline" disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {exercise ? 'Atualizar' : 'Criar'} Exercício
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default ExerciseForm;
