import React, { useState, useRef, useEffect } from 'react';
import { Medal, Calendar, FileDown, Share2, Maximize2, Minimize2, Trophy, AlertTriangle, Star, HelpCircle, Info, ArrowDownUp, BarChart2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TeamType, AthletePerformance } from '@/types';
import { Input } from '@/components/ui/input';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import './ranking-styles.css';
import RankingExportView from './RankingExportView';
import ExportRankingButton from '@/components/ui/export-ranking-button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { buscarAvaliacoesQualitativas, gerarRankingCombinado, AvaliacaoQualitativa, RankingCombinado, PESOS_PADRAO } from '@/services/rankingQualitativoService';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';

/**
 * Componente RankingFundamentos
 * 
 * Este componente exibe um ranking dos Top 3 atletas por fundamento técnico do voleibol.
 * Recursos:
 * - Filtros por período (7 dias, 30 dias ou personalizado)
 * - Seleção de fundamento (saque, passe, levantamento, ataque, bloqueio, defesa)
 * - Cálculo automático da média geral do fundamento
 * - Exibição de destaques (melhor atleta e maior desafio da equipe)
 * - Exportação do ranking em PDF
 * - Compartilhamento do ranking como imagem
 * - Modo tela cheia para projeção em TV
 * 
 * @param performanceData - Dados de desempenho dos atletas
 * @param team - Tipo de time (Masculino/Feminino)
 */

// Tipos
type PeriodoRanking = '7dias' | '30dias' | 'personalizado';
type Fundamento = 'saque' | 'passe' | 'levantamento' | 'ataque' | 'bloqueio' | 'defesa';
type OrdenacaoRanking = 'scoreTotal' | 'quantitativo' | 'qualitativo';

// Interface para os atletas no ranking
interface RankingAtleta {
  id: string;
  nome: string;
  percentual: number;
  totalExecucoes: number;
  // Campos para avaliação qualitativa
  notaQualitativa?: number;
  scoreTotal?: number;
  totalAvaliacoesQualitativas?: number;
  avaliacaoDescritiva?: string;
  posicao?: number; // Adicionado para exibir a posição no ranking
}

// Pesos para cálculo de ranking por tipo (geral vs. por fundamento)
type PesosRankingConfig = {
  geral: {
    quantitativo: number;
    qualitativo: number;
  };
  fundamento: {
    quantitativo: number;
    qualitativo: number;
  };
};

// Pesos configuráveis para o cálculo de ranking
const PESOS_RANKING: PesosRankingConfig = {
  geral: {
    quantitativo: 0.7, // 70% para ranking geral
    qualitativo: 0.3  // 30% para ranking geral
  },
  fundamento: {
    quantitativo: 0.6, // 60% para ranking por fundamento
    qualitativo: 0.4  // 40% para ranking por fundamento
  }
};

interface RankingFundamentosProps {
  performanceData: AthletePerformance[];
  team: TeamType;
}

const RankingFundamentos: React.FC<RankingFundamentosProps> = ({ performanceData, team }) => {
  const [periodoSelecionado, setPeriodoSelecionado] = useState<PeriodoRanking>('7dias');
  const [fundamento, setFundamento] = useState<Fundamento>('saque');
  const [dataInicio, setDataInicio] = useState<string>(getDateBefore(7));
  const [dataFim, setDataFim] = useState<string>(getToday());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [exibirSeletorDatas, setExibirSeletorDatas] = useState(false);
  const [dataInicioTemp, setDataInicioTemp] = useState(new Date(getDateBefore(7)));
  const [dataFimTemp, setDataFimTemp] = useState(new Date(getToday()));
  
  // Estados para ordenação e filtros do ranking refinado
  const [apenasComAvaliacaoQualitativa, setApenasComAvaliacaoQualitativa] = useState(false);
  const [exibirInfoRanking, setExibirInfoRanking] = useState(false);
  const [ordenacao, setOrdenacao] = useState<OrdenacaoRanking>('scoreTotal');
  const [quantidadeAtletasExibidos, setQuantidadeAtletasExibidos] = useState(3); // Top 3 por padrão
  
  const rankingRef = useRef<HTMLDivElement>(null);
  const exportViewRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  
  // Buscar avaliações qualitativas
  const { data: avaliacoesQualitativas = [], isLoading: isLoadingQualitativas } = useQuery({
    queryKey: ['avaliacoes-qualitativas', team, fundamento, dataInicio, dataFim],
    queryFn: () => buscarAvaliacoesQualitativas(team, fundamento?.toLowerCase() === 'passe' ? 'recepção' : fundamento, dataInicio, dataFim),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Log para depuração das avaliações qualitativas
  useEffect(() => {
    if (avaliacoesQualitativas && avaliacoesQualitativas.length > 0) {
      console.log(`Avaliações qualitativas disponíveis: ${avaliacoesQualitativas.length}`);
      console.log('Exemplo de avaliação:', avaliacoesQualitativas[0]);
    } else {
      console.log('Nenhuma avaliação qualitativa encontrada para os filtros aplicados');
    }
  }, [avaliacoesQualitativas]);

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
          // Assumindo que ultimaData está no formato ISO ou DD/MM/YYYY
          let dataAvaliacao: Date;
          if (avaliacao.ultimaData.includes('/')) {
            // Formato DD/MM/YYYY
            const partes = avaliacao.ultimaData.split('/');
            dataAvaliacao = new Date(
              parseInt(partes[2]), 
              parseInt(partes[1]) - 1, 
              parseInt(partes[0])
            );
          } else {
            // Formato ISO
            dataAvaliacao = new Date(avaliacao.ultimaData);
          }
          
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
    
    avaliacoesFiltradas.porFundamento = porFundamentoFiltrado;
    return avaliacoesFiltradas;
  }

  // Atualizar o período quando mudar a seleção
  const handleChangePeriodo = (value: PeriodoRanking) => {
    setPeriodoSelecionado(value);
    
    if (value === '7dias') {
      const novaDataInicio = getDateBefore(7);
      const novaDataFim = getToday();
      
      setDataInicio(novaDataInicio);
      setDataFim(novaDataFim);
      
      // Atualizar também as datas temporárias para o seletor
      setDataInicioTemp(new Date(novaDataInicio));
      setDataFimTemp(new Date(novaDataFim));
      
      console.log(`Período atualizado para 7 dias: ${novaDataInicio} a ${novaDataFim}`);
    } else if (value === '30dias') {
      const novaDataInicio = getDateBefore(30);
      const novaDataFim = getToday();
      
      setDataInicio(novaDataInicio);
      setDataFim(novaDataFim);
      
      // Atualizar também as datas temporárias para o seletor
      setDataInicioTemp(new Date(novaDataInicio));
      setDataFimTemp(new Date(novaDataFim));
      
      console.log(`Período atualizado para 30 dias: ${novaDataInicio} a ${novaDataFim}`);
    }
  };

  // Gerar o ranking de atletas para o fundamento atual
  const gerarRanking = (): RankingAtleta[] => {
    if (!performanceData || performanceData.length === 0) return [];
    
    const atletasQuantitativos: { id: string, nome: string, percentual: number, totalExecucoes: number }[] = [];
    
    performanceData.forEach(athlete => {
      // Filtrar as avaliações pelo período
      const avaliacoesFiltradas = filtrarAvaliacoesPorPeriodo(athlete);
      
      // Tratamento específico para recepção/passe (sinônimos no sistema)
      const fundamentoNormalizado = fundamento === 'passe' ? 
        ['passe', 'recepção'] : 
        [fundamento];
      
      // Verificar se o atleta tem avaliações no fundamento atual
      const temFundamento = fundamentoNormalizado.some(f => 
        avaliacoesFiltradas.porFundamento[f] && 
        avaliacoesFiltradas.porFundamento[f].total > 0
      );
      
      if (temFundamento) {
        // Se for passe, precisamos verificar qual dos fundamentos está disponível
        let dadosFundamento;
        
        if (fundamento === 'passe') {
          // Verificar se existe avaliação para 'passe'
          if (avaliacoesFiltradas.porFundamento['passe'] && 
              avaliacoesFiltradas.porFundamento['passe'].total > 0) {
            dadosFundamento = avaliacoesFiltradas.porFundamento['passe'];
          } 
          // Ou para 'recepção'
          else if (avaliacoesFiltradas.porFundamento['recepção'] && 
                   avaliacoesFiltradas.porFundamento['recepção'].total > 0) {
            dadosFundamento = avaliacoesFiltradas.porFundamento['recepção'];
          }
        } else {
          // Para outros fundamentos, usar diretamente
          dadosFundamento = avaliacoesFiltradas.porFundamento[fundamento];
        }
        
        // Verificar se o atleta tem pelo menos 5 tentativas (execuções)
        if (dadosFundamento && dadosFundamento.total >= 5) {
          // Calcular eficiência corretamente (acertos / total * 100)
          const acertos = dadosFundamento.acertos;
          const total = dadosFundamento.total;
          const eficiencia = (acertos / total) * 100;
          
          atletasQuantitativos.push({
            id: athlete.atleta.id,
            nome: athlete.atleta.nome,
            percentual: eficiencia,
            totalExecucoes: total
          });
        }
      }
    });
    
    // Log para depuração
    console.log(`Atletas com dados quantitativos: ${atletasQuantitativos.length}`);
    
    // Usar os pesos para fundamento específico conforme a configuração
    const pesosAplicados = {
      quantitativo: PESOS_RANKING.fundamento.quantitativo,
      qualitativo: PESOS_RANKING.fundamento.qualitativo
    };
    
    console.log(`Aplicando pesos para ranking: Quantitativo=${pesosAplicados.quantitativo}, Qualitativo=${pesosAplicados.qualitativo}`);
    
    // Gerar ranking combinado (quantitativo + qualitativo)
    const rankingCombinado = gerarRankingCombinado(
      atletasQuantitativos,
      avaliacoesQualitativas,
      pesosAplicados
    );
    
    console.log(`Ranking combinado gerado com ${rankingCombinado.length} atletas`);
    
    // Debug das notas qualitativas
    if (rankingCombinado.length > 0) {
      rankingCombinado.forEach((atleta, idx) => {
        if (idx < 5) { // Mostra apenas os 5 primeiros para não poluir o console
          console.log(`${atleta.atleta_nome}: Quant=${atleta.percentual_quantitativo.toFixed(1)}%, Qual=${atleta.nota_qualitativa.toFixed(1)}%, Score=${atleta.score_total.toFixed(1)}%`);
        }
      });
    }
    
    // Mapear para o formato RankingAtleta
    let atletas: RankingAtleta[] = rankingCombinado.map(item => ({
      id: item.atleta_id,
      nome: item.atleta_nome,
      percentual: item.percentual_quantitativo,
      totalExecucoes: item.total_execucoes,
      notaQualitativa: item.nota_qualitativa,
      scoreTotal: item.score_total,
      totalAvaliacoesQualitativas: item.total_avaliacoes_qualitativas,
      avaliacaoDescritiva: item.avaliacao_descritiva
    }));
    
    // Filtrar apenas atletas com avaliação qualitativa se o filtro estiver ativo
    const atletasFiltrados = apenasComAvaliacaoQualitativa
      ? atletas.filter(a => a.totalAvaliacoesQualitativas && a.totalAvaliacoesQualitativas > 0)
      : atletas;
    
    // Ordenar conforme critério selecionado
    atletasFiltrados.sort((a, b) => {
      switch (ordenacao) {
        case 'quantitativo':
          // Ordenar por percentual quantitativo
          return b.percentual - a.percentual;
          
        case 'qualitativo':
          // Ordenar por nota qualitativa (se disponível)
          // Se não houver nota qualitativa, colocar no final da lista
          if (a.notaQualitativa === undefined && b.notaQualitativa === undefined) return 0;
          if (a.notaQualitativa === undefined) return 1;
          if (b.notaQualitativa === undefined) return -1;
          return b.notaQualitativa - a.notaQualitativa;
          
        case 'scoreTotal':
        default:
          // Ordenar por score total (padrão)
          const scoreA = a.scoreTotal !== undefined ? a.scoreTotal : a.percentual;
          const scoreB = b.scoreTotal !== undefined ? b.scoreTotal : b.percentual;
          
          // Primeiro critério: score total
          if (scoreB !== scoreA) {
            return scoreB - scoreA;
          }
          
          // Segundo critério: número de execuções
          if (b.totalExecucoes !== a.totalExecucoes) {
            return b.totalExecucoes - a.totalExecucoes;
          }
          
          // Terceiro critério: ordem alfabética
          return a.nome.localeCompare(b.nome);
      }
    });
    
    // Adicionar posição no ranking
    atletasFiltrados.forEach((atleta, index) => {
      atleta.posicao = index;
    });
    
    // Log para os atletas filtrados
    console.log(`Atletas após filtragem e ordenação: ${atletasFiltrados.length}`);
    
    return atletasFiltrados;
  };

  // Obter os top atletas com a quantidade configurada
  const topAtletas = gerarRanking().slice(0, quantidadeAtletasExibidos);
  
  // Obter o pior fundamento da equipe
  const obterPiorFundamento = () => {
    if (!performanceData || performanceData.length === 0) return null;
    
    const fundamentos: { [key in Fundamento]?: { soma: number, count: number } } = {
      'saque': { soma: 0, count: 0 },
      'passe': { soma: 0, count: 0 },
      'levantamento': { soma: 0, count: 0 },
      'ataque': { soma: 0, count: 0 },
      'bloqueio': { soma: 0, count: 0 },
      'defesa': { soma: 0, count: 0 }
    };
    
    // Somar todos os percentuais por fundamento
    performanceData.forEach(athlete => {
      const avaliacoesFiltradas = filtrarAvaliacoesPorPeriodo(athlete);
      
      Object.entries(avaliacoesFiltradas.porFundamento).forEach(([nome, avaliacao]) => {
        const nomeAjustado = nome === 'recepção' ? 'passe' : nome;
        if (fundamentos[nomeAjustado as Fundamento] && avaliacao.total > 0) {
          fundamentos[nomeAjustado as Fundamento]!.soma += avaliacao.percentualAcerto;
          fundamentos[nomeAjustado as Fundamento]!.count += 1;
        }
      });
    });
    
    // Calcular as médias e encontrar o menor
    let piorFundamento: { nome: Fundamento, media: number } | null = null;
    
    Object.entries(fundamentos).forEach(([nome, dados]) => {
      if (dados && dados.count > 0) {
        const media = dados.soma / dados.count;
        if (piorFundamento === null || media < piorFundamento.media) {
          piorFundamento = { nome: nome as Fundamento, media };
        }
      }
    });
    
    return piorFundamento;
  };
  
  // Obter o atleta com maior evolução
  const obterAtletaDestaque = () => {
    // Na implementação atual, vamos apenas usar o atleta top 1 do ranking
    return topAtletas.length > 0 ? topAtletas[0] : null;
  };
  
  // Função para traduzir o fundamento
  const traduzirFundamento = (fundamento: Fundamento): string => {
    const traducoes: Record<Fundamento, string> = {
      'saque': 'Saque',
      'passe': 'Passe',
      'levantamento': 'Levantamento',
      'ataque': 'Ataque',
      'bloqueio': 'Bloqueio',
      'defesa': 'Defesa'
    };
    
    return traducoes[fundamento] || fundamento;
  };
  
  // Exportar ranking para PDF (atualizado)
  const exportarPDF = async () => {
    if (!exportViewRef.current) return;
    
    try {
      // Aumentar a escala para melhorar a resolução e ajustar outras configurações
      const canvas = await html2canvas(exportViewRef.current, { 
        scale: 3, // Aumentado para 3x para alta resolução
        backgroundColor: '#1E3A8A',
        logging: false,
        useCORS: true,
        allowTaint: true,
        removeContainer: true,
        imageTimeout: 0,
        foreignObjectRendering: false, // Desativar para evitar problemas de compatibilidade
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0
      });
      
      const imgData = canvas.toDataURL('image/png', 1.0); // Qualidade máxima
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: false // Evitar compressão para manter a qualidade
      });
      
      // Calcular dimensões mantendo a proporção
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Calcular proporção para ajustar à página
      const imgWidth = pageWidth - 10; // Margens menores para maior tamanho de imagem
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Centralizar a imagem na página
      const x = 5; // Margem de 5mm
      const y = 5; // Posicionar mais ao topo para maximizar o espaço
      
      // Adicionar imagem com configurações para alta qualidade
      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight, undefined, 'FAST');
      
      // Salvar o PDF
      pdf.save(`ranking-${fundamento}-${team}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      // Tentar abordagem alternativa em caso de erro
      console.log('Tentando abordagem alternativa para gerar PDF...');
      
      try {
        // Abordagem alternativa mais simples
        const element = exportViewRef.current;
        
        // Criar um clone do elemento para preservar o original
        const clone = element.cloneNode(true) as HTMLElement;
        document.body.appendChild(clone);
        
        // Aplicar estilos diretamente ao clone para minimizar problemas de renderização
        clone.style.backgroundColor = '#1E3A8A';
        clone.style.padding = '20px';
        clone.style.position = 'absolute';
        clone.style.left = '-9999px';
        clone.style.width = '600px';
        
        // Usar renderização mais simples mas com alta resolução
        const canvas = await html2canvas(clone, {
          scale: 4, // Aumentado para 4x para maior resolução no método alternativo
          backgroundColor: '#1E3A8A',
          allowTaint: true,
          useCORS: true,
          logging: false,
          imageTimeout: 0
        });
        
        // Remover o clone depois de usado
        document.body.removeChild(clone);
        
        const imgData = canvas.toDataURL('image/png', 1.0);
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        // Usar mais da página disponível
        pdf.addImage(imgData, 'PNG', 2, 2, pdfWidth-4, pdfHeight-4, undefined, 'FAST');
        pdf.save(`ranking-${fundamento}-${team}.pdf`);
      } catch (fallbackError) {
        console.error('Erro na abordagem alternativa:', fallbackError);
      }
    }
  };
  
  // Compartilhar o ranking como imagem (atualizado)
  const compartilhar = async () => {
    if (!exportViewRef.current) return;
    
    try {
      // Configurações com alta resolução para compartilhamento
      const canvas = await html2canvas(exportViewRef.current, { 
        scale: 4, // Aumentado para 4x para qualidade ainda maior em imagens compartilhadas
        backgroundColor: '#1E3A8A',
        logging: false,
        useCORS: true,
        allowTaint: true,
        removeContainer: true,
        foreignObjectRendering: false
      });
      
      const imgData = canvas.toDataURL('image/png', 1.0); // Qualidade máxima
      
      // Criar um blob a partir da URL de dados
      const blob = await (await fetch(imgData)).blob();
      
      // Criar um objeto File para compartilhamento
      const file = new File([blob], `ranking-${fundamento}-${team}.png`, { type: 'image/png' });
      
      // Verificar se o navegador suporta a API de compartilhamento
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Ranking de ${traduzirFundamento(fundamento)} - Time ${team}`,
          files: [file]
        });
      } else {
        // Fallback para download se o compartilhamento não for suportado
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `ranking-${fundamento}-${team}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Erro ao compartilhar ranking:', error);
      
      // Tentar abordagem alternativa com foco em alta qualidade
      try {
        const element = exportViewRef.current;
        
        // Criar um clone do elemento para preservar o original
        const clone = element.cloneNode(true) as HTMLElement;
        document.body.appendChild(clone);
        
        // Aplicar estilos diretamente para minimizar problemas
        clone.style.backgroundColor = '#1E3A8A';
        clone.style.padding = '20px';
        clone.style.position = 'absolute';
        clone.style.left = '-9999px';
        clone.style.width = '800px'; // Aumentar largura para melhorar resolução
        
        // Usar renderização com escala ainda maior
        const canvas = await html2canvas(clone, {
          scale: 5, // Escala ainda maior para o método alternativo
          backgroundColor: '#1E3A8A',
          allowTaint: true,
          useCORS: true,
          logging: false
        });
        
        // Remover o clone depois de usado
        document.body.removeChild(clone);
        
        const imgData = canvas.toDataURL('image/png', 1.0);
        
        // Fallback para download direto
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `ranking-${fundamento}-${team}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (fallbackError) {
        console.error('Erro na abordagem alternativa para compartilhar:', fallbackError);
      }
    }
  };

  // Alternar modo tela cheia
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Cor baseada na posição
  const getPositionColor = (position: number) => {
    switch (position) {
      case 0: return "text-yellow-500";
      case 1: return "text-slate-400";
      case 2: return "text-amber-600";
      default: return "text-slate-700";
    }
  };

  // Ícone de medalha baseado na posição
  const getMedalIcon = (position: number) => {
    return <Medal className={`h-5 w-5 ${getPositionColor(position)}`} />;
  };

  // Função para gerar mensagem personalizada de parabenização
  const gerarMensagemParabenizacao = (nome: string) => {
    const mensagens = [
      `Parabéns, ${nome}! Você é o destaque da equipe!`,
      `Excelente trabalho, ${nome}! Continue assim!`,
      `${nome}, você está arrasando neste fundamento!`,
      `Impressionante, ${nome}! Seu desempenho é excepcional!`,
      `${nome}, seu esforço está rendendo resultados incríveis!`
    ];
    
    // Escolher uma mensagem aleatoriamente
    const indiceAleatorio = Math.floor(Math.random() * mensagens.length);
    return mensagens[indiceAleatorio];
  };
  
  // Exibir os atletas no ranking
  const rankingContent = () => {
    // Forçar a recriação do ranking
    const atletas = gerarRanking();
    const atletasParaExibir = atletas.slice(0, quantidadeAtletasExibidos);
    
    if (atletasParaExibir.length === 0) {
      return (
        <div className="py-10 text-center text-gray-300">
          <Trophy className="h-12 w-12 mx-auto mb-2 opacity-20 text-primary" />
          <p>Nenhum atleta com mais de 5 tentativas neste fundamento no período selecionado.</p>
          <p className="text-sm mt-2 text-gray-400">O ranking considera apenas atletas com pelo menos 5 tentativas para evitar distorções.</p>
          {apenasComAvaliacaoQualitativa && (
            <p className="text-sm mt-1 text-amber-400">
              Você está filtrando apenas atletas com avaliação qualitativa. Tente desativar esse filtro.
            </p>
          )}
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {atletasParaExibir.length > 0 && (
          <div className="text-center mb-3 bg-primary/20 text-white py-2 px-3 rounded-lg shadow-md relative border border-primary/30">
            <Trophy className="h-5 w-5 text-primary inline-block mr-2 absolute left-2 top-1/2 transform -translate-y-1/2" />
            <span className="font-semibold">{gerarMensagemParabenizacao(atletasParaExibir[0].nome)}</span>
          </div>
        )}
        {atletasParaExibir.map((atleta, index) => (
          <div key={atleta.id} className={`p-3 rounded-lg border ${
            index === 0 
              ? 'bg-yellow-900/20 border-yellow-500/30 text-white' 
              : index === 1 
                ? 'bg-slate-800/30 border-slate-400/30 text-white' 
                : index === 2
                  ? 'bg-amber-900/20 border-amber-500/30 text-white'
                  : 'bg-slate-900/20 border-slate-700/30 text-white'
          }`}>
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 mr-3">
                {index < 3 ? getMedalIcon(index) : (
                  <Badge variant="outline" className="h-6 w-6 flex items-center justify-center text-xs">
                    {index + 1}
                  </Badge>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-white">{atleta.nome}</h3>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-300">{atleta.totalExecucoes} execuções</p>
                  {atleta.totalAvaliacoesQualitativas && atleta.totalAvaliacoesQualitativas > 0 && (
                    <Badge variant="outline" className="text-xs bg-primary/10 border-primary/20">
                      {atleta.totalAvaliacoesQualitativas} aval. qualitativas
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className={`text-lg font-bold ${
                        index === 0 
                          ? 'border-yellow-500/50 bg-yellow-500/20 text-yellow-300' 
                          : index === 1 
                            ? 'border-slate-400/50 bg-slate-400/20 text-slate-300' 
                            : index === 2
                              ? 'border-amber-500/50 bg-amber-500/20 text-amber-300'
                              : 'border-slate-400/50 bg-slate-400/10 text-slate-300'
                      }`}>
                        {atleta.scoreTotal !== undefined 
                        ? atleta.scoreTotal.toFixed(1) 
                        : atleta.percentual.toFixed(1)}%
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-[240px]">
                      <p>Score Final: {atleta.scoreTotal !== undefined 
                        ? atleta.scoreTotal.toFixed(1) 
                        : atleta.percentual.toFixed(1)}%</p>
                      <p className="text-xs mt-1 text-muted-foreground">
                        {atleta.notaQualitativa !== undefined && atleta.notaQualitativa > 0
                          ? `Combinação de ${PESOS_RANKING.fundamento.quantitativo * 100}% quantitativo e ${PESOS_RANKING.fundamento.qualitativo * 100}% qualitativo`
                          : 'Baseado apenas em dados quantitativos'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            
            {/* Detalhes do ranking com nota qualitativa e técnica */}
            <div className="mt-3 pt-2 border-t border-white/10 grid grid-cols-2 gap-2">
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">Eficiência Quantitativa</div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge 
                        variant="outline" 
                        className="text-sm border-blue-500/20 bg-blue-500/10 text-blue-300"
                      >
                        {atleta.percentual.toFixed(1)}%
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Taxa de acerto = (acertos ÷ total) × 100</p>
                      <p className="text-xs mt-1">Baseado em {atleta.totalExecucoes} execuções</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">Nota Técnica Média</div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge 
                        variant="outline" 
                        className={`text-sm ${
                          atleta.notaQualitativa !== undefined && atleta.notaQualitativa > 0 
                          ? 'border-green-500/30 bg-green-500/10 text-green-300' 
                          : 'border-gray-500/30 bg-gray-500/10 text-gray-400'
                        }`}
                      >
                        {atleta.notaQualitativa !== undefined && atleta.notaQualitativa > 0
                          ? `${atleta.notaQualitativa.toFixed(1)}% (${atleta.avaliacaoDescritiva})` 
                          : 'Sem avaliação'}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      {atleta.notaQualitativa !== undefined && atleta.notaQualitativa > 0 ? (
                        <>
                          <p>Fundamento: {traduzirFundamento(fundamento)}</p>
                          <p>Avaliação Média: {atleta.avaliacaoDescritiva}</p>
                          <p>Baseado em {atleta.totalAvaliacoesQualitativas} avaliações técnicas</p>
                        </>
                      ) : (
                        <p>Este atleta ainda não possui avaliações técnicas qualitativas para {traduzirFundamento(fundamento)}</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        ))}
        <div className="text-xs text-gray-300 mt-2 p-2 bg-muted rounded-md border border-primary/10">
          <div className="flex items-center justify-between mb-1">
            <p>Como o ranking é calculado:</p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-5 w-5 text-gray-400">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Score Total = ({PESOS_RANKING.fundamento.quantitativo * 100}% Quantitativo + {PESOS_RANKING.fundamento.qualitativo * 100}% Qualitativo)</p>
                  <p className="mt-1">- O percentual quantitativo é calculado pelos acertos/tentativas</p>
                  <p>- A nota qualitativa é baseada nas avaliações técnicas dos treinadores</p>
                  <p>- Se não houver avaliação qualitativa, o score é 100% quantitativo</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p>• Score Total = ({PESOS_RANKING.fundamento.quantitativo * 100}% Eficiência Quantitativa + {PESOS_RANKING.fundamento.qualitativo * 100}% Nota Técnica)</p>
          <p>• Somente atletas com no mínimo 5 tentativas são considerados</p>
          <p>• Em caso de empate: 1) Maior número de tentativas, 2) Ordem alfabética</p>
          <p>• Ordenado por: {ordenacao === 'scoreTotal' ? 'Score Final' : ordenacao === 'quantitativo' ? 'Eficiência Quantitativa' : 'Nota Técnica'}</p>
          <p className="mt-1 text-amber-400">• {apenasComAvaliacaoQualitativa ? 'Filtrando' : 'Exibindo'} atletas {apenasComAvaliacaoQualitativa ? 'com' : 'com e sem'} avaliação qualitativa</p>
        </div>
      </div>
    );
  };

  // Processa e exibe informações de destaque
  const destaquesDaEquipe = () => {
    const atletaDestaque = obterAtletaDestaque();
    const piorFundamento = obterPiorFundamento();
    
    if (!atletaDestaque && !piorFundamento) {
      return null;
    }
    
    return (
      <div className="mb-6 space-y-4">
        {atletaDestaque && (
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30">
            <CardContent className="pt-4">
              <div className="flex items-center mb-2">
                <Trophy className="h-5 w-5 text-primary mr-2" />
                <h3 className="font-bold text-primary">Atleta em Destaque</h3>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-medium text-white">{atletaDestaque.nome}</p>
                  <p className="text-sm text-gray-300">{traduzirFundamento(fundamento)}</p>
                </div>
                <Badge className="bg-primary hover:bg-primary/90 text-white">
                  {atletaDestaque.percentual.toFixed(1)}%
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
        
        {piorFundamento && (
          <Card className="bg-gradient-to-r from-red-900/20 to-red-900/10 border-red-500/20">
            <CardContent className="pt-4">
              <div className="flex items-center mb-2">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                <h3 className="font-bold text-red-400">Maior Desafio da Equipe</h3>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-medium text-white">{traduzirFundamento(piorFundamento.nome)}</p>
                  <p className="text-sm text-gray-300">Média de eficiência baixa</p>
                </div>
                <Badge variant="destructive">
                  {piorFundamento.media.toFixed(1)}%
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Obter a média geral do fundamento selecionado
  const obterMediaGeralFundamento = (): number => {
    if (!performanceData || performanceData.length === 0) return 0;
    
    let somaPercentuais = 0;
    let atletasComFundamento = 0;
    
    // Tratamento específico para recepção/passe (sinônimos no sistema)
    const fundamentoNormalizado = fundamento === 'passe' ? 
      ['passe', 'recepção'] : 
      [fundamento];
    
    performanceData.forEach(athlete => {
      const avaliacoesFiltradas = filtrarAvaliacoesPorPeriodo(athlete);
      
      // Verificar os fundamentos normalizados
      fundamentoNormalizado.forEach(f => {
        if (avaliacoesFiltradas.porFundamento[f] && 
            avaliacoesFiltradas.porFundamento[f].total > 0) {
          somaPercentuais += avaliacoesFiltradas.porFundamento[f].percentualAcerto;
          atletasComFundamento++;
        }
      });
    });
    
    return atletasComFundamento > 0 ? somaPercentuais / atletasComFundamento : 0;
  };
  
  const mediaGeralFundamento = obterMediaGeralFundamento();

  // Contar quantos atletas têm avaliações no fundamento selecionado
  const contarAtletasComFundamento = (): number => {
    if (!performanceData || performanceData.length === 0) return 0;
    
    // Tratamento específico para recepção/passe (sinônimos no sistema)
    const fundamentoNormalizado = fundamento === 'passe' ? 
      ['passe', 'recepção'] : 
      [fundamento];
    
    let atletasComFundamento = 0;
    
    performanceData.forEach(athlete => {
      const avaliacoesFiltradas = filtrarAvaliacoesPorPeriodo(athlete);
      
      // Se o atleta tem pelo menos um dos fundamentos normalizados
      const temFundamento = fundamentoNormalizado.some(f => 
        avaliacoesFiltradas.porFundamento[f] && 
        avaliacoesFiltradas.porFundamento[f].total > 0
      );
      
      if (temFundamento) {
        atletasComFundamento++;
      }
    });
    
    return atletasComFundamento;
  };
  
  const totalAtletasComFundamento = contarAtletasComFundamento();

  // Funções para abrir e fechar o seletor de datas
  const abrirSeletorDatas = () => {
    setExibirSeletorDatas(true);
  };

  const fecharSeletorDatas = () => {
    setExibirSeletorDatas(false);
  };

  const aplicarFiltroPersonalizado = () => {
    const novaDataInicio = format(dataInicioTemp, 'yyyy-MM-dd');
    const novaDataFim = format(dataFimTemp, 'yyyy-MM-dd');
    
    setDataInicio(novaDataInicio);
    setDataFim(novaDataFim);
    setPeriodoSelecionado('personalizado');
    setExibirSeletorDatas(false);
    
    console.log(`Período personalizado aplicado: ${novaDataInicio} a ${novaDataFim}`);
  };

  return (
    <div>
      <div id="ranking-container" className="bg-background text-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 pb-3 flex justify-between items-center border-b border-border">
          <h2 className="text-xl font-bold flex items-center text-white">
            <Trophy className="h-5 w-5 mr-2 text-primary" />
            Ranking de Desempenho
          </h2>
          <div className="space-x-2">
            <ExportRankingButton
              targetRef={printRef}
              fileName={`ranking-${traduzirFundamento(fundamento).toLowerCase()}`}
              exportTitle={`Ranking de ${traduzirFundamento(fundamento)}`}
              backgroundColor="rgb(15, 23, 42)"
              variant="outline"
              size="sm"
              scale={3}
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleFullscreen}
              className="border-border text-white hover:text-primary hover:bg-primary/10"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="p-4 border-b border-border bg-background/80">
          <div className="flex space-x-4 md:space-x-8 mb-4">
            <div className="flex items-center space-x-1 text-white">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Período:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={periodoSelecionado === "7dias" ? "default" : "outline"}
                size="sm"
                onClick={() => handleChangePeriodo("7dias")}
                className={periodoSelecionado === "7dias" ? "bg-primary text-white" : "border-border text-white hover:bg-primary/10 hover:text-primary"}
              >
                Últimos 7 dias
              </Button>
              <Button
                variant={periodoSelecionado === "30dias" ? "default" : "outline"}
                size="sm"
                onClick={() => handleChangePeriodo("30dias")}
                className={periodoSelecionado === "30dias" ? "bg-primary text-white" : "border-border text-white hover:bg-primary/10 hover:text-primary"}
              >
                Últimos 30 dias
              </Button>
              <Button
                variant={periodoSelecionado === "personalizado" ? "default" : "outline"}
                size="sm"
                onClick={abrirSeletorDatas}
                className={periodoSelecionado === "personalizado" ? "bg-primary text-white" : "border-border text-white hover:bg-primary/10 hover:text-primary"}
              >
                {periodoSelecionado === "personalizado"
                  ? `${format(new Date(dataInicio), "dd/MM/yyyy")} - ${format(new Date(dataFim), "dd/MM/yyyy")}`
                  : "Personalizado"}
              </Button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-1 text-white">
              <Star className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Fundamento:</span>
            </div>
            <Select
              value={fundamento}
              onValueChange={(value: Fundamento) => setFundamento(value)}
            >
              <SelectTrigger className="w-fit border-border bg-muted text-white hover:bg-primary/10">
                <SelectValue placeholder="Selecione um fundamento" />
              </SelectTrigger>
              <SelectContent className="bg-muted text-white border-border">
                <SelectItem value="saque">Saque</SelectItem>
                <SelectItem value="passe">Passe</SelectItem>
                <SelectItem value="levantamento">Levantamento</SelectItem>
                <SelectItem value="ataque">Ataque</SelectItem>
                <SelectItem value="bloqueio">Bloqueio</SelectItem>
                <SelectItem value="defesa">Defesa</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Nova opção de ordenação */}
            <div className="flex items-center space-x-1 ml-auto text-white">
              <ArrowDownUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Ordenar por:</span>
            </div>
            <Select
              value={ordenacao}
              onValueChange={(value: OrdenacaoRanking) => setOrdenacao(value as OrdenacaoRanking)}
            >
              <SelectTrigger className="w-fit border-border bg-muted text-white hover:bg-primary/10">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent className="bg-muted text-white border-border">
                <SelectItem value="scoreTotal">Score Final</SelectItem>
                <SelectItem value="quantitativo">Eficiência Quantitativa</SelectItem>
                <SelectItem value="qualitativo">Nota Técnica</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Opção para mostrar mais atletas */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-border text-white hover:bg-primary/10 hover:text-primary"
                >
                  <BarChart2 className="h-4 w-4 mr-1" />
                  Top {quantidadeAtletasExibidos}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-muted text-white border-border">
                <DropdownMenuItem onClick={() => setQuantidadeAtletasExibidos(3)}>
                  Top 3 Atletas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setQuantidadeAtletasExibidos(5)}>
                  Top 5 Atletas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setQuantidadeAtletasExibidos(10)}>
                  Top 10 Atletas
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Filtro para exibir apenas atletas com avaliação qualitativa */}
        <div className="py-2 px-4 border-b border-border bg-background/80">
          <div className="flex items-center justify-between">
            <div className="flex space-x-2 items-center">
              <Checkbox 
                id="filtro-qualitativo" 
                checked={apenasComAvaliacaoQualitativa}
                onCheckedChange={(checked) => setApenasComAvaliacaoQualitativa(checked as boolean)}
                className="border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
              />
              <Label 
                htmlFor="filtro-qualitativo" 
                className="text-sm text-white cursor-pointer"
              >
                Exibir apenas atletas com avaliação qualitativa
              </Label>
            </div>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={() => setExibirInfoRanking(!exibirInfoRanking)}
                  >
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[240px]">
                  O ranking agora considera avaliações qualitativas dos técnicos (Avaliação Qualitativa) que complementam os dados de execução (acerto/erro).
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {isLoadingQualitativas && (
            <div className="mt-2 flex items-center space-x-2 text-xs text-muted-foreground">
              <Skeleton className="h-3 w-3 rounded-full animate-pulse bg-primary/20" />
              <span>Carregando avaliações qualitativas...</span>
            </div>
          )}
          
          {exibirInfoRanking && (
            <div className="mt-2 p-2 bg-muted rounded-md text-xs text-muted-foreground border border-border">
              <p className="font-medium text-primary">Sobre o Ranking Combinado</p>
              <p className="mt-1">Para cada fundamento específico, o ranking apresenta uma pontuação combinada: 60% dos dados quantitativos (taxa de acerto) e 40% das avaliações qualitativas dos técnicos.</p>
              <p className="mt-1">Se um atleta não possui avaliação qualitativa, apenas o componente quantitativo é considerado.</p>
              <div className="mt-2 p-1 bg-background/30 rounded-sm">
                <p className="text-[10px] text-primary">Fórmula: ScoreFinal = ({PESOS_RANKING.fundamento.quantitativo * 100}% × Eficiência Quantitativa) + ({PESOS_RANKING.fundamento.qualitativo * 100}% × Nota Técnica)</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 md:p-6">
          {/* Rest of the component */}
          {destaquesDaEquipe()}
          
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white">Top 3 Atletas</h3>
              <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                {totalAtletasComFundamento} atletas
              </span>
            </div>
          </div>
          
          {rankingContent()}
        </div>
      </div>
      
      {exibirSeletorDatas && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-muted p-4 rounded-lg shadow-lg border border-border w-full max-w-md">
            <h3 className="font-bold mb-4 text-white">Selecionar Período</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label className="text-white">Data Inicial</Label>
                <input
                  type="date"
                  value={format(dataInicioTemp, 'yyyy-MM-dd')}
                  onChange={(e) => setDataInicioTemp(parseISO(e.target.value))}
                  className="w-full p-2 rounded-md border border-border bg-background text-white"
                />
              </div>
              <div>
                <Label className="text-white">Data Final</Label>
                <input
                  type="date"
                  value={format(dataFimTemp, 'yyyy-MM-dd')}
                  onChange={(e) => setDataFimTemp(parseISO(e.target.value))}
                  className="w-full p-2 rounded-md border border-border bg-background text-white"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={fecharSeletorDatas}
                className="border-border text-white hover:bg-primary/10 hover:text-primary"
              >
                Cancelar
              </Button>
              <Button
                onClick={aplicarFiltroPersonalizado}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                Aplicar
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <div className="hidden">
        <div ref={printRef} style={{ width: "800px", padding: "20px" }}>
          <RankingExportView
            fundamento={fundamento}
            topAtletas={topAtletas}
            team={team}
            periodo={periodoSelecionado}
            dataInicio={dataInicio ? new Date(dataInicio) : undefined}
            dataFim={dataFim ? new Date(dataFim) : undefined}
          />
        </div>
      </div>
    </div>
  );
};

export default RankingFundamentos; 