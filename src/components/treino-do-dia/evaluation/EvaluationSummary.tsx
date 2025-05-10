import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, Edit, AlertTriangle, ClipboardCheck, BarChart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface EvaluationSummaryProps {
  exercise: any;
  evaluationData: {
    fundamento: string;
    acertos?: number;
    erros?: number;
    tipo?: 'quantitativa' | 'qualitativa';
    eventos_qualitativos?: number;
    observacoes?: string;
  };
  onEdit: () => void;
  onSave: () => void;
  isMonitor?: boolean;
  needsApproval?: boolean;
}

export default function EvaluationSummary({
  exercise,
  evaluationData,
  onEdit,
  onSave,
  isMonitor = false,
  needsApproval = false
}: EvaluationSummaryProps) {
  const { fundamento, acertos = 0, erros = 0, observacoes, tipo = 'quantitativa', eventos_qualitativos = 0 } = evaluationData;
  const total = acertos + erros;
  const percentAcertos = total > 0 ? Math.round((acertos / total) * 100) : 0;

  // Get class based on percentage
  const getPercentClass = () => {
    if (percentAcertos >= 80) return "text-green-500";
    if (percentAcertos >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Resumo da Avaliação</h2>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Button>
      </div>

      {needsApproval && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-300 rounded-lg flex items-start">
          <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-700">
            <p className="font-medium">Avaliação pendente de aprovação</p>
            <p>Esta avaliação precisa ser aprovada por um técnico antes de ser contabilizada no sistema.</p>
          </div>
        </div>
      )}

      <Card className="p-5 mb-6">
        <h3 className="font-medium text-lg mb-4">{exercise?.exercicio?.nome || exercise?.nome || "Exercício"}</h3>
        
        <div className="mb-4">
          <Badge variant="outline" className="mb-4">
            {tipo === 'quantitativa' ? (
              <><BarChart className="h-3 w-3 mr-1" /> Avaliação Quantitativa</>
            ) : (
              <><ClipboardCheck className="h-3 w-3 mr-1" /> Avaliação Qualitativa</>
            )}
          </Badge>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fundamento:</span>
            <span className="font-medium">{fundamento || "Não especificado"}</span>
          </div>
          
          {tipo === 'quantitativa' ? (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Acertos:</span>
                <span className="font-medium text-green-600">{acertos}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Erros:</span>
                <span className="font-medium text-red-600">{erros}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total de execuções:</span>
                <span className="font-medium">{total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Eficiência:</span>
                <span className={`font-medium ${getPercentClass()}`}>{percentAcertos}%</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Eventos registrados:</span>
              <span className="font-medium">{eventos_qualitativos}</span>
            </div>
          )}
          
          {observacoes && (
            <div className="mt-4 border-t pt-4">
              <span className="text-muted-foreground block mb-1">Observações:</span>
              <p className="text-sm">{observacoes}</p>
            </div>
          )}
        </div>
      </Card>

      <div className="mt-auto">
        <Button className="w-full" onClick={onSave}>
          <CheckCircle className="h-4 w-4 mr-2" />
          {isMonitor ? "Concluir e enviar para aprovação" : "Salvar avaliação"}
        </Button>
        
        {isMonitor && (
          <p className="text-sm text-muted-foreground text-center mt-3">
            Esta avaliação será revisada por um técnico.
          </p>
        )}
      </div>
    </div>
  );
}
