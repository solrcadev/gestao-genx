
import { supabase } from '@/lib/supabase';
import { TeamType } from '@/types';

export async function getAthleteStats(athleteId: string) {
  try {
    const { data: avgData, error: avgError } = await supabase
      .from('athlete_performance')
      .select('acertos')
      .eq('athlete_id', athleteId);

    if (avgError) throw avgError;

    const totalAcertos = avgData?.reduce((sum, item) => sum + item.acertos, 0) || 0;
    const mediaAcertos = avgData?.length ? totalAcertos / avgData.length : 0;

    const { data: maxData } = await supabase
      .from('athlete_performance')
      .select('pontuacao')
      .eq('athlete_id', athleteId)
      .order('pontuacao', { ascending: false })
      .limit(1);

    const { data: minData } = await supabase
      .from('athlete_performance')
      .select('pontuacao')
      .eq('athlete_id', athleteId)
      .order('pontuacao', { ascending: true })
      .limit(1);

    return {
      mediaAcertos,
      maiorPontuacao: maxData?.[0]?.pontuacao || 0,
      menorPontuacao: minData?.[0]?.pontuacao || 0,
    };
  } catch (error) {
    console.error('Error fetching athlete stats:', error);
    return {
      mediaAcertos: 0,
      maiorPontuacao: 0,
      menorPontuacao: 0,
    };
  }
}

export async function getMostFrequentAthletes(
  teamType: TeamType,
  startDate: Date,
  endDate: Date
): Promise<{ athleteId: string; nome: string; presencas: number }[]> {
  try {
    const { data: athletes } = await supabase
      .from('athletes')
      .select('id, nome')
      .eq('time', teamType);

    if (!athletes?.length) return [];

    const { data: treinos } = await supabase
      .from('treinos')
      .select('id')
      .gte('data', startDate.toISOString().split('T')[0])
      .lte('data', endDate.toISOString().split('T')[0]);

    if (!treinos?.length) return [];

    const treinoIds = treinos.map(treino => treino.id);

    const { data: presencas } = await supabase
      .from('treinos_atletas')
      .select('atleta_id, treino_id, presente')
      .in('treino_id', treinoIds)
      .eq('presente', true);

    if (!presencas) return [];

    const contagemPresencas: { [key: string]: number } = {};
    presencas.forEach(presenca => {
      contagemPresencas[presenca.atleta_id] = (contagemPresencas[presenca.atleta_id] || 0) + 1;
    });

    return athletes.map(athlete => ({
      athleteId: athlete.id,
      nome: athlete.nome,
      presencas: contagemPresencas[athlete.id] || 0,
    })).sort((a, b) => b.presencas - a.presencas);
  } catch (error) {
    console.error('Error fetching most frequent athletes:', error);
    return [];
  }
}
