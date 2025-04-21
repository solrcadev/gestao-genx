import React, { useState, useRef, useEffect } from 'react';
import { Medal, Calendar, FileDown, Share2, Maximize2, Minimize2, Trophy, AlertTriangle, Star } from 'lucide-react';
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

// Interface para os atletas no ranking
interface RankingAtleta {
  id: string;
  nome: string;
  percentual: number;
  totalExecucoes: number;
}

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
  
  const rankingRef = useRef<HTMLDivElement>(null);
  const exportViewRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

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
      setDataInicio(getDateBefore(7));
      setDataFim(getToday());
    } else if (value === '30dias') {
      setDataInicio(getDateBefore(30));
      setDataFim(getToday());
    }
  };

  // Gerar o ranking de atletas para o fundamento atual
  const gerarRanking = (): RankingAtleta[] => {
    if (!performanceData || performanceData.length === 0) return [];
    
    const atletas: RankingAtleta[] = [];
    
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
          
          atletas.push({
            id: athlete.atleta.id,
            nome: athlete.atleta.nome,
            percentual: eficiencia,
            totalExecucoes: total
          });
        }
      }
    });
    
    // Ordenar por percentual (decrescente)
    const rankingOrdenado = atletas.sort((a, b) => {
      // Primeiro critério: eficiência (percentual)
      if (b.percentual !== a.percentual) {
        return b.percentual - a.percentual;
      }
      // Segundo critério: número de tentativas
      if (b.totalExecucoes !== a.totalExecucoes) {
        return b.totalExecucoes - a.totalExecucoes;
      }
      // Terceiro critério: ordem alfabética por nome
      return a.nome.localeCompare(b.nome);
    });
    
    return rankingOrdenado;
  };

  // Obter os top 3 atletas
  const topAtletas = gerarRanking().slice(0, 3);
  
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
    if (topAtletas.length === 0) {
      return (
        <div className="py-10 text-center text-gray-300">
          <Trophy className="h-12 w-12 mx-auto mb-2 opacity-20 text-primary" />
          <p>Nenhum atleta com mais de 5 tentativas neste fundamento no período selecionado.</p>
          <p className="text-sm mt-2 text-gray-400">O ranking considera apenas atletas com pelo menos 5 tentativas para evitar distorções.</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {topAtletas.length > 0 && (
          <div className="text-center mb-3 bg-primary/20 text-white py-2 px-3 rounded-lg shadow-md relative border border-primary/30">
            <Trophy className="h-5 w-5 text-primary inline-block mr-2 absolute left-2 top-1/2 transform -translate-y-1/2" />
            <span className="font-semibold">{gerarMensagemParabenizacao(topAtletas[0].nome)}</span>
          </div>
        )}
        {topAtletas.map((atleta, index) => (
          <div key={atleta.id} className={`flex items-center p-3 rounded-lg border ${
            index === 0 
              ? 'bg-yellow-900/20 border-yellow-500/30 text-white' 
              : index === 1 
                ? 'bg-slate-800/30 border-slate-400/30 text-white' 
                : 'bg-amber-900/20 border-amber-500/30 text-white'
          }`}>
            <div className="flex items-center justify-center w-8 h-8 mr-3">
              {getMedalIcon(index)}
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-white">{atleta.nome}</h3>
              <p className="text-sm text-gray-300">{atleta.totalExecucoes} execuções</p>
            </div>
            <div className="text-right">
              <Badge variant="outline" className={`text-lg font-bold ${
                index === 0 
                  ? 'border-yellow-500/50 bg-yellow-500/20 text-yellow-300' 
                  : index === 1 
                    ? 'border-slate-400/50 bg-slate-400/20 text-slate-300' 
                    : 'border-amber-500/50 bg-amber-500/20 text-amber-300'
              }`}>
                {atleta.percentual.toFixed(1)}%
              </Badge>
            </div>
          </div>
        ))}
        <div className="text-xs text-gray-300 mt-2 p-2 bg-muted rounded-md border border-primary/10">
          <p>• Eficiência = (Total de Acertos / Total de Tentativas) * 100</p>
          <p>• Somente atletas com no mínimo 5 tentativas são considerados</p>
          <p>• Em caso de empate: 1) Maior número de tentativas, 2) Ordem alfabética</p>
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
    setDataInicio(format(dataInicioTemp, 'yyyy-MM-dd'));
    setDataFim(format(dataFimTemp, 'yyyy-MM-dd'));
    setExibirSeletorDatas(false);
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
                onClick={() => setPeriodoSelecionado("7dias")}
                className={periodoSelecionado === "7dias" ? "bg-primary text-white" : "border-border text-white hover:bg-primary/10 hover:text-primary"}
              >
                Últimos 7 dias
              </Button>
              <Button
                variant={periodoSelecionado === "30dias" ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriodoSelecionado("30dias")}
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
          
          <div className="flex items-center space-x-3">
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
          </div>
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