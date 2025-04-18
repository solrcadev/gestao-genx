
import React from 'react';
import { Search, X } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { TeamType } from '@/types';

interface PerformanceFiltersProps {
  team: TeamType;
  setTeam: (team: TeamType) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  dateRange: { from: Date; to: Date };
  setDateRange: (range: { from: Date; to: Date }) => void;
  activeTab: 'equipe' | 'individual' | 'ranking';
  setActiveTab: (tab: 'equipe' | 'individual' | 'ranking') => void;
}

export function PerformanceFilters({
  team,
  setTeam,
  searchQuery,
  setSearchQuery,
  dateRange,
  setDateRange,
  activeTab,
  setActiveTab
}: PerformanceFiltersProps) {
  return (
    <div className="sticky top-0 z-10 bg-background pt-2 pb-4 space-y-4 mb-6 shadow-sm">
      <Tabs defaultValue={team} onValueChange={(value) => setTeam(value as TeamType)} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="Masculino">Masculino</TabsTrigger>
          <TabsTrigger value="Feminino">Feminino</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div className="relative">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar atleta..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button 
            className="absolute right-2 top-1/2 transform -translate-y-1/2"
            onClick={() => setSearchQuery("")}
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>
      
      <DatePickerWithRange
        date={dateRange}
        onDateChange={(range) => {
          if (range?.from && range?.to) {
            setDateRange({ from: range.from, to: range.to });
          }
        }}
      />
      
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'equipe' | 'individual' | 'ranking')} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="equipe" className="flex items-center gap-2">
            <span>Equipe</span>
          </TabsTrigger>
          <TabsTrigger value="individual" className="flex items-center gap-2">
            <span>Individual</span>
          </TabsTrigger>
          <TabsTrigger value="ranking" className="flex items-center gap-2">
            <span>Ranking</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
