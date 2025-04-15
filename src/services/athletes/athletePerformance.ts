
import { supabase } from '@/lib/supabase';
import { AthletePerformance, TeamType } from '@/types';

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
