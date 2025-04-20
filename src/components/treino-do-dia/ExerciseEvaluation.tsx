import React, { useState, useEffect } from "react";
import { salvarAvaliacaoExercicio } from "@/services/treinosDoDiaService";
import { Check, X, PlusCircle, MinusCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { toast } from "../ui/use-toast";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "../ui/tabs";
import { useMediaQuery } from "@/hooks/use-mobile";

interface ExerciseEvaluationProps {
  treinoDoDiaId: string;
  exercicioId: string;
  atletaId: string;
  onSaved: () => void;
}

const ExerciseEvaluation = ({ treinoDoDiaId, exercicioId, atletaId, onSaved }: ExerciseEvaluationProps) => {
  const [fundamento, setFundamento] = useState("Saque");
  const [acertos, setAcertos] = useState(0);
  const [erros, setErros] = useState(0);
  const isMobile = useMediaQuery(768);

  useEffect(() => {
    // Reset states when exercise changes
    setAcertos(0);
    setErros(0);
  }, [exercicioId]);

  const handleSalvarAvaliacao = async () => {
    try {
      await salvarAvaliacaoExercicio({
        treinoDoDiaId,
        exercicioId,
        atletaId,
        fundamento,
        acertos,
        erros,
      });
      toast({
        title: "Avaliação salva!",
        description: "A avaliação do exercício foi salva com sucesso.",
      });
      onSaved();
    } catch (error: any) {
      console.error("Erro ao salvar avaliação:", error);
      toast({
        title: "Erro ao salvar avaliação",
        description:
          error.message || "Não foi possível salvar a avaliação. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const incrementAcertos = () => {
    setAcertos((prev) => prev + 1);
  };

  const decrementAcertos = () => {
    if (acertos > 0) {
      setAcertos((prev) => prev - 1);
    }
  };

  const incrementErros = () => {
    setErros((prev) => prev + 1);
  };

  const decrementErros = () => {
    if (erros > 0) {
      setErros((prev) => prev - 1);
    }
  };

  return (
    <div className="w-full">
      <Tabs defaultValue="saque" className="w-full">
        <TabsList className="w-full flex justify-center">
          <TabsTrigger value="saque" onClick={() => setFundamento("Saque")}>
            Saque
          </TabsTrigger>
          <TabsTrigger value="recepcao" onClick={() => setFundamento("Recepção")}>
            Recepção
          </TabsTrigger>
          <TabsTrigger value="levantamento" onClick={() => setFundamento("Levantamento")}>
            Levantamento
          </TabsTrigger>
          <TabsTrigger value="ataque" onClick={() => setFundamento("Ataque")}>
            Ataque
          </TabsTrigger>
          <TabsTrigger value="bloqueio" onClick={() => setFundamento("Bloqueio")}>
            Bloqueio
          </TabsTrigger>
          <TabsTrigger value="defesa" onClick={() => setFundamento("Defesa")}>
            Defesa
          </TabsTrigger>
        </TabsList>
        <TabsContent value="saque">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center border rounded-lg p-4">
              <div className="text-lg font-semibold mb-2">Acertos</div>
              <div className="flex items-center">
                <Button variant="outline" size="icon" onClick={decrementAcertos} disabled={acertos <= 0}>
                  <MinusCircle className="h-5 w-5" />
                </Button>
                <Input
                  type="number"
                  value={acertos}
                  readOnly
                  className="w-20 text-center mx-2"
                />
                <Button variant="outline" size="icon" onClick={incrementAcertos}>
                  <PlusCircle className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="flex flex-col items-center border rounded-lg p-4">
              <div className="text-lg font-semibold mb-2">Erros</div>
              <div className="flex items-center">
                <Button variant="outline" size="icon" onClick={decrementErros} disabled={erros <= 0}>
                  <MinusCircle className="h-5 w-5" />
                </Button>
                <Input
                  type="number"
                  value={erros}
                  readOnly
                  className="w-20 text-center mx-2"
                />
                <Button variant="outline" size="icon" onClick={incrementErros}>
                  <PlusCircle className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="recepcao">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center border rounded-lg p-4">
              <div className="text-lg font-semibold mb-2">Acertos</div>
              <div className="flex items-center">
                <Button variant="outline" size="icon" onClick={decrementAcertos} disabled={acertos <= 0}>
                  <MinusCircle className="h-5 w-5" />
                </Button>
                <Input
                  type="number"
                  value={acertos}
                  readOnly
                  className="w-20 text-center mx-2"
                />
                <Button variant="outline" size="icon" onClick={incrementAcertos}>
                  <PlusCircle className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="flex flex-col items-center border rounded-lg p-4">
              <div className="text-lg font-semibold mb-2">Erros</div>
              <div className="flex items-center">
                <Button variant="outline" size="icon" onClick={decrementErros} disabled={erros <= 0}>
                  <MinusCircle className="h-5 w-5" />
                </Button>
                <Input
                  type="number"
                  value={erros}
                  readOnly
                  className="w-20 text-center mx-2"
                />
                <Button variant="outline" size="icon" onClick={incrementErros}>
                  <PlusCircle className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="levantamento">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center border rounded-lg p-4">
              <div className="text-lg font-semibold mb-2">Acertos</div>
              <div className="flex items-center">
                <Button variant="outline" size="icon" onClick={decrementAcertos} disabled={acertos <= 0}>
                  <MinusCircle className="h-5 w-5" />
                </Button>
                <Input
                  type="number"
                  value={acertos}
                  readOnly
                  className="w-20 text-center mx-2"
                />
                <Button variant="outline" size="icon" onClick={incrementAcertos}>
                  <PlusCircle className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="flex flex-col items-center border rounded-lg p-4">
              <div className="text-lg font-semibold mb-2">Erros</div>
              <div className="flex items-center">
                <Button variant="outline" size="icon" onClick={decrementErros} disabled={erros <= 0}>
                  <MinusCircle className="h-5 w-5" />
                </Button>
                <Input
                  type="number"
                  value={erros}
                  readOnly
                  className="w-20 text-center mx-2"
                />
                <Button variant="outline" size="icon" onClick={incrementErros}>
                  <PlusCircle className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="ataque">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center border rounded-lg p-4">
              <div className="text-lg font-semibold mb-2">Acertos</div>
              <div className="flex items-center">
                <Button variant="outline" size="icon" onClick={decrementAcertos} disabled={acertos <= 0}>
                  <MinusCircle className="h-5 w-5" />
                </Button>
                <Input
                  type="number"
                  value={acertos}
                  readOnly
                  className="w-20 text-center mx-2"
                />
                <Button variant="outline" size="icon" onClick={incrementAcertos}>
                  <PlusCircle className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="flex flex-col items-center border rounded-lg p-4">
              <div className="text-lg font-semibold mb-2">Erros</div>
              <div className="flex items-center">
                <Button variant="outline" size="icon" onClick={decrementErros} disabled={erros <= 0}>
                  <MinusCircle className="h-5 w-5" />
                </Button>
                <Input
                  type="number"
                  value={erros}
                  readOnly
                  className="w-20 text-center mx-2"
                />
                <Button variant="outline" size="icon" onClick={incrementErros}>
                  <PlusCircle className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="bloqueio">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center border rounded-lg p-4">
              <div className="text-lg font-semibold mb-2">Acertos</div>
              <div className="flex items-center">
                <Button variant="outline" size="icon" onClick={decrementAcertos} disabled={acertos <= 0}>
                  <MinusCircle className="h-5 w-5" />
                </Button>
                <Input
                  type="number"
                  value={acertos}
                  readOnly
                  className="w-20 text-center mx-2"
                />
                <Button variant="outline" size="icon" onClick={incrementAcertos}>
                  <PlusCircle className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="flex flex-col items-center border rounded-lg p-4">
              <div className="text-lg font-semibold mb-2">Erros</div>
              <div className="flex items-center">
                <Button variant="outline" size="icon" onClick={decrementErros} disabled={erros <= 0}>
                  <MinusCircle className="h-5 w-5" />
                </Button>
                <Input
                  type="number"
                  value={erros}
                  readOnly
                  className="w-20 text-center mx-2"
                />
                <Button variant="outline" size="icon" onClick={incrementErros}>
                  <PlusCircle className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="defesa">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center border rounded-lg p-4">
              <div className="text-lg font-semibold mb-2">Acertos</div>
              <div className="flex items-center">
                <Button variant="outline" size="icon" onClick={decrementAcertos} disabled={acertos <= 0}>
                  <MinusCircle className="h-5 w-5" />
                </Button>
                <Input
                  type="number"
                  value={acertos}
                  readOnly
                  className="w-20 text-center mx-2"
                />
                <Button variant="outline" size="icon" onClick={incrementAcertos}>
                  <PlusCircle className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="flex flex-col items-center border rounded-lg p-4">
              <div className="text-lg font-semibold mb-2">Erros</div>
              <div className="flex items-center">
                <Button variant="outline" size="icon" onClick={decrementErros} disabled={erros <= 0}>
                  <MinusCircle className="h-5 w-5" />
                </Button>
                <Input
                  type="number"
                  value={erros}
                  readOnly
                  className="w-20 text-center mx-2"
                />
                <Button variant="outline" size="icon" onClick={incrementErros}>
                  <PlusCircle className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Button className="w-full mt-4" onClick={handleSalvarAvaliacao}>
        Salvar Avaliação
      </Button>
    </div>
  );
};

export default ExerciseEvaluation;
