
import React, { useState, useEffect } from "react";
import { fetchTreinos } from "@/services/trainingService";
import { setTreinoParaDia } from "@/services/treinosDoDiaService";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, MapPin } from "lucide-react";
import { Button } from "../ui/button";
import LoadingSpinner from "../LoadingSpinner";
import { toast } from "../ui/use-toast";
import { useMediaQuery } from "@/hooks/use-mobile";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface SelectTreinoParaDiaProps {
  onSelectTreino: () => void;
}

const SelectTreinoParaDia = ({ onSelectTreino }: SelectTreinoParaDiaProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [treinos, setTreinos] = useState([]);
  const [selectedTreinoId, setSelectedTreinoId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingTreino, setIsSettingTreino] = useState(false);
  const isMobile = useMediaQuery(768);

  useEffect(() => {
    loadTreinos();
  }, []);

  const loadTreinos = async () => {
    setIsLoading(true);
    try {
      const treinosData = await fetchTreinos();
      setTreinos(treinosData);
    } catch (error) {
      toast({
        title: "Erro ao carregar treinos",
        description: "Não foi possível carregar a lista de treinos. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const handleTreinoSelect = (treinoId: string) => {
    setSelectedTreinoId(treinoId);
  };

  const handleSetTreinoParaDia = async () => {
    if (!selectedTreinoId || !selectedDate) {
      toast({
        title: "Atenção",
        description: "Selecione um treino e uma data para continuar.",
        variant: "default", // Changed from "warning" to "default" as "warning" is not a supported variant
      });
      return;
    }

    setIsSettingTreino(true);
    try {
      await setTreinoParaDia(selectedTreinoId, selectedDate);
      toast({
        title: "Treino definido!",
        description: "O treino foi definido para o dia selecionado com sucesso.",
      });
      onSelectTreino();
    } catch (error: any) {
      toast({
        title: "Erro ao definir treino",
        description: error.message || "Não foi possível definir o treino para o dia. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSettingTreino(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Date Picker */}
      <div>
        <h3 className="text-lg font-semibold mb-2">
          Selecione a data do treino
        </h3>
        <div className="rounded-md border">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : "Selecione uma data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        {selectedDate && (
          <p className="text-sm text-muted-foreground mt-2">
            Data selecionada:{" "}
            {format(selectedDate, "PPP", { locale: ptBR })}
          </p>
        )}
      </div>

      {/* Training Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-2">
          Selecione o treino para o dia
        </h3>
        {isLoading ? (
          <div className="flex justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="space-y-2">
            {treinos.map((treino) => (
              <Button
                key={treino.id}
                variant={selectedTreinoId === treino.id ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => handleTreinoSelect(treino.id)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{treino.nome}</span>
                  <span className="text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-1 inline-block" />
                    {treino.local}
                  </span>
                </div>
              </Button>
            ))}
            {treinos.length === 0 && (
              <p className="text-muted-foreground">
                Nenhum treino encontrado.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Set Training Button */}
      <Button
        onClick={handleSetTreinoParaDia}
        disabled={isSettingTreino || !selectedTreinoId || !selectedDate}
      >
        {isSettingTreino && <LoadingSpinner className="mr-2" />}
        Definir Treino para o Dia
      </Button>
    </div>
  );
};

export default SelectTreinoParaDia;
