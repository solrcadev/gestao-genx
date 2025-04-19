
import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Medal, Download, Expand } from 'lucide-react';
import AthleteRankingCard from './AthleteRankingCard';
import { TeamType } from '@/types';
import TeamPerformanceStats from './TeamPerformanceStats';
import { DateRange } from 'react-day-picker';

const fundamentos = [
  'Saque',
  'Passe',
  'Levantamento',
  'Ataque',
  'Bloqueio',
  'Defesa'
] as const;

const Rankings = () => {
  const [team, setTeam] = useState<TeamType>('Masculino');
  const [selectedFundamento, setSelectedFundamento] = useState<string>(fundamentos[0]);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date()
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="space-y-4">
        <Tabs defaultValue={team} onValueChange={(value) => setTeam(value as TeamType)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="Masculino">Masculino</TabsTrigger>
            <TabsTrigger value="Feminino">Feminino</TabsTrigger>
          </TabsList>
        </Tabs>

        <DatePickerWithRange 
          date={dateRange}
          onDateChange={(range) => setDateRange(range || { from: undefined, to: undefined })}
        />
      </div>

      {/* Team Stats Overview */}
      <TeamPerformanceStats 
        team={team}
        dateRange={dateRange as { from: Date; to: Date }}
      />

      {/* Rankings by Fundamento */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fundamentos.map((fundamento) => (
          <AthleteRankingCard
            key={fundamento}
            fundamento={fundamento}
            team={team}
            dateRange={dateRange as { from: Date; to: Date }}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => {}}>
          <Download className="h-4 w-4 mr-2" />
          Exportar PDF
        </Button>
        <Button variant="outline" onClick={() => {}}>
          <Expand className="h-4 w-4 mr-2" />
          Modo Apresentação
        </Button>
      </div>
    </div>
  );
};

export default Rankings;
