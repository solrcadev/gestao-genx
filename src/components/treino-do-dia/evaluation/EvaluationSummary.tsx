
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface EvaluationSummaryProps {
  atleta: {
    id: string;
    nome: string;
    posicao: string;
    time: string;
    foto_url?: string;
  };
  totalAcertos: number;
  totalErros: number;
  observacoes?: string;
}

const EvaluationSummary: React.FC<EvaluationSummaryProps> = ({ atleta, totalAcertos, totalErros, observacoes }) => {
  const eficiencia = totalAcertos + totalErros > 0 ? (totalAcertos / (totalAcertos + totalErros) * 100).toFixed(0) : '0';

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Resumo da Avaliação</CardTitle>
        <CardDescription>
          Detalhes da avaliação do atleta
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center space-x-4">
          <Avatar className="h-8 w-8">
            {atleta.foto_url ? (
              <AvatarImage src={atleta.foto_url} alt={atleta.nome} />
            ) : (
              <AvatarFallback>{atleta.nome.substring(0, 2).toUpperCase()}</AvatarFallback>
            )}
          </Avatar>
          <div>
            <p className="text-sm font-medium leading-none">{atleta.nome}</p>
            <p className="text-sm text-muted-foreground">
              {atleta.posicao} • {atleta.time}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium">Total de Acertos</p>
            <p className="text-2xl font-bold">{totalAcertos}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Total de Erros</p>
            <p className="text-2xl font-bold">{totalErros}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Eficiência</p>
            <p className="text-2xl font-bold">{eficiencia}%</p>
          </div>
        </div>
        {observacoes && (
          <div>
            <p className="text-sm font-medium">Observações</p>
            <p className="text-sm text-muted-foreground">{observacoes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EvaluationSummary;
