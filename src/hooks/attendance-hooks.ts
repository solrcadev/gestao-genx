
import { useQuery } from '@tanstack/react-query';
import { fetchPresencasAtletas } from '@/services/treinosDoDiaService';
import { supabase } from '@/lib/supabase';
import { TeamType } from '@/types';

/**
 * Hook para buscar presenças dos atletas para um treino específico
 * @param treinoDoDiaId ID do treino do dia para buscar presenças
 * @returns Lista de atletas com status de presença
 */
export function useGetAthleteAttendance(treinoDoDiaId: string | undefined) {
  return useQuery({
    queryKey: ['attendance', treinoDoDiaId],
    queryFn: () => {
      if (!treinoDoDiaId) {
        return Promise.resolve([]);
      }
      return fetchPresencasAtletas(treinoDoDiaId);
    },
    enabled: !!treinoDoDiaId,
  });
}

/**
 * Interface para os dados do ranking de atletas por fundamento
 */
export interface TopAthleteByFundamento {
  id: string;
  nome: string;
  percentual: number;
  totalExecucoes: number;
  acertos: number;
  ultimaData: string;
}

/**
 * Hook para buscar o ranking de atletas por fundamento baseado em avaliações qualitativas
 * @param team Time (Masculino/Feminino)
 * @param fundamento Nome do fundamento (saque, recepção, etc)
 * @param limit Número máximo de atletas a retornar (padrão: 3)
 * @returns Lista ordenada dos melhores atletas no fundamento
 */
export function useTopAthletesByFundamento(
  team: TeamType, 
  fundamento: string, 
  limit: number = 3,
  dateRange?: { from: Date; to: Date }
) {
  return useQuery({
    queryKey: ['top-atletas-fundamento', team, fundamento, limit, dateRange?.from, dateRange?.to],
    queryFn: async () => {
      try {
        // Definir intervalo de datas padrão (últimos 30 dias) se não fornecido
        const dataInicio = dateRange?.from || new Date(new Date().setDate(new Date().getDate() - 30));
        const dataFim = dateRange?.to || new Date();

        // Buscar todos os eventos qualitativos para o fundamento específico
        let query = supabase
          .from('avaliacoes_eventos_qualificados')
          .select(`
            id,
            atleta_id,
            fundamento,
            tipo_evento,
            peso,
            timestamp,
            athletes:atleta_id (id, nome, time)
          `)
          .eq('fundamento', fundamento)
          .gte('timestamp', dataInicio.toISOString())
          .lte('timestamp', dataFim.toISOString())
          .order('timestamp', { ascending: false });
        
        const { data: eventos, error } = await query;
        
        if (error) {
          console.error('Erro ao buscar eventos qualificados:', error);
          return [];
        }
        
        // Filtrar para o time específico e agrupar por atleta
        const atletasPorId: Record<string, {
          id: string;
          nome: string;
          time: string;
          eventos: { peso: number; timestamp: string }[];
          somaPesos: number;
          totalEventos: number;
          ultimaData?: string;
        }> = {};
        
        eventos.forEach(evento => {
          if (!evento.athletes || evento.athletes.time !== team) return;
          
          const atletaId = evento.atleta_id;
          
          if (!atletasPorId[atletaId]) {
            atletasPorId[atletaId] = {
              id: atletaId,
              nome: evento.athletes.nome,
              time: evento.athletes.time,
              eventos: [],
              somaPesos: 0,
              totalEventos: 0,
              ultimaData: undefined
            };
          }
          
          const atleta = atletasPorId[atletaId];
          
          // Adicionar evento à lista do atleta
          atleta.eventos.push({
            peso: evento.peso,
            timestamp: evento.timestamp || ''
          });
          
          // Atualizar somatórios
          atleta.somaPesos += evento.peso;
          atleta.totalEventos += 1;
          
          // Atualizar data da última avaliação
          if (!atleta.ultimaData || (evento.timestamp && new Date(evento.timestamp) > new Date(atleta.ultimaData))) {
            atleta.ultimaData = evento.timestamp;
          }
        });
        
        // Calcular percentual e converter para o formato esperado
        const result: TopAthleteByFundamento[] = Object.values(atletasPorId)
          // Filtrar atletas com pelo menos 3 avaliações
          .filter(atleta => atleta.totalEventos >= 3)
          .map(atleta => {
            // Calcular média ponderada ((soma pesos / total eventos) + 3) * (100/6)
            // Isso converte a média de -3 a +3 para uma escala de 0 a 100%
            const mediaPonderada = atleta.totalEventos > 0 ? atleta.somaPesos / atleta.totalEventos : 0;
            const percentual = Math.max(0, Math.min(100, ((mediaPonderada + 3) / 6) * 100));
            
            // Calcular proporção de eventos positivos/negativos (para compatibilidade)
            const eventosPositivos = atleta.eventos.filter(e => e.peso > 0).length;
            
            return {
              id: atleta.id,
              nome: atleta.nome,
              percentual,
              totalExecucoes: atleta.totalEventos,
              acertos: eventosPositivos,
              ultimaData: atleta.ultimaData || '-'
            };
          })
          // Ordenar por percentual (maior para menor)
          .sort((a, b) => {
            // Primeiro critério: percentual de eficiência
            if (b.percentual !== a.percentual) {
              return b.percentual - a.percentual;
            }
            // Segundo critério: quantidade de execuções
            return b.totalExecucoes - a.totalExecucoes;
          })
          // Limitar ao número especificado
          .slice(0, limit);
        
        return result;
      } catch (error) {
        console.error(`Erro ao calcular ranking para ${fundamento}:`, error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
