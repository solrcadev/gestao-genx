import { supabase } from '@/lib/supabase';
import { AthletePerformance, TeamType, Athlete } from '@/types';

export async function getAthletePerformance(
  athleteId: string,
  startDate: Date,
  endDate: Date
): Promise<AthletePerformance[]> {
  try {
    const { data, error } = await supabase
      .from('athlete_performance')
      .select('*')
      .eq('athlete_id', athleteId)
      .gte('date', startDate.toISOString())
      .lte('date', endDate.toISOString())
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching athlete performance:', error);
    return [];
  }
}

export async function getTeamPerformance(
  teamType: TeamType,
  startDate: Date,
  endDate: Date
): Promise<AthletePerformance[]> {
  try {
    const { data: athletes } = await supabase
      .from('athletes')
      .select('id')
      .eq('time', teamType);

    if (!athletes?.length) return [];

    const athleteIds = athletes.map(athlete => athlete.id);

    const { data, error } = await supabase
      .from('athlete_performance')
      .select('*')
      .in('athlete_id', athleteIds)
      .gte('date', startDate.toISOString())
      .lte('date', endDate.toISOString())
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching team performance:', error);
    return [];
  }
}

const mapAthleteData = (data: any): Athlete => ({
  id: data.id,
  nome: data.nome,
  posicao: data.posicao,
  time: data.time,
  idade: data.idade,
  altura: data.altura,
  created_at: data.created_at || new Date().toISOString(),
  foto_url: data.foto_url || null
});

// Mock function to get athletes performance - used by Performance.tsx
export async function getAthletesPerformance(teamType: TeamType): Promise<AthletePerformance[]> {
  try {
    // In a real implementation, this would fetch data from the database
    // For now, we'll return mock data
    return [
      {
        atleta: mapAthleteData({
          id: '1',
          nome: 'João Silva',
          posicao: 'Levantador',
          time: teamType,
          idade: 22,
          altura: 1.85,
          created_at: new Date().toISOString(),
          foto_url: null
        }),
        presenca: {
          total: 20,
          presentes: 18,
          percentual: 90
        },
        avaliacoes: {
          total: 15,
          mediaNota: 85,
          porFundamento: {
            'saque': {
              acertos: 45,
              erros: 15,
              total: 60,
              percentualAcerto: 75,
              ultimaData: '2023-05-01'
            },
            'levantamento': {
              acertos: 120,
              erros: 10,
              total: 130,
              percentualAcerto: 92,
              ultimaData: '2023-05-02'
            }
          }
        },
        ultimasAvaliacoes: []
      },
      {
        atleta: mapAthleteData({
          id: '2',
          nome: 'Maria Oliveira',
          posicao: 'Ponteiro',
          time: teamType,
          idade: 20,
          altura: 1.78,
          created_at: new Date().toISOString(),
          foto_url: null
        }),
        presenca: {
          total: 20,
          presentes: 16,
          percentual: 80
        },
        avaliacoes: {
          total: 12,
          mediaNota: 70,
          porFundamento: {
            'saque': {
              acertos: 30,
              erros: 20,
              total: 50,
              percentualAcerto: 60,
              ultimaData: '2023-05-01'
            },
            'ataque': {
              acertos: 80,
              erros: 30,
              total: 110,
              percentualAcerto: 73,
              ultimaData: '2023-05-02'
            }
          }
        },
        ultimasAvaliacoes: []
      }
    ];
  } catch (error) {
    console.error('Error fetching athletes performance:', error);
    return [];
  }
}
