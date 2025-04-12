import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { setTreinoParaDia } from '@/services/treinosDoDiaService';
import LoadingSpinner from '@/components/LoadingSpinner';

interface SelectTreinoParaDiaProps {
  treinoId: string;
  treinoNome: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function SelectTreinoParaDia({ 
  treinoId, 
  treinoNome,
  className,
  size = "md"
}: SelectTreinoParaDiaProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const setTreinoMutation = useMutation({
    mutationFn: ({ treinoId, date }: { treinoId: string; date: Date }) => 
      setTreinoParaDia(treinoId, date),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['treinos-do-dia'] });
      toast({
        title: 'Treino definido para o dia',
        description: `O treino "${treinoNome}" foi definido para ${format(date, 'PPP', { locale: ptBR })}.`
      });
      setIsDialogOpen(false);
      navigate(`/treino-do-dia/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  const handleSubmit = () => {
    setTreinoMutation.mutate({ treinoId, date });
  };
  
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size={size} className={cn("w-full", className)}>
          <Play className="h-4 w-4 mr-2" />
          Aplicar Treino
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Aplicar Treino do Dia</DialogTitle>
          <DialogDescription>
            Selecione a data para aplicar o treino <strong>{treinoNome}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex flex-col items-start gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: ptBR }) : <span>Selecione a data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(date) => date && setDate(date)}
                  initialFocus
                  disabled={(date) => {
                    // Can't select dates in the past
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today;
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setIsDialogOpen(false)}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={setTreinoMutation.isPending || !date}
          >
            {setTreinoMutation.isPending ? (
              <LoadingSpinner className="mr-2" />
            ) : null}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
