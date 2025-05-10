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
import { 
  createExercise, 
  updateExercise, 
  ExerciseInput, 
  Exercise, 
  getFundamentosTecnicos, 
  getNiveisDificuldade,
  uploadExerciseImage,
  deleteExerciseImage
} from '@/services/exerciseService';
import { VideoIcon, InfoIcon, Tag, CheckCircle, BarChart2, Image as ImageIcon, UploadCloud, X, Youtube, Instagram } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

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
    .or(z.literal('')),
  fundamentos: z.array(z.string()).optional(),
  dificuldade: z.string().optional(),
  checklist_tecnico: z.array(z.string()).optional()
});

const ExerciseForm: React.FC<ExerciseFormProps> = ({ exercise, categories, onSuccess, onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewURL, setPreviewURL] = useState<string | null>(exercise?.video_url || null);
  const { isMobile } = useDeviceInfo();
  
  // Estado para gerenciar o upload de imagem
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(exercise?.imagem_url || null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(exercise?.imagem_url || null);
  
  // Lista de fundamentos técnicos disponíveis
  const fundamentos = getFundamentosTecnicos();
  // Lista de níveis de dificuldade
  const niveisDificuldade = getNiveisDificuldade();

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
      video_fim: exercise.video_fim || '',
      fundamentos: exercise.fundamentos || [],
      dificuldade: exercise.dificuldade || 'Intermediário',
      checklist_tecnico: exercise.checklist_tecnico || []
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
      video_fim: '',
      fundamentos: [],
      dificuldade: 'Intermediário',
      checklist_tecnico: []
    }
  });

  // Função para lidar com a seleção de arquivo de imagem
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Verificar o tipo do arquivo
    const validImageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      toast({
        title: "Formato inválido",
        description: "Por favor, selecione uma imagem nos formatos JPG, PNG, GIF ou WebP.",
        variant: "destructive"
      });
      return;
    }
    
    // Verificar o tamanho do arquivo (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo permitido é de 2MB.",
        variant: "destructive"
      });
      return;
    }
    
    // Criar um preview da imagem
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImagePreview(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
    
    // Guardar o arquivo para upload posterior
    setImageFile(file);
  };
  
  // Função para remover a imagem selecionada/existente
  const handleRemoveImage = async () => {
    // Se existir uma imagem original e estamos no modo de edição
    if (originalImageUrl && exercise) {
      try {
        setIsUploading(true);
        
        // Tentar excluir a imagem do Storage
        const deleted = await deleteExerciseImage(originalImageUrl);
        
        if (deleted) {
          toast({
            title: "Imagem removida",
            description: "A imagem foi removida com sucesso."
          });
        } else {
          // Mesmo se a exclusão falhar, permitimos limpar o valor no formulário
          toast({
            title: "Atenção",
            description: "A imagem foi desassociada do exercício, mas pode não ter sido removida do armazenamento.",
            variant: "default"
          });
        }
      } catch (error) {
        console.error("Erro ao remover imagem:", error);
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao remover a imagem. Tente novamente.",
          variant: "destructive"
        });
      } finally {
        setIsUploading(false);
      }
    }
    
    // Limpar todos os estados relacionados à imagem
    setImageFile(null);
    setImagePreview(null);
    setOriginalImageUrl(null);
    form.setValue('imagem_url', '');
  };
  
  // Função para realizar o upload da imagem para o Supabase Storage
  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;
    
    try {
      setIsUploading(true);
      setUploadProgress(10);
      
      // Simular progresso - em uma implementação real, isso seria atualizado com base no progresso real do upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const next = prev + Math.floor(Math.random() * 15);
          return next < 90 ? next : 90;
        });
      }, 300);
      
      // Fazer o upload da imagem
      const imageUrl = await uploadExerciseImage(imageFile, exercise?.id);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Se houver uma imagem antiga e estamos substituindo, excluir a antiga
      if (originalImageUrl && originalImageUrl !== imageUrl) {
        try {
          await deleteExerciseImage(originalImageUrl);
        } catch (error) {
          console.error("Erro ao excluir imagem antiga:", error);
          // Não interrompemos o fluxo se a exclusão da imagem antiga falhar
        }
      }
      
      // Atualizar o estado com a nova URL
      setOriginalImageUrl(imageUrl);
      return imageUrl;
    } catch (error) {
      console.error("Erro no upload da imagem:", error);
      toast({
        title: "Erro no upload",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao enviar a imagem. Tente novamente.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Form submission handler
  const onSubmit = async (values: z.infer<typeof schema>) => {
    setIsSubmitting(true);
    try {
      // Se houver um arquivo de imagem selecionado, fazer o upload
      let finalImageUrl = values.imagem_url;
      
      if (imageFile) {
        // Realizar o upload e obter a URL
        const uploadedImageUrl = await uploadImage();
        if (uploadedImageUrl) {
          finalImageUrl = uploadedImageUrl;
        }
      }

      // Processar o checklist_tecnico do formulário
      // Isso já é processado automaticamente como o formulário usa o FormControl direto com o textarea
      
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
        imagem_url: finalImageUrl || undefined,
        video_url: values.video_url || undefined,
        fundamentos: values.fundamentos || [],
        dificuldade: values.dificuldade || 'Intermediário',
        // Apenas incluir parâmetros de tempo se for YouTube
        ...(isYoutube ? {
          video_inicio: values.video_inicio || undefined,
          video_fim: values.video_fim || undefined
        } : {
          video_inicio: undefined,
          video_fim: undefined
        }),
        checklist_tecnico: values.checklist_tecnico || []
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

  // Função para obter cor de fundamento
  const getFundamentoColor = (fundamento: string, isSelected: boolean) => {
    const colors = {
      "Levantamento": {
        selected: "bg-blue-500 hover:bg-blue-600 text-white",
        outline: "border-blue-300 text-blue-600 hover:border-blue-400 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/30"
      },
      "Recepção": {
        selected: "bg-green-500 hover:bg-green-600 text-white",
        outline: "border-green-300 text-green-600 hover:border-green-400 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-950/30"
      },
      "Defesa": {
        selected: "bg-yellow-500 hover:bg-yellow-600 text-white",
        outline: "border-yellow-300 text-yellow-600 hover:border-yellow-400 hover:bg-yellow-50 dark:border-yellow-700 dark:text-yellow-400 dark:hover:bg-yellow-950/30"
      },
      "Saque": {
        selected: "bg-purple-500 hover:bg-purple-600 text-white",
        outline: "border-purple-300 text-purple-600 hover:border-purple-400 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-950/30"
      },
      "Ataque": {
        selected: "bg-red-500 hover:bg-red-600 text-white",
        outline: "border-red-300 text-red-600 hover:border-red-400 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
      },
      "Bloqueio": {
        selected: "bg-orange-500 hover:bg-orange-600 text-white",
        outline: "border-orange-300 text-orange-600 hover:border-orange-400 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-950/30"
      },
      "Deslocamento": {
        selected: "bg-indigo-500 hover:bg-indigo-600 text-white",
        outline: "border-indigo-300 text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-950/30"
      },
      "Comunicação": {
        selected: "bg-pink-500 hover:bg-pink-600 text-white",
        outline: "border-pink-300 text-pink-600 hover:border-pink-400 hover:bg-pink-50 dark:border-pink-700 dark:text-pink-400 dark:hover:bg-pink-950/30"
      }
    };
    
    return colors[fundamento] 
      ? (isSelected ? colors[fundamento].selected : colors[fundamento].outline)
      : (isSelected ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "border-input bg-background hover:bg-accent hover:text-accent-foreground");
  };

  // Função para obter cor com base no nível de dificuldade
  const getDificuldadeColor = (dificuldade: string) => {
    const dificuldadeColors = {
      "Iniciante": "text-green-600 dark:text-green-500",
      "Intermediário": "text-amber-600 dark:text-amber-500",
      "Avançado": "text-red-600 dark:text-red-500"
    };
    
    return dificuldadeColors[dificuldade] || "text-gray-600 dark:text-gray-400";
  };

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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              name="dificuldade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <BarChart2 className="h-4 w-4 text-primary" />
                    Nível de Dificuldade
                  </FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Selecione o nível de dificuldade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {niveisDificuldade.map((nivel) => (
                        <SelectItem 
                          key={nivel} 
                          value={nivel}
                          className={getDificuldadeColor(nivel)}
                        >
                          {nivel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Campo de fundamentos técnicos */}
          <FormField
            control={form.control}
            name="fundamentos"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="h-4 w-4 text-primary" />
                  <FormLabel className="text-base font-medium m-0">Fundamentos Técnicos</FormLabel>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {fundamentos.map((fundamento) => {
                      const isSelected = field.value?.includes(fundamento);
                      return (
                        <Button
                          key={fundamento}
                          type="button"
                          variant="outline"
                          className={cn(
                            "text-sm h-9 relative transition-all duration-200 ease-in-out overflow-hidden",
                            isSelected ? "pl-2 pr-3" : "px-3",
                            getFundamentoColor(fundamento, isSelected)
                          )}
                          onClick={(e) => {
                            // Efeito ripple
                            const button = e.currentTarget;
                            const rect = button.getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            const y = e.clientY - rect.top;
                            
                            const ripple = document.createElement('span');
                            ripple.style.cssText = `
                              position: absolute;
                              background-color: rgba(255, 255, 255, 0.7);
                              border-radius: 50%;
                              pointer-events: none;
                              width: 100px;
                              height: 100px;
                              top: ${y - 50}px;
                              left: ${x - 50}px;
                              transform: scale(0);
                              opacity: 1;
                              transition: transform 0.5s, opacity 0.5s;
                            `;
                            
                            button.appendChild(ripple);
                            
                            // Ativar a animação
                            setTimeout(() => {
                              ripple.style.transform = 'scale(4)';
                              ripple.style.opacity = '0';
                            }, 10);
                            
                            // Limpar após a animação
                            setTimeout(() => {
                              ripple.remove();
                            }, 500);
                            
                            // Alterar estado
                            const currentValues = field.value || [];
                            if (isSelected) {
                              field.onChange(currentValues.filter(value => value !== fundamento));
                            } else {
                              field.onChange([...currentValues, fundamento]);
                            }
                          }}
                        >
                          {isSelected && (
                            <CheckCircle 
                              className="h-3.5 w-3.5 mr-1.5 shrink-0 animate-fade-in" 
                            />
                          )}
                          {fundamento}
                        </Button>
                      );
                    })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Selecione os fundamentos abordados neste exercício
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Reordenado: Objetivo antes da Descrição */}
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

          {/* Campo de Checklist Técnico */}
          <FormField
            control={form.control}
            name="checklist_tecnico"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Checklist Técnico (Pontos de Atenção)
                </FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Digite cada ponto técnico em uma linha separada.
Exemplo:
- Manter joelhos flexionados
- Braços estendidos acima da cabeça
- Olhar sempre para a bola"
                    className="min-h-[150px] resize-y"
                    {...field} 
                    value={
                      Array.isArray(field.value) 
                        ? field.value.join('\n') 
                        : ''
                    }
                    onChange={(e) => {
                      // Quando o texto muda, dividimos por quebras de linha e armazenamos como array
                      const items = e.target.value
                        .split('\n')
                        .map(item => item.trim())
                        .filter(item => item.length > 0);
                      
                      // Atualizar o valor do campo diretamente com o array
                      field.onChange(items);
                    }}
                  />
                </FormControl>
                <FormMessage />
                <div className="text-xs text-muted-foreground mt-1">
                  Insira pontos importantes para a execução correta do exercício, um por linha.
                </div>
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

          {/* Componente de Upload de Imagem */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <ImageIcon className="h-4 w-4 text-primary" />
              <FormLabel className="text-base font-medium m-0">Imagem do Exercício</FormLabel>
            </div>
            
            {/* Área de Upload */}
            {!imagePreview ? (
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/30 transition-colors cursor-pointer relative overflow-hidden">
                <input
                  type="file"
                  id="image-upload"
                  accept="image/png, image/jpeg, image/jpg, image/gif, image/webp"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleImageSelect}
                  disabled={isUploading}
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  <UploadCloud className="h-10 w-10 text-muted-foreground" />
                  <div className="text-sm font-medium">
                    Arraste uma imagem aqui ou clique para selecionar
                  </div>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, GIF ou WebP (máx. 2MB)
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative border rounded-lg overflow-hidden shadow-sm">
                {/* Preview da Imagem */}
                <div className="relative aspect-video bg-muted flex items-center justify-center overflow-hidden">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-full object-contain"
                  />
                  
                  {/* Overlay de progresso durante upload */}
                  {isUploading && (
                    <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center">
                      <LoadingSpinner className="mb-2" />
                      <div className="text-sm font-medium mb-2">Enviando imagem...</div>
                      <Progress value={uploadProgress} className="w-2/3 h-2" />
                    </div>
                  )}
                </div>
                
                {/* Controles para imagem selecionada */}
                <div className="p-3 flex justify-between items-center bg-card">
                  <span className="text-sm truncate max-w-[70%] text-muted-foreground">
                    {imageFile?.name || 'Imagem do exercício'}
                  </span>
                  <div className="flex items-center gap-2">
                    {/* Botão para trocar imagem */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 flex items-center gap-1.5"
                      disabled={isUploading}
                      onClick={() => document.getElementById('image-upload')?.click()}
                    >
                      <UploadCloud className="h-3.5 w-3.5" />
                      Trocar
                    </Button>
                    
                    {/* Botão para remover */}
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="h-8 flex items-center gap-1.5"
                      disabled={isUploading}
                      onClick={handleRemoveImage}
                      title="Remover imagem"
                    >
                      <X className="h-3.5 w-3.5" />
                      Remover
                    </Button>
                    
                    {/* Input oculto para trocar imagem */}
                    <input
                      type="file"
                      id="image-upload"
                      accept="image/png, image/jpeg, image/jpg, image/gif, image/webp"
                      className="hidden"
                      onChange={handleImageSelect}
                      disabled={isUploading}
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Input oculto para armazenar a URL final da imagem */}
          <FormField
            control={form.control}
            name="imagem_url"
            render={({ field }) => (
                <FormItem className="hidden">
                <FormControl>
                    <Input type="hidden" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          </div>

          <div className="p-4 border rounded-lg border-dashed mb-4 bg-background/50">
            {/* Link do Vídeo */}
            <FormField
              control={form.control}
              name="video_url"
              render={({ field }) => (
                <FormItem className="form-item mb-4">
                  <FormLabel className="font-medium">Link do Vídeo (YouTube/Instagram - Opcional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="URL do vídeo do YouTube ou post do Instagram" 
                      className="h-10 bg-background"
                      {...field} 
                    />
                  </FormControl>
                  <div className="text-xs text-muted-foreground mt-1">
                    Cole a URL completa do vídeo. Para vídeos do YouTube, você poderá definir pontos de início e fim.
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campos para recorte de vídeo - exibidos apenas se houver URL de vídeo preenchida */}
            {(form.watch('video_url') && isYoutube) && (
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
                      <div className="text-xs text-muted-foreground mt-1">
                        Tempo de início do exercício no vídeo
                      </div>
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
                      <div className="text-xs text-muted-foreground mt-1">
                        Tempo de fim do exercício no vídeo
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            
            {/* Feedback visual para URL do YouTube */}
            {form.watch('video_url') && isYoutube && (
              <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center">
                  <Youtube className="h-3.5 w-3.5 mr-1.5" />
                  Vídeo do YouTube detectado. Você pode definir os tempos de início e fim do exercício.
                </p>
              </div>
            )}
            
            {/* Feedback para Instagram */}
            {isInstagram && form.watch('video_url') && (
              <div className="mt-3 p-2 bg-pink-50 dark:bg-pink-900/20 rounded-md">
                <p className="text-xs text-pink-700 dark:text-pink-300 flex items-center">
                  <Instagram className="h-3.5 w-3.5 mr-1.5" />
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
