
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { createExercise, updateExercise, Exercise, ExerciseInput } from '@/services/exerciseService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Loader2, Upload } from 'lucide-react';

// Define schema for form validation
const exerciseSchema = z.object({
  nome: z.string().min(3, { message: 'Nome deve ter pelo menos 3 caracteres' }),
  categoria: z.string().min(1, { message: 'Selecione uma categoria' }),
  tempo_estimado: z.coerce.number().positive({ message: 'Tempo deve ser maior que 0' }),
  numero_jogadores: z.coerce.number().positive({ message: 'Número de jogadores deve ser maior que 0' }),
  objetivo: z.string().min(10, { message: 'Objetivo deve ter pelo menos 10 caracteres' }),
  descricao: z.string().min(10, { message: 'Descrição deve ter pelo menos 10 caracteres' }),
  video_url: z.string().url({ message: 'URL inválida' }).optional().or(z.literal('')),
});

interface ExerciseFormProps {
  exercise?: Exercise | null;
  onClose: () => void;
  onSuccess: () => void;
  categories: string[];
}

const ExerciseForm = ({ exercise, onClose, onSuccess, categories }: ExerciseFormProps) => {
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(exercise?.imagem_url || null);
  const [isUploading, setIsUploading] = React.useState(false);
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const isEditMode = !!exercise;

  // Set up form with react-hook-form and zod validation
  const form = useForm<z.infer<typeof exerciseSchema>>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: {
      nome: exercise?.nome || '',
      categoria: exercise?.categoria || '',
      tempo_estimado: exercise?.tempo_estimado || 30,
      numero_jogadores: exercise?.numero_jogadores || 6,
      objetivo: exercise?.objetivo || '',
      descricao: exercise?.descricao || '',
      video_url: exercise?.video_url || '',
    },
  });
  
  const { isSubmitting } = form.formState;

  // Handle image upload
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Upload image to Supabase Storage
  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) {
      return exercise?.imagem_url || null;
    }

    setIsUploading(true);

    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `exercicios/${fileName}`;

      const { error, data } = await supabase.storage
        .from('exercicios')
        .upload(filePath, imageFile);

      if (error) {
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('exercicios')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Erro ao fazer upload da imagem',
        description: 'Não foi possível fazer o upload da imagem. O exercício será salvo sem imagem.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Create exercise mutation
  const createMutation = useMutation({
    mutationFn: createExercise,
    onSuccess: () => {
      toast({
        title: 'Exercício criado',
        description: 'O exercício foi criado com sucesso!',
      });
      onSuccess();
    },
    onError: (error) => {
      console.error('Error creating exercise:', error);
      toast({
        title: 'Erro ao criar',
        description: 'Não foi possível criar o exercício. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  // Update exercise mutation
  const updateMutation = useMutation({
    mutationFn: updateExercise,
    onSuccess: () => {
      toast({
        title: 'Exercício atualizado',
        description: 'O exercício foi atualizado com sucesso!',
      });
      onSuccess();
    },
    onError: (error) => {
      console.error('Error updating exercise:', error);
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar o exercício. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof exerciseSchema>) => {
    try {
      // Upload image if there is a new one
      const imageUrl = await uploadImage();
      
      // Create a complete object with all required fields to satisfy TypeScript
      const exerciseData = {
        ...values,
        imagem_url: imageUrl,
      };

      if (isEditMode && exercise) {
        await updateMutation.mutateAsync({
          id: exercise.id,
          nome: exerciseData.nome,
          categoria: exerciseData.categoria,
          tempo_estimado: exerciseData.tempo_estimado,
          numero_jogadores: exerciseData.numero_jogadores,
          objetivo: exerciseData.objetivo,
          descricao: exerciseData.descricao,
          video_url: exerciseData.video_url,
          imagem_url: exerciseData.imagem_url,
        });
      } else {
        await createMutation.mutateAsync({
          nome: exerciseData.nome,
          categoria: exerciseData.categoria,
          tempo_estimado: exerciseData.tempo_estimado,
          numero_jogadores: exerciseData.numero_jogadores,
          objetivo: exerciseData.objetivo,
          descricao: exerciseData.descricao,
          video_url: exerciseData.video_url,
          imagem_url: exerciseData.imagem_url,
        });
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <Form {...form}>
      <h2 className="text-xl font-bold mb-4">
        {isEditMode ? 'Editar Exercício' : 'Novo Exercício'}
      </h2>
      
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Image upload preview */}
        <div className="mb-4">
          <FormLabel>Imagem (opcional)</FormLabel>
          <div className="mt-2">
            {imagePreview ? (
              <div className="relative w-full h-40 mb-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover rounded-md"
                />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-2 right-2 bg-black/70 rounded-full p-1 text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-muted rounded-md p-6 text-center cursor-pointer hover:border-muted-foreground transition-colors"
              >
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Clique para fazer upload de uma imagem</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Nome */}
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Digite o nome do exercício" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Categoria */}
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
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tempo e Número de Jogadores */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="tempo_estimado"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tempo (minutos)</FormLabel>
                <FormControl>
                  <Input type="number" min="1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="numero_jogadores"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Jogadores</FormLabel>
                <FormControl>
                  <Input type="number" min="1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Objetivo */}
        <FormField
          control={form.control}
          name="objetivo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Objetivo</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva o objetivo deste exercício..."
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Descrição */}
        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva como realizar este exercício..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* URL do Vídeo */}
        <FormField
          control={form.control}
          name="video_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL do Vídeo (opcional)</FormLabel>
              <FormControl>
                <Input placeholder="https://youtube.com/..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Form actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting || isUploading}>
            {(isSubmitting || isUploading) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isEditMode ? 'Atualizar' : 'Criar'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ExerciseForm;
