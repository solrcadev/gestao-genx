import { Trophy, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Tipo para os fundamentos
type Fundamento = 'saque' | 'recepção' | 'levantamento' | 'ataque' | 'bloqueio' | 'defesa';

// Interface para os tops atletas
interface TopAtleta {
  id: string;
  nome: string;
  percentual: number;
  totalExecucoes: number;
  ultimaData: string;
}

interface TopAthletesSectionProps {
  fundamentoSelecionado: Fundamento;
  setFundamentoSelecionado: (fundamento: Fundamento) => void;
  topAtletas: TopAtleta[];
  onSelectAthlete: (id: string) => void;
}

const TopAthletesSection = ({ 
  fundamentoSelecionado, 
  setFundamentoSelecionado, 
  topAtletas, 
  onSelectAthlete 
}: TopAthletesSectionProps) => {
  
  // Função para determinar a cor com base no percentual
  const getColorByPercentage = (value: number) => {
    if (value >= 80) return "text-green-500";
    if (value >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <section>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" /> Top 3 Atletas
        </h2>
        <Select value={fundamentoSelecionado} onValueChange={(value) => setFundamentoSelecionado(value as Fundamento)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecione um fundamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="saque">Saque</SelectItem>
              <SelectItem value="recepção">Recepção</SelectItem>
              <SelectItem value="levantamento">Levantamento</SelectItem>
              <SelectItem value="ataque">Ataque</SelectItem>
              <SelectItem value="bloqueio">Bloqueio</SelectItem>
              <SelectItem value="defesa">Defesa</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      
      {topAtletas.length > 0 ? (
        <div className="space-y-3">
          {topAtletas.map((atleta, index) => (
            <Card key={atleta.id} className="overflow-hidden">
              <div className="p-4 flex items-center gap-4">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${index === 0 ? 'bg-yellow-100 text-yellow-800' : index === 1 ? 'bg-gray-100 text-gray-800' : 'bg-amber-100 text-amber-800'} font-bold`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{atleta.nome}</h3>
                  <div className="flex justify-between items-center mt-1">
                    <span className={`text-sm ${getColorByPercentage(atleta.percentual)}`}>
                      {atleta.percentual.toFixed(1).replace('.', ',')}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {atleta.totalExecucoes} execuções | Última: {atleta.ultimaData}
                    </span>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-0 h-8 w-8" 
                  onClick={() => onSelectAthlete(atleta.id)}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <Trophy className="h-10 w-10 mb-2 opacity-30" />
            <p>Sem avaliações para este fundamento</p>
          </div>
        </Card>
      )}
    </section>
  );
};

export default TopAthletesSection; 