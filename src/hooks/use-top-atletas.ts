
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

export interface TopAtleta {
  id: string;
  nome: string;
  percentual: number;
  totalExecucoes: number;
  acertos?: number;
  ultimaData: string;
}

export function useTopAtletasByFundamento(
  fundamento: string,
  time: 'Masculino' | 'Feminino',
  limite: number = 3
) {
  const [topAtletas, setTopAtletas] = useState<TopAtleta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTopAtletas = async () => {
      try {
        setIsLoading(true);

        // Buscar eventos qualitativos agrupados por atleta para o fundamento específico
        const { data, error } = await supabase
          .from('avaliacoes_eventos_qualificados')
          .select(`
            atleta_id,
            atleta:athletes!inner(id, nome, time),
            peso,
            timestamp,
            tipo_evento
          `)
          .eq('fundamento', fundamento)
          .eq('atleta.time', time)
          .order('timestamp', { ascending: false });

        if (error) throw error;

        // Processar os dados para calcular médias por atleta
        const atletasMap = new Map();

        data.forEach(evento => {
          const atletaId = evento.atleta_id;
          const atletaNome = evento.atleta.nome;
          const peso = evento.peso;
          const timestamp = evento.timestamp;

          if (!atletasMap.has(atletaId)) {
            atletasMap.set(atletaId, {
              id: atletaId,
              nome: atletaNome,
              somaPesos: 0,
              totalExecucoes: 0,
              ultimaData: timestamp,
            });
          }

          const atletaStats = atletasMap.get(atletaId);
          atletaStats.somaPesos += peso;
          atletaStats.totalExecucoes += 1;
          atletaStats.ultimaData = (new Date(timestamp) > new Date(atletaStats.ultimaData)) 
            ? timestamp 
            : atletaStats.ultimaData;
        });

        // Calcular percentual médio e formatar dados
        const topAtletasArray = Array.from(atletasMap.values())
          .map(atleta => {
            // Calcular percentual normalizado (assumindo que os pesos variam de -3 a +3)
            // Convertemos para uma escala de 0-100%
            const mediaRaw = atleta.somaPesos / atleta.totalExecucoes;
            const percentualNormalizado = ((mediaRaw + 3) / 6) * 100; // Normaliza de [-3,3] para [0,100]
            
            return {
              id: atleta.id,
              nome: atleta.nome,
              percentual: Math.min(Math.max(0, percentualNormalizado), 100), // Limita entre 0-100
              totalExecucoes: atleta.totalExecucoes,
              ultimaData: new Date(atleta.ultimaData).toLocaleDateString('pt-BR'),
            };
          })
          .filter(atleta => atleta.totalExecucoes >= 5) // Mínimo de 5 execuções para entrar no ranking
          .sort((a, b) => {
            // Ordenação primária por percentual
            if (b.percentual !== a.percentual) {
              return b.percentual - a.percentual;
            }
            // Desempate por número de execuções
            if (b.totalExecucoes !== a.totalExecucoes) {
              return b.totalExecucoes - a.totalExecucoes;
            }
            // Último desempate por nome
            return a.nome.localeCompare(b.nome);
          })
          .slice(0, limite);

        setTopAtletas(topAtletasArray);
      } catch (err) {
        console.error('Erro ao buscar top atletas:', err);
        setError(err instanceof Error ? err : new Error('Erro desconhecido'));
        toast({
          title: 'Erro ao carregar ranking',
          description: 'Não foi possível carregar os melhores atletas.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopAtletas();
  }, [fundamento, time, limite]);

  return { topAtletas, isLoading, error };
}
