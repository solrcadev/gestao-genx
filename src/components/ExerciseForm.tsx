
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from "@/components/ui/use-toast";
import LoadingSpinner from './LoadingSpinner';
import { useIsMobile } from '@/hooks/use-mobile';

export interface ExerciseFormProps {
  exercise?: any;
  categories: string[];
  onSuccess: () => void;
  onClose?: () => void;
}

const schema = z.object({
  nome: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres' }),
  descricao: z.string().min(10, { message: 'A descrição deve ter pelo menos 10 caracteres' }),
  categoria: z.string().min(1, { message: 'Selecione uma categoria' }),
  objetivo: z.string().min(5, { message: 'O objetivo deve ter pelo menos 5 caracteres' }),
  numero_jogadores: z.number().min(1, { message: 'Informe o número mínimo de jogadores' }),
  tempo_estimado: z.number().min(1, { message: 'Informe o tempo estimado em minutos' }),
  imagem_url: z.string().optional(),
  video_url: z.string().optional()
});

const ExerciseForm: React.FC<ExerciseFormProps> = ({ exercise, categories, onSuccess, onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isMobile } = useIsMobile();

  // Setup form with default values from exercise prop if available
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: exercise ? {
      nome: exercise.nome || '',
      descricao: exercise.descricao || '',
      categoria: exercise.categoria || '',
      objetivo: exercise.objetivo || '',
      numero_jogadores: exercise.numero_jogadores || 1,
      tempo_estimado: exercise.tempo_estimado || 5,
      imagem_url: exercise.imagem_url || '',
      video_url: exercise.video_url || ''
    } : {
      nome: '',
      descricao: '',
      categoria: '',
      objetivo: '',
      numero_jogadores: 1,
      tempo_estimado: 5,
      imagem_url: '',
      video_url: ''
    }
  });

  // Form submission handler
  const onSubmit = async (values: z.infer<typeof schema>) => {
    setIsSubmitting(true);
    try {
      // Placeholder for API call
      console.log("Form values:", values);
      
      // Just simulate an API call for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: exercise ? "Exercício atualizado!" : "Exercício criado!",
        description: `O exercício "${values.nome}" foi ${exercise ? 'atualizado' : 'criado'} com sucesso.`
      });
      
      onSuccess();
      if (onClose) onClose();
    } catch (error) {
      console.error("Error saving exercise:", error);
      toast({
        title: "Erro ao salvar exercício",
        description: "Ocorreu um erro ao tentar salvar o exercício. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Exercício</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Treino de Recepção" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="categoria"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Descreva detalhadamente como o exercício deve ser realizado" 
                  className="min-h-[120px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="objetivo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Objetivo</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Melhorar a recepção de saque" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="numero_jogadores"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Jogadores</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min={1}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tempo_estimado"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tempo Estimado (min)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min={1}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 5)} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="imagem_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL da Imagem (opcional)</FormLabel>
              <FormControl>
                <Input placeholder="URL da imagem ilustrativa" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="video_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL do Vídeo (opcional)</FormLabel>
              <FormControl>
                <Input placeholder="URL do vídeo demonstrativo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="pt-4 flex justify-end space-x-2">
          {onClose && (
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <LoadingSpinner className="mr-2" />}
            {exercise ? 'Atualizar Exercício' : 'Criar Exercício'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ExerciseForm;
