
import React from 'react';
import { User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { AthletePerformance, TeamType } from '@/types';
import AthleteAnalysis from '../AthleteAnalysis';

interface IndividualViewProps {
  performanceData: AthletePerformance[];
  selectedAthleteId: string | null;
  setSelectedAthleteId: (id: string) => void;
  selectedAthlete: AthletePerformance | undefined;
  team: TeamType;
  onOpenDetailDrawer: () => void;
}

export function IndividualView({
  performanceData,
  selectedAthleteId,
  setSelectedAthleteId,
  selectedAthlete,
  team,
  onOpenDetailDrawer
}: IndividualViewProps) {
  return (
    <div className="space-y-6">
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Selecione um atleta</h2>
        <Select value={selectedAthleteId || ""} onValueChange={setSelectedAthleteId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um atleta" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {performanceData.map(performance => (
                <SelectItem key={performance.atleta.id} value={performance.atleta.id}>
                  {performance.atleta.nome}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Card>
      
      {selectedAthlete ? (
        <div className="space-y-6">
          <AthleteAnalysis
            performanceData={performanceData}
            selectedAthleteId={selectedAthleteId}
            setSelectedAthleteId={setSelectedAthleteId}
            selectedAthlete={selectedAthlete}
            mediasFundamentos={[]}
            team={team}
            onOpenDetailDrawer={onOpenDetailDrawer}
          />
          
          <Button 
            variant="outline"
            className="w-full"
            onClick={onOpenDetailDrawer}
          >
            Ver relatório completo
          </Button>
          
          <Link to={`/aluno/${selectedAthlete.atleta.id}/performance`} className="w-full">
            <Button 
              variant="default"
              className="w-full"
            >
              Ver desempenho detalhado
            </Button>
          </Link>
        </div>
      ) : (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <User className="h-10 w-10 mb-2 opacity-30" />
            <p>Selecione um atleta para ver os detalhes</p>
          </div>
        </Card>
      )}
    </div>
  );
}
