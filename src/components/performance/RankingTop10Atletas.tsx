import React, { useState, useEffect, useRef } from 'react';
import { TeamType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Medal, Trophy, FileDown, Share2, Loader2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import '@/styles/ranking-export-styles.css';
import { gerarRankingDesempenho, RankingDesempenhoAtleta, descreverDesempenho } from '@/services/rankingDesempenhoService';

interface RankingTop10AtletasProps {
  team: TeamType;
  fundamento?: string;
}

type PeriodoRanking = '7dias' | '30dias' | 'personalizado';

<<<<<<< HEAD
const RankingTop10Atletas: React.FC<RankingTop10AtletasProps> = ({ team, fundamento: fundamentoProp }) => {
  const [fundamento, setFundamento] = useState<Fundamento>(fundamentoProp as Fundamento || 'saque');
  const [rankingData, setRankingData] = useState<RankingAtletaFundamento[]>([]);
=======
/**
 * Componente alternativo para exibir o Ranking de Desempenho (versão legada)
 * @deprecated Use o componente RankingDesempenho em vez deste
 */
const RankingTop10Atletas: React.FC<RankingTop10AtletasProps> = ({ team }) => {
  const [periodoSelecionado, setPeriodoSelecionado] = useState<PeriodoRanking>('7dias');
  const [dataInicio, setDataInicio] = useState<string>(getDateBefore(7));
  const [dataFim, setDataFim] = useState<string>(getToday());
  const [rankingData, setRankingData] = useState<RankingDesempenhoAtleta[]>([]);
>>>>>>> e00e4d317bf47193707a8e5057a94cd176a32469
  const [isLoading, setIsLoading] = useState(false);
  const rankingRef = useRef<HTMLDivElement>(null);

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

  // Função para atualizar o ranking
  const atualizarRanking = async () => {
    setIsLoading(true);
    try {
      const dados = await gerarRankingDesempenho(team, dataInicio, dataFim);
      setRankingData(dados);
    } catch (error) {
      console.error('Erro ao carregar ranking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Atualizar o período quando mudar a seleção
  const handleChangePeriodo = (value: PeriodoRanking) => {
    setPeriodoSelecionado(value);
    
    if (value === '7dias') {
      const novaDataInicio = getDateBefore(7);
      const novaDataFim = getToday();
      
      setDataInicio(novaDataInicio);
      setDataFim(novaDataFim);
      
      console.log(`Período atualizado para 7 dias: ${novaDataInicio} a ${novaDataFim}`);
    } else if (value === '30dias') {
      const novaDataInicio = getDateBefore(30);
      const novaDataFim = getToday();
      
      setDataInicio(novaDataInicio);
      setDataFim(novaDataFim);
      
      console.log(`Período atualizado para 30 dias: ${novaDataInicio} a ${novaDataFim}`);
    }
  };

  // Carregar o ranking quando o componente montar ou quando mudar o time/período
  useEffect(() => {
    atualizarRanking();
  }, [team, dataInicio, dataFim]);

  // Função para gerar uma frase de parabenização dinâmica
  const gerarFraseParabenizacao = () => {
    const frases = [
      `🏆 Parabéns aos destaques no ranking de desempenho! Excelente dedicação!`,
      `🌟 Nossos campeões de desempenho técnico! Orgulho da equipe!`,
      `🔝 Top desempenho da categoria! Continuem com este excelente trabalho!`
    ];
    return frases[Math.floor(Math.random() * frases.length)];
  };

  // Função para obter a cor da medalha com base na posição
  const getMedalColor = (posicao: number) => {
    switch (posicao) {
      case 0: return 'text-yellow-500'; // Ouro
      case 1: return 'text-slate-400';  // Prata
      case 2: return 'text-amber-600';  // Bronze
      default: return 'text-slate-700';
    }
  };

  // Função para obter a medalha ou posição
  const getMedalOrPosition = (posicao: number) => {
    if (posicao <= 2) {
      return <Medal className={`h-5 w-5 ${getMedalColor(posicao)}`} />;
    }
    return <span className="text-sm font-medium">{posicao + 1}º</span>;
  };
  
  // Obter a cor para o badge de desempenho
  const getDesempenhoColor = (media: number): string => {
    if (media >= 80) return 'bg-green-100 text-green-800 hover:bg-green-200';
    if (media >= 70) return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200';
    if (media >= 60) return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    if (media >= 50) return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    if (media >= 40) return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
    return 'bg-red-100 text-red-800 hover:bg-red-200';
  };

  // Exportar para PDF
  const exportarPDF = async () => {
    if (!rankingRef.current) return;
    
    try {
      setIsLoading(true);
      
      // Aplicar temporariamente um estilo de fundo para a exportação
      rankingRef.current.classList.add('ranking-export-bg');
      
      const canvas = await html2canvas(rankingRef.current, { 
        scale: 2,
        backgroundColor: '#1E3A8A' // Azul escuro para o background
      });
      
      // Remover o estilo temporário
      rankingRef.current.classList.remove('ranking-export-bg');
      
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Calcular dimensões mantendo a proporção
      const imgWidth = 210; // A4 width in mm
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      // Adicionar imagem
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // Salvar o PDF
      pdf.save(`ranking-desempenho-${team}-${format(new Date(), 'dd-MM-yyyy')}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Compartilhar como imagem
  const compartilharImagem = async () => {
    if (!rankingRef.current) return;
    
    try {
      setIsLoading(true);
      
      // Aplicar temporariamente um estilo de fundo para a exportação
      rankingRef.current.classList.add('ranking-export-bg');
      
      const canvas = await html2canvas(rankingRef.current, { 
        scale: 2,
        backgroundColor: '#1E3A8A' // Azul escuro para o background
      });
      
      // Remover o estilo temporário
      rankingRef.current.classList.remove('ranking-export-bg');
      
      const imgData = canvas.toDataURL('image/png');
      
      // Criar um blob a partir da URL de dados
      const blob = await (await fetch(imgData)).blob();
      
      // Criar um objeto File para compartilhamento
      const file = new File(
        [blob], 
        `ranking-desempenho-${team}-${format(new Date(), 'dd-MM-yyyy')}.png`, 
        { type: 'image/png' }
      );
      
      // Verificar se o navegador suporta a API de compartilhamento
      if (navigator.share) {
        await navigator.share({
          title: `Ranking de Desempenho - Time ${team}`,
          text: gerarFraseParabenizacao(),
          files: [file]
        });
      } else {
        // Fallback para download se o compartilhamento não for suportado
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `ranking-desempenho-${team}-${format(new Date(), 'dd-MM-yyyy')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Erro ao compartilhar imagem:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ranking-top10-container">
      <div ref={rankingRef} className="ranking-content bg-white p-6 rounded-xl">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold flex items-center text-blue-900">
              <Trophy className="h-6 w-6 text-blue-700 mr-2" />
              Ranking de Desempenho
            </h2>
            <p className="text-sm text-blue-700 mt-1">
              Time {team} | Período: {format(new Date(dataInicio), 'dd/MM', { locale: ptBR })} 
              a {format(new Date(dataFim), 'dd/MM/yyyy', { locale: ptBR })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={periodoSelecionado} onValueChange={handleChangePeriodo}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7dias">Últimos 7 dias</SelectItem>
                <SelectItem value="30dias">Últimos 30 dias</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={exportarPDF} disabled={isLoading}>
              <FileDown className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={compartilharImagem} disabled={isLoading}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Mensagem de parabenização */}
        <div className="bg-purple-100 text-purple-800 p-3 mb-6 rounded-lg border border-purple-200 text-center">
          <p className="font-medium">{gerarFraseParabenizacao()}</p>
        </div>

        {/* Tabela de Ranking */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                <span className="ml-3 text-blue-800">Calculando ranking...</span>
              </div>
            ) : rankingData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <AlertCircle className="h-16 w-16 opacity-20 mb-4" />
                <p className="text-center">
                  Não há atletas com avaliações suficientes no período selecionado.
                  <br />
                  <span className="text-sm">São necessárias avaliações qualitativas para gerar o ranking.</span>
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-blue-50">
                  <TableRow>
                    <TableHead className="w-12 text-center font-semibold">Pos.</TableHead>
                    <TableHead className="font-semibold">Atleta</TableHead>
                    <TableHead className="w-32 text-center font-semibold">Média de Desempenho</TableHead>
                    <TableHead className="w-24 text-center font-semibold">Avaliações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rankingData.slice(0, 10).map((atleta, index) => (
                    <TableRow key={atleta.id} className={index <= 2 ? 'bg-blue-50/50' : ''}>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          {getMedalOrPosition(index)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {atleta.nome}
                        {index === 0 && (
                          <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800 border-yellow-300">
                            Destaque
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant="outline"
                          className={`${getDesempenhoColor(atleta.mediaDesempenho)} font-medium`}
                        >
                          {atleta.mediaDesempenho.toFixed(1)}%
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {descreverDesempenho(atleta.mediaDesempenho)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {atleta.totalAvaliacoes}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RankingTop10Atletas; 