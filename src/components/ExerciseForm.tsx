import React, { useState, useMemo, useEffect } from 'react';
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
import { useDeviceInfo } from '@/hooks/use-mobile';
import VideoEmbed from './ui/video-embed';
import { extrairYoutubeId, getVideoPlatform, extrairInstagramId } from '@/utils/video-utils';
import { createExercise, updateExercise, ExerciseInput, Exercise } from '@/services/exerciseService';
import { VideoIcon, InfoIcon } from 'lucide-react';

export interface ExerciseFormProps {
  exercise?: any;
  categories: string[];
  onSuccess: () => void;
  onClose?: () => void;
}

// Regex para validar formato de tempo (MM:SS ou HH:MM:SS)
const tempoRegex = /^(?:(?:([01]?\d|2[0-3]):)?([0-5]?\d):)?([0-5]?\d)$/;

const schema = z.object({
  nome: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres' }),
  descricao: z.string().min(10, { message: 'A descrição deve ter pelo menos 10 caracteres' }),
  categoria: z.string().min(1, { message: 'Selecione uma categoria' }),
  objetivo: z.string().min(5, { message: 'O objetivo deve ter pelo menos 5 caracteres' }),
  numero_jogadores: z.number().min(1, { message: 'Informe o número mínimo de jogadores' }),
  tempo_estimado: z.number().min(1, { message: 'Informe o tempo estimado em minutos' }),
  imagem_url: z.string().optional(),
  video_url: z.string().optional(),
  video_inicio: z.string()
    .regex(tempoRegex, { message: 'Formato inválido. Use MM:SS ou HH:MM:SS' })
    .optional()
    .or(z.literal('')),
  video_fim: z.string()
    .regex(tempoRegex, { message: 'Formato inválido. Use MM:SS ou HH:MM:SS' })
    .optional()
    .or(z.literal(''))
});

const ExerciseForm: React.FC<ExerciseFormProps> = ({ exercise, categories, onSuccess, onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewURL, setPreviewURL] = useState<string | null>(exercise?.video_url || null);
  const { isMobile } = useDeviceInfo();

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
      video_url: exercise.video_url || '',
      video_inicio: exercise.video_inicio || '',
      video_fim: exercise.video_fim || ''
    } : {
      nome: '',
      descricao: '',
      categoria: '',
      objetivo: '',
      numero_jogadores: 1,
      tempo_estimado: 5,
      imagem_url: '',
      video_url: '',
      video_inicio: '',
      video_fim: ''
    }
  });

  // Form submission handler
  const onSubmit = async (values: z.infer<typeof schema>) => {
    setIsSubmitting(true);
    try {
      // Determinar se é necessário incluir os parâmetros de tempo do vídeo
      const platform = values.video_url ? getVideoPlatform(values.video_url) : 'outro';
      const isYoutube = platform === 'youtube';

      // Dados comuns para ambas as operações
      const exerciseData = {
        nome: values.nome,
        descricao: values.descricao,
        categoria: values.categoria,
        objetivo: values.objetivo,
        numero_jogadores: values.numero_jogadores,
        tempo_estimado: values.tempo_estimado,
        imagem_url: values.imagem_url || undefined,
        video_url: values.video_url || undefined,
        // Apenas incluir parâmetros de tempo se for YouTube
        ...(isYoutube ? {
          video_inicio: values.video_inicio || undefined,
          video_fim: values.video_fim || undefined
        } : {
          video_inicio: undefined,
          video_fim: undefined
        })
      };

      if (exercise) {
        // Atualizar exercício existente
        await updateExercise({
          id: exercise.id,
          ...exerciseData
        } as Exercise);
        
        toast({
          title: "Exercício atualizado!",
          description: `O exercício "${values.nome}" foi atualizado com sucesso.`
        });
      } else {
        // Criar novo exercício
        await createExercise(exerciseData as ExerciseInput);
        
        toast({
          title: "Exercício criado!",
          description: `O exercício "${values.nome}" foi criado com sucesso.`
        });
      }
      
      // Chamar callback de sucesso para atualizar a lista
      onSuccess();
      if (onClose) onClose();
    } catch (error) {
      console.error("Error saving exercise:", error);
      toast({
        title: "Erro ao salvar exercício",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao tentar salvar o exercício. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para atualizar o preview quando o URL do vídeo muda
  const handleVideoURLChange = (url: string) => {
    // Se a URL estiver vazia, não tente processar
    if (!url || url.trim() === '') {
      setPreviewURL(null);
      return;
    }
    
    try {
      const platform = getVideoPlatform(url);
      
      if (platform === 'youtube' && extrairYoutubeId(url)) {
        setPreviewURL(url);
      } else if (platform === 'instagram' && extrairInstagramId(url)) {
        setPreviewURL(url);
      } else {
        setPreviewURL(null);
      }
    } catch (error) {
      console.error("Erro ao processar URL do vídeo:", error);
      setPreviewURL(null);
    }
  };

  // Watch video_url para atualizar preview
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'video_url') {
        handleVideoURLChange(value.video_url || '');
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Determinar a plataforma do vídeo para mostrar texto adequado
  const videoPlatform = useMemo(() => {
    return previewURL ? getVideoPlatform(previewURL) : null;
  }, [previewURL]);
  
  const isYoutube = videoPlatform === 'youtube';
  const isInstagram = videoPlatform === 'instagram';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Seção de informações básicas */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary pb-1 border-b mb-2">
            <InfoIcon className="h-5 w-5" />
            <h3 className="font-semibold">Informações Básicas</h3>
          </div>
        
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Exercício</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Treino de Recepção" {...field} className="h-10" />
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
                    <SelectTrigger className="h-10">
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
                    className="min-h-[120px] resize-y"
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
                  <Input placeholder="Ex: Melhorar a recepção de saque" {...field} className="h-10" />
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
                      className="h-10"
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
                      className="h-10"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 5)} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Seção de mídia */}
        <div className="space-y-4 pt-2 form-media-section mb-6">
          <div className="flex items-center gap-2 text-primary pb-1 border-b mb-2">
            <VideoIcon className="h-5 w-5" />
            <h3 className="font-semibold">Mídia e Vídeo</h3>
          </div>

          <FormField
            control={form.control}
            name="imagem_url"
            render={({ field }) => (
              <FormItem className="form-item mb-4">
                <FormLabel className="font-medium">URL da Imagem (opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="URL da imagem ilustrativa" {...field} className="h-10 bg-background" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="p-4 border rounded-lg border-dashed mb-4 bg-background/50">
            <h4 className="text-sm font-medium mb-3">Vídeo do YouTube ou Instagram</h4>
            <FormField
              control={form.control}
              name="video_url"
              render={({ field }) => (
                <FormItem className="form-item mb-4">
                  <FormLabel className="font-medium">URL do Vídeo (opcional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="URL do vídeo do YouTube ou post do Instagram" 
                      className="h-10 bg-background"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campos para recorte de vídeo - apenas mostrar se for YouTube */}
            {(isYoutube || !videoPlatform) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <FormField
                  control={form.control}
                  name="video_inicio"
                  render={({ field }) => (
                    <FormItem className="form-item">
                      <FormLabel className="font-medium">Início do Exercício</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="MM:SS ou HH:MM:SS" 
                          className="h-10 bg-background"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="video_fim"
                  render={({ field }) => (
                    <FormItem className="form-item">
                      <FormLabel className="font-medium">Fim do Exercício</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="MM:SS ou HH:MM:SS" 
                          className="h-10 bg-background"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            
            {isInstagram && (
              <div className="mt-4 p-3 bg-pink-50 dark:bg-pink-900/20 rounded-md">
                <p className="text-xs text-pink-700 dark:text-pink-300">
                  Vídeo do Instagram detectado. Os parâmetros de início e fim não estão disponíveis para conteúdo do Instagram.
                </p>
              </div>
            )}
          </div>

          {/* Preview do vídeo */}
          {previewURL && (
            <div className="mt-5 overflow-hidden rounded-lg shadow-md">
              <div className="bg-slate-100 dark:bg-slate-800 p-3 flex items-center justify-between">
                <h3 className="text-sm font-medium">Preview do Vídeo</h3>
                {isYoutube && (form.watch('video_inicio') || form.watch('video_fim')) && (
                  <div className="text-xs px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 rounded-full">
                    Recorte aplicado
                  </div>
                )}
                {isInstagram && (
                  <div className="text-xs px-2 py-1 bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100 rounded-full">
                    Instagram
                  </div>
                )}
              </div>
              
              {/* O container do vídeo precisa de altura fixa para evitar layout shifts */}
              <div 
                className={`${isYoutube ? 'video-container' : 'min-h-[300px] max-h-[500px] relative'}`}
                style={{ maxHeight: isInstagram ? '500px' : undefined }}
              >
                <SafeVideoPreview
                  videoUrl={previewURL}
                  inicio={isYoutube ? form.watch('video_inicio') : undefined}
                  fim={isYoutube ? form.watch('video_fim') : undefined}
                />
              </div>
            </div>
          )}
        </div>

        <div className="pt-6 flex justify-end space-x-3 border-t mt-6 sticky bottom-0 bg-background pb-4">
          {onClose && (
            <Button type="button" variant="outline" size="lg" onClick={onClose}>
              Cancelar
            </Button>
          )}
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting && <LoadingSpinner className="mr-2" />}
            {exercise ? 'Atualizar Exercício' : 'Criar Exercício'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

// Componente de segurança para renderizar o preview do vídeo
const SafeVideoPreview: React.FC<{ videoUrl: string; inicio?: string; fim?: string }> = ({
  videoUrl,
  inicio,
  fim
}) => {
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    // Resetar o estado de erro quando a URL muda
    setHasError(false);
  }, [videoUrl]);
  
  if (hasError) {
    return (
      <div className="p-4 flex items-center justify-center h-[200px] bg-gray-50 dark:bg-gray-800">
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          Não foi possível exibir o preview do vídeo. Verifique a URL inserida.
        </p>
      </div>
    );
  }
  
  try {
    return (
      <VideoEmbed 
        videoUrl={videoUrl} 
        inicio={inicio} 
        fim={fim} 
      />
    );
  } catch (error) {
    console.error("Erro ao renderizar preview do vídeo:", error);
    setHasError(true);
    return null;
  }
};

export default ExerciseForm;
