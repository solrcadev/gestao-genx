import React, { useState, useRef, useEffect } from 'react';
import { Medal, Calendar, Share2, Download, BarChart2, Trophy, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TeamType, AthletePerformance } from '@/types';
// Importar estilos específicos
import './ranking-styles.css';
// Importações dinâmicas para evitar erros em SSR ou durante a inicialização
const html2canvasPromise = import('html2canvas').then((module) => module.default);
const jsPDFPromise = import('jspdf').then((module) => module.default);

// Tipo para os fundamentos
type Fundamento = 'saque' | 'recepção' | 'levantamento' | 'ataque' | 'bloqueio' | 'defesa';

// Interface para os atletas no ranking
interface RankingAtleta {
  id: string;
  nome: string;
  percentual: number;
  totalExecucoes: number;
}

// Período para o ranking
type PeriodoRanking = '7dias' | '30dias' | 'personalizado';

interface AthleteRankingProps {
  performanceData: AthletePerformance[];
  team: TeamType;
}

const AthleteRanking: React.FC<AthleteRankingProps> = ({ performanceData, team }) => {
  console.log('AthleteRanking renderizando');
  const [periodoSelecionado, setPeriodoSelecionado] = useState<PeriodoRanking>('7dias');
  const [fundamento, setFundamento] = useState<Fundamento>('saque');
  const [dataInicio, setDataInicio] = useState<string>(getDateBefore(7));
  const [dataFim, setDataFim] = useState<string>(getToday());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const rankingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('AthleteRanking montado');
    return () => {
      console.log('AthleteRanking desmontado');
    };
  }, []);

  // Função para obter data de hoje formatada
  function getToday() {
    const date = new Date();
    return date.toISOString().split('T')[0];
  }

  // Função para obter data X dias atrás
  function getDateBefore(days: number) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }

  // Função para filtrar as avaliações pelo período selecionado
  function filtrarAvaliacoesPorPeriodo(performance: AthletePerformance) {
    const avaliacoesFiltradas = { ...performance.avaliacoes };
    const porFundamentoFiltrado: typeof performance.avaliacoes.porFundamento = {};
    
    // Convertemos as datas para objetos Date para comparação
    const dataInicioObj = new Date(dataInicio);
    const dataFimObj = new Date(dataFim);
    dataFimObj.setHours(23, 59, 59, 999); // Para incluir todo o último dia
    
    Object.entries(performance.avaliacoes.porFundamento).forEach(([f, avaliacao]) => {
      if (avaliacao.ultimaData) {
        try {
          // Assumindo que ultimaData já está formatada como DD/MM/YYYY
          const partes = avaliacao.ultimaData.split('/');
          const dataAvaliacao = new Date(
            parseInt(partes[2]), 
            parseInt(partes[1]) - 1, 
            parseInt(partes[0])
          );
          
          if (dataAvaliacao >= dataInicioObj && dataAvaliacao <= dataFimObj) {
            porFundamentoFiltrado[f] = avaliacao;
          }
        } catch (error) {
          console.error('Erro ao processar data:', error);
          // Em caso de erro, mantenha a avaliação original
          porFundamentoFiltrado[f] = avaliacao;
        }
      }
    });
    
    // Se não conseguir filtrar nenhuma avaliação, manter as originais para evitar tela vazia
    if (Object.keys(porFundamentoFiltrado).length === 0) {
      return performance.avaliacoes; 
    }
    
    avaliacoesFiltradas.porFundamento = porFundamentoFiltrado;
    return avaliacoesFiltradas;
  }

  // Atualizar o período quando mudar a seleção
  const handleChangePeriodo = (value: PeriodoRanking) => {
    setPeriodoSelecionado(value);
    
    if (value === '7dias') {
      setDataInicio(getDateBefore(7));
      setDataFim(getToday());
      setShowDatePicker(false);
    } else if (value === '30dias') {
      setDataInicio(getDateBefore(30));
      setDataFim(getToday());
      setShowDatePicker(false);
    } else if (value === 'personalizado') {
      setShowDatePicker(true);
    }
  };

  // Gerar o ranking de atletas para o fundamento atual
  const gerarRanking = (): RankingAtleta[] => {
    if (!performanceData) return [];
    
    const atletas: RankingAtleta[] = [];
    
    performanceData.forEach(athlete => {
      // Filtrar as avaliações pelo período
      const avaliacoesFiltradas = filtrarAvaliacoesPorPeriodo(athlete);
      
      if (
        avaliacoesFiltradas.porFundamento[fundamento] &&
        avaliacoesFiltradas.porFundamento[fundamento].total > 0
      ) {
        atletas.push({
          id: athlete.atleta.id,
          nome: athlete.atleta.nome,
          percentual: avaliacoesFiltradas.porFundamento[fundamento].percentualAcerto,
          totalExecucoes: avaliacoesFiltradas.porFundamento[fundamento].total
        });
      }
    });
    
    // Ordenar por percentual (decrescente)
    return atletas.sort((a, b) => b.percentual - a.percentual);
  };

  // Obter os top 3 atletas
  const topAtletas = gerarRanking().slice(0, 3);
  
  // Obter o pior fundamento da equipe
  const obterPiorFundamento = () => {
    if (!performanceData || performanceData.length === 0) return null;
    
    const fundamentos: { [key: string]: { soma: number, count: number } } = {
      'saque': { soma: 0, count: 0 },
      'recepção': { soma: 0, count: 0 },
      'levantamento': { soma: 0, count: 0 },
      'ataque': { soma: 0, count: 0 },
      'bloqueio': { soma: 0, count: 0 },
      'defesa': { soma: 0, count: 0 }
    };
    
    // Somar todos os percentuais por fundamento
    performanceData.forEach(athlete => {
      const avaliacoesFiltradas = filtrarAvaliacoesPorPeriodo(athlete);
      
      Object.entries(avaliacoesFiltradas.porFundamento).forEach(([nome, avaliacao]) => {
        if (fundamentos[nome] && avaliacao.total > 0) {
          fundamentos[nome].soma += avaliacao.percentualAcerto;
          fundamentos[nome].count += 1;
        }
      });
    });
    
    // Calcular as médias e encontrar o menor
    let piorFundamento: { nome: string, media: number } | null = null;
    
    Object.entries(fundamentos).forEach(([nome, { soma, count }]) => {
      if (count > 0) {
        const media = soma / count;
        if (piorFundamento === null || media < piorFundamento.media) {
          piorFundamento = { nome, media };
        }
      }
    });
    
    return piorFundamento;
  };
  
  // Obter o atleta com maior evolução
  const obterAtletaDestaque = () => {
    // Na implementação atual, vamos apenas usar o atleta top 1 do ranking
    // Em uma versão mais completa, poderíamos calcular a evolução comparando com rankings anteriores
    return topAtletas.length > 0 ? topAtletas[0] : null;
  };
  
  // Função para traduzir o nome do fundamento
  const traduzirFundamento = (fundamento: string) => {
    const traducoes: { [key: string]: string } = {
      'saque': 'Saque',
      'recepção': 'Recepção',
      'levantamento': 'Levantamento',
      'ataque': 'Ataque',
      'bloqueio': 'Bloqueio',
      'defesa': 'Defesa'
    };
    
    return traducoes[fundamento] || fundamento;
  };
  
  // Exportar ranking para PDF
  const exportarPDF = async () => {
    if (!rankingRef.current) return;
    
    try {
      const html2canvas = await html2canvasPromise;
      const jsPDF = await jsPDFPromise;
      
      const canvas = await html2canvas(rankingRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Adicionar título
      pdf.setFontSize(18);
      pdf.text(`Ranking de ${traduzirFundamento(fundamento)} - Time ${team}`, 15, 15);
      
      // Adicionar período
      pdf.setFontSize(12);
      pdf.text(`Período: ${new Date(dataInicio).toLocaleDateString('pt-BR')} a ${new Date(dataFim).toLocaleDateString('pt-BR')}`, 15, 25);
      
      // Adicionar imagem
      const imgWidth = 180;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      pdf.addImage(imgData, 'PNG', 15, 35, imgWidth, imgHeight);
      
      // Salvar o PDF
      pdf.save(`ranking-${fundamento}-${team}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    }
  };
  
  // Compartilhar ranking
  const compartilhar = async () => {
    if (!rankingRef.current) return;
    
    try {
      const html2canvas = await html2canvasPromise;
      const canvas = await html2canvas(rankingRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      
      // Verificar se a API de compartilhamento está disponível
      if (navigator.share) {
        const blob = await (await fetch(imgData)).blob();
        const file = new File([blob], `ranking-${fundamento}-${team}.png`, { type: 'image/png' });
        
        await navigator.share({
          title: `Ranking de ${traduzirFundamento(fundamento)} - Time ${team}`,
          text: `Confira o ranking de ${traduzirFundamento(fundamento)} do time ${team}!`,
          files: [file]
        });
      } else {
        // Fallback: abrir em nova aba
        const image = new Image();
        image.src = imgData;
        
        const w = window.open("");
        w?.document.write(image.outerHTML);
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    }
  };
  
  // Alterna o modo tela cheia
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Obter cores baseadas na posição
  const getPositionColor = (position: number) => {
    switch (position) {
      case 0: return "text-yellow-500 bg-yellow-100";
      case 1: return "text-gray-500 bg-gray-100";
      case 2: return "text-amber-500 bg-amber-100";
      default: return "text-muted-foreground";
    }
  };
  
  // Obter o ícone da medalha baseado na posição
  const getMedalIcon = (position: number) => {
    switch (position) {
      case 0: return <Medal className="h-6 w-6 text-yellow-500" />;
      case 1: return <Medal className="h-6 w-6 text-gray-500" />;
      case 2: return <Medal className="h-6 w-6 text-amber-500" />;
      default: return null;
    }
  };
  
  const atletaDestaque = obterAtletaDestaque();
  const piorFundamento = obterPiorFundamento();

  return (
    <div className={`space-y-6 ${isFullscreen ? 'fixed top-0 left-0 w-full h-full z-50 bg-background p-4 overflow-y-auto' : ''}`}>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" /> Ranking de Atletas
        </h2>
        <Button variant="outline" size="sm" onClick={toggleFullscreen}>
          {isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
        </Button>
      </div>
      
      {/* Filtros */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center gap-2">
          <Tabs defaultValue="7dias" onValueChange={(v) => handleChangePeriodo(v as PeriodoRanking)} className="flex-1">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="7dias" className="text-xs sm:text-sm">
                <Calendar className="h-3 w-3 mr-1" /> Últimos 7 dias
              </TabsTrigger>
              <TabsTrigger value="30dias" className="text-xs sm:text-sm">
                <Calendar className="h-3 w-3 mr-1" /> Últimos 30 dias
              </TabsTrigger>
              <TabsTrigger value="personalizado" className="text-xs sm:text-sm">
                <Calendar className="h-3 w-3 mr-1" /> Personalizado
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {showDatePicker && (
          <div className="flex gap-2 items-center">
            <div className="flex-1">
              <label className="text-xs mb-1 block">Data início</label>
              <input 
                type="date" 
                value={dataInicio} 
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs mb-1 block">Data fim</label>
              <input 
                type="date" 
                value={dataFim} 
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        )}
        
        <Select value={fundamento} onValueChange={(value) => setFundamento(value as Fundamento)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione um fundamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="saque">Saque</SelectItem>
            <SelectItem value="recepção">Recepção</SelectItem>
            <SelectItem value="levantamento">Levantamento</SelectItem>
            <SelectItem value="ataque">Ataque</SelectItem>
            <SelectItem value="bloqueio">Bloqueio</SelectItem>
            <SelectItem value="defesa">Defesa</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Atleta Destaque e Pior Fundamento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {atletaDestaque && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" /> Atleta em Destaque
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  {atletaDestaque.nome.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{atletaDestaque.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    {atletaDestaque.percentual.toFixed(1).replace('.', ',')}% de acertos em {traduzirFundamento(fundamento)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {piorFundamento && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" /> Fundamento com Dificuldade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <BarChart2 className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="font-medium">{traduzirFundamento(piorFundamento.nome)}</p>
                  <p className="text-sm text-muted-foreground">
                    Média de {piorFundamento.media.toFixed(1).replace('.', ',')}% de acertos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Ranking de Atletas */}
      <div ref={rankingRef} className="space-y-4 p-4 bg-white rounded-lg">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold">Ranking de {traduzirFundamento(fundamento)}</h3>
          <p className="text-sm text-muted-foreground">Time {team}</p>
          <Badge variant="outline" className="mt-2">
            {new Date(dataInicio).toLocaleDateString('pt-BR')} a {new Date(dataFim).toLocaleDateString('pt-BR')}
          </Badge>
        </div>
        
        {topAtletas.length > 0 ? (
          <div className="space-y-4">
            {topAtletas.map((atleta, index) => (
              <div 
                key={atleta.id} 
                className="flex items-center gap-3 p-4 border rounded-lg"
              >
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${getPositionColor(index)}`}>
                  {getMedalIcon(index)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">{atleta.nome}</h4>
                    <span className="text-lg font-bold text-primary">
                      {atleta.percentual.toFixed(1).replace('.', ',')}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div 
                      className="bg-primary h-2.5 rounded-full" 
                      style={{ width: `${atleta.percentual}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-muted-foreground">
                      {atleta.totalExecucoes} execuções
                    </span>
                    <span className="text-xs font-medium">
                      {index === 0 ? '1º lugar' : index === 1 ? '2º lugar' : '3º lugar'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <Trophy className="h-10 w-10 mx-auto mb-2 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">Sem dados para este fundamento no período selecionado</p>
          </div>
        )}
      </div>
      
      {/* Botões de exportação */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={compartilhar}>
          <Share2 className="h-4 w-4 mr-2" /> Compartilhar
        </Button>
        <Button onClick={exportarPDF}>
          <Download className="h-4 w-4 mr-2" /> Exportar PDF
        </Button>
      </div>
    </div>
  );
};

export default AthleteRanking; 