
import { Card, CardContent } from '@/components/ui/card';
import { useAvaliacoesAtleta } from '@/hooks/use-avaliacoes-atleta';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { ClipboardCheck, ThumbsDown, ThumbsUp } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';

interface AvaliacoesRecentesProps {
  atletaId: string;
}

export function AvaliacoesRecentes({ atletaId }: AvaliacoesRecentesProps) {
  const { data: avaliacoes, isLoading } = useAvaliacoesAtleta(atletaId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="md" />
      </div>
    );
  }

  if (!avaliacoes || avaliacoes.length === 0) {
    return (
      <div className="text-center py-8">
        <ClipboardCheck className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
        <h3 className="mt-2 font-medium">Sem avaliações recentes</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Este atleta ainda não possui avaliações qualitativas registradas.
        </p>
      </div>
    );
  }

  const getTipoEventoIcon = (tipo: string) => {
    if (tipo.includes('positivo') || tipo.includes('acerto')) {
      return <ThumbsUp className="h-4 w-4 text-green-500" />;
    }
    return <ThumbsDown className="h-4 w-4 text-red-500" />;
  };

  const getTipoEventoClass = (tipo: string) => {
    if (tipo.includes('positivo') || tipo.includes('acerto')) {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-red-100 text-red-800';
  };

  const formatTipoEvento = (tipo: string) => {
    return tipo.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-4">
      {avaliacoes.map((avaliacao) => (
        <Card key={avaliacao.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <Badge className="capitalize">{avaliacao.fundamento}</Badge>
              <span className="text-xs text-muted-foreground">
                {format(new Date(avaliacao.timestamp), "dd/MM/yy HH:mm", { locale: pt })}
              </span>
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              {getTipoEventoIcon(avaliacao.tipo_evento)}
              <span className={`text-xs px-2 py-1 rounded-full ${getTipoEventoClass(avaliacao.tipo_evento)}`}>
                {formatTipoEvento(avaliacao.tipo_evento)} (Peso: {avaliacao.peso})
              </span>
            </div>
            
            {avaliacao.observacoes && (
              <div className="text-sm text-muted-foreground border-t pt-2 mt-2">
                {avaliacao.observacoes}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
