
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { AreaChart, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ResumoDesempenhoProps {
  atletaId: string;
}

interface DesempenhoFundamento {
  fundamento: string;
  eficiencia: number;
  total_avaliacoes: number;
}

export function ResumoDesempenho({ atletaId }: ResumoDesempenhoProps) {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'chart' | 'bars'>('chart');
  
  const { data: desempenho, isLoading } = useQuery({
    queryKey: ['desempenho-resumo', atletaId],
    queryFn: async (): Promise<DesempenhoFundamento[]> => {
      const { data, error } = await supabase
        .from('vw_avaliacao_qualitativa_media')
        .select('fundamento, nota_percentual, total_avaliacoes')
        .eq('atleta_id', atletaId);
        
      if (error) throw error;
      
      return (data || []).map(item => ({
        fundamento: item.fundamento,
        eficiencia: item.nota_percentual || 0,
        total_avaliacoes: item.total_avaliacoes || 0
      }));
    },
    enabled: !!atletaId
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="md" />
      </div>
    );
  }

  if (!desempenho || desempenho.length === 0) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
        <h3 className="mt-2 font-medium">Sem dados de desempenho</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Não existem avaliações qualitativas para este atleta ainda.
        </p>
      </div>
    );
  }

  const handleVerDetalhadoClick = () => {
    navigate(`/aluno/${atletaId}/performance`);
  };

  const getBarColor = (eficiencia: number) => {
    if (eficiencia >= 80) return 'bg-green-500';
    if (eficiencia >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Eficiência por Fundamento</h3>
        <div className="flex gap-1">
          <Button 
            variant={viewMode === 'chart' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setViewMode('chart')}
            className="h-8 w-8 p-0"
          >
            <AreaChart className="h-4 w-4" />
          </Button>
          <Button 
            variant={viewMode === 'bars' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setViewMode('bars')}
            className="h-8 w-8 p-0"
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {viewMode === 'bars' ? (
        <div className="space-y-3">
          {desempenho.map((item) => (
            <Card key={item.fundamento} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium capitalize">{item.fundamento}</span>
                  <span className="text-muted-foreground">{item.eficiencia.toFixed(1)}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded overflow-hidden">
                  <div 
                    className={`h-full ${getBarColor(item.eficiencia)}`} 
                    style={{ width: `${Math.min(100, Math.max(0, item.eficiencia))}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-1 text-right">
                  {item.total_avaliacoes} avaliações
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-4">
            <div className="h-48 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-70" />
                <p className="text-sm">
                  Ver desempenho detalhado para visualizar gráficos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Button 
        onClick={handleVerDetalhadoClick} 
        className="w-full"
      >
        Ver desempenho detalhado
      </Button>
    </div>
  );
}
