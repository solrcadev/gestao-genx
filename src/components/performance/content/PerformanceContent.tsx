
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AthletePerformance, TeamType } from '@/types';
import { Rankings } from '../Rankings';
import { TeamView } from './TeamView';
import { IndividualView } from './IndividualView';

interface PerformanceContentProps {
  isLoading: boolean;
  error: Error | null;
  errorMessage: string | null;
  refetch: () => void;
  performanceData: AthletePerformance[] | undefined;
  activeTab: 'equipe' | 'individual' | 'ranking';
  team: TeamType;
  dateRange: { from: Date; to: Date };
  selectedAthleteId: string | null;
  setSelectedAthleteId: (id: string) => void;
  selectedAthlete: AthletePerformance | undefined;
  isDetailOpen: boolean;
  setIsDetailOpen: (open: boolean) => void;
}

export function PerformanceContent({
  isLoading,
  error,
  errorMessage,
  refetch,
  performanceData,
  activeTab,
  team,
  dateRange,
  selectedAthleteId,
  setSelectedAthleteId,
  selectedAthlete,
  isDetailOpen,
  setIsDetailOpen
}: PerformanceContentProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {Array(6).fill(0).map((_, index) => (
          <Skeleton key={index} className="h-[200px] w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-destructive">Erro ao carregar dados de desempenho</p>
        {errorMessage && (
          <p className="text-sm text-muted-foreground mt-2 mb-4 text-center">
            {errorMessage}
          </p>
        )}
        <div className="space-y-4">
          <Button onClick={() => refetch()} variant="outline" className="mt-2">
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  if (!performanceData || performanceData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Não há dados de desempenho disponíveis para este time</p>
        <p className="text-sm text-muted-foreground mt-2 mb-4">
          Adicione atletas e registre avaliações para visualizar o desempenho.
        </p>
      </div>
    );
  }

  switch (activeTab) {
    case 'equipe':
      return (
        <TeamView
          team={team}
          dateRange={dateRange}
          performanceData={performanceData}
          onSelectAthlete={setSelectedAthleteId}
        />
      );
    case 'individual':
      return (
        <IndividualView
          performanceData={performanceData}
          selectedAthleteId={selectedAthleteId}
          setSelectedAthleteId={setSelectedAthleteId}
          selectedAthlete={selectedAthlete}
          team={team}
          onOpenDetailDrawer={() => setIsDetailOpen(true)}
        />
      );
    case 'ranking':
      return <Rankings />;
    default:
      return null;
  }
}
