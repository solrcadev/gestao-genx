
import React from 'react';
import { TeamType, AthletePerformance } from '@/types';
import TeamPerformanceSummary from '../TeamPerformanceSummary';
import TopAthletesSection from '../TopAthletesSection';
import PerformanceAlerts from '../PerformanceAlerts';

interface TeamViewProps {
  team: TeamType;
  dateRange: { from: Date; to: Date };
  performanceData: AthletePerformance[];
  onSelectAthlete: (id: string) => void;
}

export function TeamView({ team, dateRange, performanceData, onSelectAthlete }: TeamViewProps) {
  // State for selected foundation
  const [fundamentoSelecionado, setFundamentoSelecionado] = React.useState<string>('saque');
  
  const mediasFundamentos = React.useMemo(() => {
    const fundamentos = [
      { nome: 'saque' as const, media: 0, totalExecucoes: 0 },
      { nome: 'recepção' as const, media: 0, totalExecucoes: 0 },
      { nome: 'levantamento' as const, media: 0, totalExecucoes: 0 },
      { nome: 'ataque' as const, media: 0, totalExecucoes: 0 },
      { nome: 'bloqueio' as const, media: 0, totalExecucoes: 0 },
      { nome: 'defesa' as const, media: 0, totalExecucoes: 0 }
    ];
    
    fundamentos.forEach(fundamento => {
      let somaPercentuais = 0;
      let somaExecucoes = 0;
      let atletasComFundamento = 0;
      
      performanceData.forEach(performance => {
        const avaliacaoFundamento = performance.avaliacoes.porFundamento[fundamento.nome];
        if (avaliacaoFundamento) {
          somaPercentuais += avaliacaoFundamento.percentualAcerto;
          somaExecucoes += avaliacaoFundamento.total;
          atletasComFundamento++;
        }
      });
      
      fundamento.media = atletasComFundamento > 0 ? somaPercentuais / atletasComFundamento : 0;
      fundamento.totalExecucoes = somaExecucoes;
    });
    
    return fundamentos;
  }, [performanceData]);

  return (
    <div className="space-y-8">
      <TeamPerformanceSummary mediasFundamentos={mediasFundamentos} />
      <TopAthletesSection
        fundamentoSelecionado={fundamentoSelecionado}
        setFundamentoSelecionado={setFundamentoSelecionado}
        topAtletas={[]} // This prop is now unused, data comes from the hook
        onSelectAthlete={onSelectAthlete}
        team={team}
        dateRange={dateRange}
      />
      <PerformanceAlerts
        alertas={[]}
        onSelectAthlete={onSelectAthlete}
      />
    </div>
  );
}
