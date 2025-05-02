
import React, { useMemo } from 'react';
import { TeamType, AthletePerformance } from '@/types';
import TeamPerformanceSummary from '../TeamPerformanceSummary';
import TopAthletesSection from '../TopAthletesSection';
import PerformanceAlerts from '../PerformanceAlerts';
import { useTopAtletasByFundamento } from '@/hooks/use-top-atletas';

interface TeamViewProps {
  team: TeamType;
  dateRange: { from: Date; to: Date };
  performanceData: AthletePerformance[];
  onSelectAthlete: (id: string) => void;
}

export function TeamView({ team, dateRange, performanceData, onSelectAthlete }: TeamViewProps) {
  // Estado para o fundamento selecionado no ranking
  const [fundamentoSelecionado, setFundamentoSelecionado] = React.useState<'saque' | 'recepção' | 'levantamento' | 'ataque' | 'bloqueio' | 'defesa'>('saque');
  
  // Buscar top atletas com o novo hook baseado em eventos qualitativos
  const { topAtletas, isLoading: loadingTopAtletas } = useTopAtletasByFundamento(
    fundamentoSelecionado,
    team,
    3 // Top 3 atletas
  );

  // Cálculo das médias de fundamentos baseado em dados qualitativos
  const mediasFundamentos = React.useMemo(() => {
    const fundamentos = [
      { nome: 'saque' as const, media: 0, totalExecucoes: 0 },
      { nome: 'recepção' as const, media: 0, totalExecucoes: 0 },
      { nome: 'levantamento' as const, media: 0, totalExecucoes: 0 },
      { nome: 'ataque' as const, media: 0, totalExecucoes: 0 },
      { nome: 'bloqueio' as const, media: 0, totalExecucoes: 0 },
      { nome: 'defesa' as const, media: 0, totalExecucoes: 0 }
    ];
    
    // Se não houver dados de performance, retornar fundamentos vazios
    if (!performanceData || performanceData.length === 0) {
      return fundamentos;
    }
    
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

  // Gerar alertas de desempenho com base nos dados qualitativos
  const alertas = useMemo(() => {
    if (!performanceData || performanceData.length === 0) return [];
    
    const alertasArray = [];
    
    performanceData.forEach(performance => {
      Object.entries(performance.avaliacoes.porFundamento).forEach(([fundamento, avaliacao]) => {
        const mediaEquipe = mediasFundamentos.find(f => f.nome === fundamento)?.media || 0;
        
        if (avaliacao.percentualAcerto < 60) {
          alertasArray.push({
            atletaId: performance.atleta.id,
            nome: performance.atleta.nome,
            fundamento: fundamento as any,
            percentual: avaliacao.percentualAcerto,
            mediaEquipe
          });
        }
      });
    });
    
    return alertasArray.slice(0, 5); // Limitando a 5 alertas
  }, [performanceData, mediasFundamentos]);

  return (
    <div className="space-y-8">
      <TeamPerformanceSummary mediasFundamentos={mediasFundamentos} />
      <TopAthletesSection
        fundamentoSelecionado={fundamentoSelecionado}
        setFundamentoSelecionado={setFundamentoSelecionado}
        topAtletas={topAtletas}
        onSelectAthlete={onSelectAthlete}
        isLoading={loadingTopAtletas}
      />
      <PerformanceAlerts
        alertas={alertas}
        onSelectAthlete={onSelectAthlete}
      />
    </div>
  );
}
