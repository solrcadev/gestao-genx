
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useMetasAtleta } from '@/hooks/use-metas-atleta';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { CalendarIcon, CheckCircle2, CircleDashed } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

interface MetasAtletaProps {
  atletaId: string;
}

export function MetasAtleta({ atletaId }: MetasAtletaProps) {
  const { data: metas, isLoading } = useMetasAtleta(atletaId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="md" />
      </div>
    );
  }

  if (!metas || metas.length === 0) {
    return (
      <div className="text-center py-8">
        <CircleDashed className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
        <h3 className="mt-2 font-medium">Nenhuma meta definida</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Não há metas registradas para este atleta.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {metas.map((meta) => (
        <Card key={meta.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-medium">{meta.titulo}</h3>
                {meta.descricao && (
                  <p className="text-sm text-muted-foreground">{meta.descricao}</p>
                )}
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                meta.progresso >= 100 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {meta.progresso >= 100 ? 'Concluída' : 'Em andamento'}
              </span>
            </div>
            
            <div className="flex items-center text-xs text-muted-foreground mb-3">
              <CalendarIcon className="mr-1 h-3 w-3" />
              Data alvo: {format(new Date(meta.data_alvo), "dd 'de' MMMM, yyyy", { locale: pt })}
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Progresso</span>
                <span>{meta.progresso}%</span>
              </div>
              <Progress value={meta.progresso} className="h-2" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
