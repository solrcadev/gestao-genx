import React, { useState, useEffect, useRef } from 'react';
import { TeamType } from '@/types';
import { RankingAtletaFundamento, getAthletesRankingByFundamento } from '@/services/performanceService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Medal, Trophy, FileDown, Share2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import '@/styles/ranking-export-styles.css';

interface RankingTop10AtletasProps {
  team: TeamType;
  fundamento?: string;
}

// Tipo para os fundamentos disponíveis
type Fundamento = 'saque' | 'passe' | 'levantamento' | 'ataque' | 'bloqueio' | 'defesa';

const RankingTop10Atletas: React.FC<RankingTop10AtletasProps> = ({ team, fundamento: fundamentoProp }) => {
  const [fundamento, setFundamento] = useState<Fundamento>(fundamentoProp as Fundamento || 'saque');
  const [rankingData, setRankingData] = useState<RankingAtletaFundamento[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const rankingRef = useRef<HTMLDivElement>(null);

  // Tradução dos fundamentos
  const traducoesFundamentos: Record<Fundamento, string> = {
    'saque': 'Saque',
    'passe': 'Passe/Recepção',
    'levantamento': 'Levantamento',
    'ataque': 'Ataque',
    'bloqueio': 'Bloqueio',
    'defesa': 'Defesa'
  };

  // Função para atualizar o ranking
  const atualizarRanking = async () => {
    setIsLoading(true);
    try {
      const dados = await getAthletesRankingByFundamento(team, fundamento);
      setRankingData(dados);
    } catch (error) {
      console.error('Erro ao carregar ranking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar o ranking quando o componente montar ou quando mudar o fundamento/time
  useEffect(() => {
    atualizarRanking();
  }, [fundamento, team]);

  // Função para gerar uma frase de parabenização dinâmica
  const gerarFraseParabenizacao = () => {
    const frases = [
      `🏆 Parabéns aos destaques da semana no fundamento ${traducoesFundamentos[fundamento]}! Excelente dedicação!`,
      `🌟 Destaques da semana: nossos campeões no ${traducoesFundamentos[fundamento]}! Orgulho da equipe!`,
      `🔝 Top desempenho semanal em ${traducoesFundamentos[fundamento]}! Continuem com este excelente trabalho!`
    ];
    return frases[Math.floor(Math.random() * frases.length)];
  };

  // Função para obter a cor da medalha com base na posição
  const getMedalColor = (posicao: number) => {
    switch (posicao) {
      case 1: return 'text-yellow-500'; // Ouro
      case 2: return 'text-slate-400';  // Prata
      case 3: return 'text-amber-600';  // Bronze
      default: return 'text-slate-700';
    }
  };

  // Função para obter a medalha ou posição
  const getMedalOrPosition = (posicao: number) => {
    if (posicao <= 3) {
      return <Medal className={`h-5 w-5 ${getMedalColor(posicao)}`} />;
    }
    return <span className="text-sm font-medium">{posicao}º</span>;
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
      pdf.save(`ranking-${fundamento}-${team}-${format(new Date(), 'dd-MM-yyyy')}.pdf`);
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
        `ranking-${fundamento}-${team}-${format(new Date(), 'dd-MM-yyyy')}.png`, 
        { type: 'image/png' }
      );
      
      // Verificar se o navegador suporta a API de compartilhamento
      if (navigator.share) {
        await navigator.share({
          title: `Ranking de ${traducoesFundamentos[fundamento]} - Time ${team}`,
          text: gerarFraseParabenizacao(),
          files: [file]
        });
      } else {
        // Fallback para download se o compartilhamento não for suportado
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `ranking-${fundamento}-${team}-${format(new Date(), 'dd-MM-yyyy')}.png`;
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
              Top 10 Atletas - {traducoesFundamentos[fundamento]}
            </h2>
            <p className="text-sm text-blue-700 mt-1">
              Time {team} | Semana: {format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'dd/MM', { locale: ptBR })} 
              a {format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={fundamento} onValueChange={(value) => setFundamento(value as Fundamento)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecione um fundamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="saque">Saque</SelectItem>
                <SelectItem value="passe">Passe/Recepção</SelectItem>
                <SelectItem value="levantamento">Levantamento</SelectItem>
                <SelectItem value="ataque">Ataque</SelectItem>
                <SelectItem value="bloqueio">Bloqueio</SelectItem>
                <SelectItem value="defesa">Defesa</SelectItem>
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
                <Trophy className="h-16 w-16 opacity-20 mb-4" />
                <p className="text-center">
                  Não há atletas com avaliações suficientes neste fundamento na última semana.
                  <br />
                  <span className="text-sm">São necessárias pelo menos 5 tentativas para entrar no ranking.</span>
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-blue-50">
                  <TableRow>
                    <TableHead className="w-12 text-center font-semibold">Pos.</TableHead>
                    <TableHead className="font-semibold">Atleta</TableHead>
                    <TableHead className="w-24 text-center font-semibold">Eficiência</TableHead>
                    <TableHead className="w-24 text-center font-semibold">Acertos</TableHead>
                    <TableHead className="w-24 text-center font-semibold">Tentativas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rankingData.map((atleta) => (
                    <TableRow key={atleta.id} className={atleta.posicao <= 3 ? 'bg-blue-50/50' : ''}>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          {getMedalOrPosition(atleta.posicao)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {atleta.nome}
                        {atleta.posicao === 1 && (
                          <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800 border-yellow-300">
                            Destaque
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          className={`
                            ${atleta.posicao === 1 ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : 
                            atleta.posicao === 2 ? 'bg-slate-100 text-slate-800 border-slate-300' : 
                            atleta.posicao === 3 ? 'bg-amber-100 text-amber-800 border-amber-300' : 
                            'bg-blue-50 text-blue-800 border-blue-200'}
                          `}
                        >
                          {atleta.eficiencia.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{atleta.acertos}</TableCell>
                      <TableCell className="text-center">{atleta.tentativas}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Legenda e observações */}
        <div className="mt-6 text-sm text-gray-500">
          <p>• Eficiência = (Total de Acertos / Total de Tentativas) * 100</p>
          <p>• Somente atletas com mínimo de 5 tentativas são considerados no ranking.</p>
          <p>• Em caso de empate na eficiência, o critério de desempate é o número de tentativas.</p>
        </div>
      </div>
      
      {/* Botão de atualizar ranking */}
      <div className="flex justify-center mt-4">
        <Button 
          variant="outline" 
          onClick={atualizarRanking} 
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          Atualizar Ranking
        </Button>
      </div>
    </div>
  );
};

export default RankingTop10Atletas; 