import React, { useState, useEffect } from "react";
import { format, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, ArrowLeft, ArrowRight, Plus, CheckCircle2, BarChart3 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import SelectTreinoParaDia from "@/components/treino-do-dia/SelectTreinoParaDia";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getTreinoDoDia, setTreinoParaDia } from "@/services/treinosDoDiaService";
import { toast } from "@/components/ui/use-toast";
import AthleteAttendance from "@/components/treino-do-dia/AthleteAttendance";
import ExerciseList from "@/components/treino-do-dia/ExerciseList";
import { useIsMobile } from "@/hooks/use-mobile";
import { EvaluationDialog } from "@/components/treino-do-dia/EvaluationDialog";
import { ExportTrainingButton } from "@/components/treino-do-dia/ExportTrainingButton";

const TreinoDosDia = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [treinoDoDia, setTreinoDoDia] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEvaluationOpen, setIsEvaluationOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    loadTreinoDoDia();
  }, [date]);

  const loadTreinoDoDia = async () => {
    setIsLoading(true);
    try {
      const treino = await getTreinoDoDia(date);
      setTreinoDoDia(treino);
    } catch (error) {
      console.error("Erro ao carregar treino do dia:", error);
      toast({
        title: "Erro ao carregar treino do dia",
        description: "Não foi possível carregar o treino para este dia.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate);
    }
  };

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    loadTreinoDoDia();
  };

  const handlePreviousDay = () => {
    setDate((prevDate) => subDays(prevDate, 1));
  };

  const handleNextDay = () => {
    setDate((prevDate) => addDays(prevDate, 1));
  };

  const handleTreinoCreated = () => {
    loadTreinoDoDia();
  };
  
  const handleOpenEvaluation = () => {
    setIsEvaluationOpen(true);
  };

  return (
    <div className="mobile-container pb-16">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Treino do Dia</h1>
        <div className="flex items-center gap-2">
          <Button size="icon" onClick={handlePreviousDay}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button size="icon" onClick={handleNextDay}>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full pl-3 text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? (
                format(date, "PPP", { locale: ptBR })
              ) : (
                <span>Selecione uma data</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              initialFocus
              disabled={(date) => {
                // Bloquear apenas datas anteriores a 30 dias atrás
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return date < thirtyDaysAgo;
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner />
        </div>
      ) : treinoDoDia ? (
        <div className="space-y-6">
          <div className="rounded-md border p-4 bg-muted/5">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-semibold">{treinoDoDia.treino.nome}</h2>
                <p className="text-sm text-muted-foreground">
                  <CheckCircle2 className="inline-block h-4 w-4 mr-1 align-middle" />
                  {treinoDoDia.treino.local}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <ExportTrainingButton
                  trainingId={treinoDoDia.treino.id}
                  isTreinoDoDia={true}
                />
                <Button
                  size="sm"
                  onClick={handleOpenEvaluation}
                  className="flex items-center gap-1"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Avaliar</span>
                </Button>
              </div>
            </div>
          </div>

          <AthleteAttendance treinoDoDiaId={treinoDoDia.id} onSaved={loadTreinoDoDia} />
          <ExerciseList treinoDoDiaId={treinoDoDia.id} />
          
          {/* Evaluation Dialog */}
          <EvaluationDialog 
            open={isEvaluationOpen} 
            onOpenChange={setIsEvaluationOpen} 
            treinoDoDiaId={treinoDoDia.id} 
          />
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-muted-foreground mb-4">
            Nenhum treino definido para este dia.
          </p>
          <Dialog>
            <DialogTrigger asChild>
              <Button onClick={handleOpenDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Definir Treino para o Dia
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Definir Treino</DialogTitle>
                <DialogDescription>
                  Selecione um treino para o dia {format(date, "PPP", { locale: ptBR })}.
                </DialogDescription>
              </DialogHeader>
              <SelectTreinoParaDia onSelectTreino={handleTreinoCreated} />
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
};

export default TreinoDosDia;
