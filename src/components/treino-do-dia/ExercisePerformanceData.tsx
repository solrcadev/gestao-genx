import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import LoadingSpinner from "../LoadingSpinner";
import { BarChart3, Info } from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ExercisePerformanceDataProps {
  exerciseId: string;
  treinoDoDiaId: string;
}

interface AvaliacaoData {
  id: string;
  atleta_id: string;
  fundamento: string;
  acertos: number;
  erros: number;
  atleta?: {
    id?: string;
    nome?: string;
  };
  percentual?: number;
}

const ExercisePerformanceData: React.FC<ExercisePerformanceDataProps> = ({
  exerciseId,
  treinoDoDiaId,
}) => {
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadAvaliacoes();
  }, [exerciseId, treinoDoDiaId]);

  const loadAvaliacoes = async () => {
    try {
      setLoading(true);
      
      // Buscar avaliações para este exercício
      const { data, error } = await supabase
        .from("avaliacoes_fundamento")
        .select(`
          id, 
          atleta_id, 
          fundamento, 
          acertos, 
          erros,
          atleta:atleta_id (id, nome)
        `)
        .eq("exercicio_id", exerciseId);

      if (error) throw error;

      // Processar os dados para calcular percentual
      const processedData = (data || []).map((avaliacao) => {
        const total = avaliacao.acertos + avaliacao.erros;
        const percentual = total > 0 ? (avaliacao.acertos / total) * 100 : 0;
        
        return {
          ...avaliacao,
          percentual: parseFloat(percentual.toFixed(1)),
        };
      });

      setAvaliacoes(processedData as AvaliacaoData[]);
    } catch (error) {
      console.error("Erro ao carregar avaliações:", error);
    } finally {
      setLoading(false);
    }
  };

  // Se não tiver avaliações, não mostrar nada
  if (!loading && avaliacoes.length === 0) {
    return null;
  }

  // Calcular totais gerais
  const calcularTotais = () => {
    let totalAcertos = 0;
    let totalErros = 0;
    
    avaliacoes.forEach(av => {
      totalAcertos += av.acertos;
      totalErros += av.erros;
    });
    
    const total = totalAcertos + totalErros;
    const percentualTotal = total > 0 ? (totalAcertos / total) * 100 : 0;
    
    return {
      acertos: totalAcertos,
      erros: totalErros,
      percentual: parseFloat(percentualTotal.toFixed(1))
    };
  };
  
  const totais = calcularTotais();

  return (
    <div className="mt-4 border-t pt-3">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium flex items-center">
          <BarChart3 className="h-4 w-4 mr-1" /> Avaliações de Desempenho
        </h4>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setExpanded(!expanded)}
          className="text-xs"
        >
          {expanded ? "Ocultar detalhes" : "Ver detalhes"}
        </Button>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-2">
          <LoadingSpinner />
        </div>
      ) : !expanded ? (
        // Visão resumida
        <div className="bg-muted/20 p-2 rounded-md">
          <div className="flex justify-between mb-1">
            <span className="text-sm text-muted-foreground">Resumo geral:</span>
            <span className="text-sm font-medium">{avaliacoes.length} avaliações</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-green-50 p-1 rounded">
              <div className="text-green-600 font-medium">{totais.acertos}</div>
              <div className="text-xs text-muted-foreground">Acertos</div>
            </div>
            <div className="bg-red-50 p-1 rounded">
              <div className="text-red-600 font-medium">{totais.erros}</div>
              <div className="text-xs text-muted-foreground">Erros</div>
            </div>
            <div className="bg-blue-50 p-1 rounded">
              <div className="text-blue-600 font-medium">{totais.percentual}%</div>
              <div className="text-xs text-muted-foreground">Aproveit.</div>
            </div>
          </div>
        </div>
      ) : (
        // Visão detalhada com tabela
        <div className="overflow-x-auto">
          <Table className="text-xs">
            <TableCaption className="text-xs">
              Avaliações de desempenho dos atletas
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Atleta</TableHead>
                <TableHead>Fundamento</TableHead>
                <TableHead className="text-right">Acertos</TableHead>
                <TableHead className="text-right">Erros</TableHead>
                <TableHead className="text-right">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="flex items-center">
                          % <Info className="h-3 w-3 ml-1" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Percentual de aproveitamento</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {avaliacoes.map((avaliacao) => (
                <TableRow key={avaliacao.id}>
                  <TableCell className="font-medium">
                    {avaliacao.atleta?.nome || "Atleta"}
                  </TableCell>
                  <TableCell>{avaliacao.fundamento}</TableCell>
                  <TableCell className="text-right text-green-600">
                    {avaliacao.acertos}
                  </TableCell>
                  <TableCell className="text-right text-red-600">
                    {avaliacao.erros}
                  </TableCell>
                  <TableCell className="text-right">
                    {avaliacao.percentual}%
                  </TableCell>
                </TableRow>
              ))}
              
              {/* Linha de totais */}
              <TableRow className="bg-muted/30">
                <TableCell colSpan={2} className="font-medium">
                  Totais
                </TableCell>
                <TableCell className="text-right text-green-600 font-medium">
                  {totais.acertos}
                </TableCell>
                <TableCell className="text-right text-red-600 font-medium">
                  {totais.erros}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {totais.percentual}%
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default ExercisePerformanceData; 