import { useQuery } from '@tanstack/react-query';
import { fetchPresencasAtletas } from '@/services/treinosDoDiaService';

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