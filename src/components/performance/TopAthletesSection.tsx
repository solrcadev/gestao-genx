
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MedalIcon, TrophyIcon, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useTopAthletesByFundamento } from '@/hooks/attendance-hooks';
import { TeamType } from '@/types';

// Define available foundations
const FUNDAMENTOS = [
  { value: 'saque', label: 'Saque' },
  { value: 'recepção', label: 'Recepção' },
  { value: 'levantamento', label: 'Levantamento' },
  { value: 'ataque', label: 'Ataque' },
  { value: 'bloqueio', label: 'Bloqueio' },
  { value: 'defesa', label: 'Defesa' },
];

// Interface for component props
interface TopAthletesSectionProps {
  fundamentoSelecionado: string;
  setFundamentoSelecionado: (fundamento: string) => void;
  topAtletas: any[];
  onSelectAthlete: (id: string) => void;
  team?: TeamType;
  dateRange?: { from: Date; to: Date };
}

// Helper function to format percentage
function formatarPercentual(valor: number): string {
  return `${valor.toFixed(1)}%`;
}

// Component for athlete position in ranking
const AthleteBadgePosition = ({ position }: { position: number }) => {
  const colors = ['bg-yellow-500', 'bg-gray-400', 'bg-amber-700'];
  const color = position <= 3 ? colors[position - 1] : 'bg-gray-500';
  
  return (
    <div className={`${color} w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs`}>
      {position}
    </div>
  );
};

const TopAthletesSection: React.FC<TopAthletesSectionProps> = ({
  fundamentoSelecionado,
  setFundamentoSelecionado,
  onSelectAthlete,
  team = 'Masculino',
  dateRange
}) => {
  // Use the new hook to fetch top athletes by foundation
  const { data: topAtletas = [], isLoading } = useTopAthletesByFundamento(
    team,
    fundamentoSelecionado,
    3,
    dateRange
  );

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center">
          <TrophyIcon className="h-5 w-5 mr-2 text-yellow-500" />
          Top 3 Atletas por Fundamento
        </CardTitle>
        
        <Select
          value={fundamentoSelecionado}
          onValueChange={setFundamentoSelecionado}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecione um fundamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {FUNDAMENTOS.map(fundamento => (
                <SelectItem key={fundamento.value} value={fundamento.value}>
                  {fundamento.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-5 w-12" />
              </div>
            ))}
          </div>
        ) : topAtletas.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>Sem avaliações registradas ainda.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {topAtletas.map((atleta, index) => (
              <div
                key={atleta.id}
                className="flex items-center bg-muted/40 p-3 rounded-lg hover:bg-muted/60 transition cursor-pointer"
                onClick={() => onSelectAthlete(atleta.id)}
              >
                <AthleteBadgePosition position={index + 1} />
                
                <div className="ml-3 flex-1">
                  <h4 className="text-sm font-medium">{atleta.nome}</h4>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <span>{atleta.totalExecucoes} avaliações</span>
                    <span className="mx-1">•</span>
                    <span>última: {atleta.ultimaData?.split('T')[0] || '-'}</span>
                  </div>
                </div>
                
                <Badge className={getEfficiencyBadgeColor(atleta.percentual)}>
                  {formatarPercentual(atleta.percentual)}
                </Badge>
              </div>
            ))}
            
            {topAtletas.length > 0 && (
              <div className="text-center pt-2">
                <Button 
                  variant="ghost" 
                  className="text-xs text-muted-foreground"
                  onClick={() => {}}
                >
                  <MedalIcon className="h-3 w-3 mr-1" /> Ver ranking completo
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Helper function to get badge color based on efficiency percentage
function getEfficiencyBadgeColor(percentual: number): string {
  if (percentual >= 80) return 'bg-green-500 hover:bg-green-600';
  if (percentual >= 70) return 'bg-emerald-500 hover:bg-emerald-600';
  if (percentual >= 60) return 'bg-blue-500 hover:bg-blue-600';
  if (percentual >= 50) return 'bg-yellow-500 hover:bg-yellow-600';
  if (percentual >= 40) return 'bg-orange-500 hover:bg-orange-600';
  return 'bg-red-500 hover:bg-red-600';
}

export default TopAthletesSection;
