import React, { useState, useEffect, useRef } from 'react';
import { TeamType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Medal, Trophy, Filter, Calendar, Users, TrendingUp, BarChart2, FileDown, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import '@/styles/ranking-export-styles.css';

interface RankingAtletasProps {
  team: TeamType;
}

type Fundamento = 'saque' | 'passe' | 'levantamento' | 'ataque' | 'bloqueio' | 'defesa';
type Periodo = 'semana' | 'mes' | 'temporada';
type Ordenacao = 'media' | 'avaliacoes' | 'consistencia';

const RankingAtletas: React.FC<RankingAtletasProps> = ({ team }) => {
  const [fundamento, setFundamento] = useState<Fundamento>('saque');
  const [periodo, setPeriodo] = useState<Periodo>('temporada');
  const [ordenacao, setOrdenacao] = useState<Ordenacao>('media');
  const [ranking, setRanking] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const rankingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadRanking();
  }, [fundamento, periodo, ordenacao]);

  const loadRanking = async () => {
    setLoading(true);
    try {
      // Aqui você implementaria a lógica para buscar os dados do ranking
      // com base nos filtros selecionados
      const response = await fetch(`/api/ranking?fundamento=${fundamento}&periodo=${periodo}&ordenacao=${ordenacao}`);
      const data = await response.json();
      setRanking(data);
    } catch (error) {
      console.error('Erro ao carregar ranking:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalColor = (position: number) => {
    switch (position) {
      case 1:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 2:
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 3:
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return '';
    }
  };

  const exportToPDF = async () => {
    if (!rankingRef.current) return;

    const canvas = await html2canvas(rankingRef.current);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`ranking-${fundamento}-${format(new Date(), 'dd-MM-yyyy')}.pdf`);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Ranking de Atletas</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportToPDF}>
              <FileDown className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={fundamento} onValueChange={(value) => setFundamento(value as Fundamento)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o fundamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="saque">Saque</SelectItem>
                <SelectItem value="passe">Passe</SelectItem>
                <SelectItem value="levantamento">Levantamento</SelectItem>
                <SelectItem value="ataque">Ataque</SelectItem>
                <SelectItem value="bloqueio">Bloqueio</SelectItem>
                <SelectItem value="defesa">Defesa</SelectItem>
              </SelectContent>
            </Select>

            <Select value={periodo} onValueChange={(value) => setPeriodo(value as Periodo)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semana">Última Semana</SelectItem>
                <SelectItem value="mes">Último Mês</SelectItem>
                <SelectItem value="temporada">Temporada</SelectItem>
              </SelectContent>
            </Select>

            <Select value={ordenacao} onValueChange={(value) => setOrdenacao(value as Ordenacao)}>
              <SelectTrigger>
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="media">Melhor Média</SelectItem>
                <SelectItem value="avaliacoes">Mais Avaliações</SelectItem>
                <SelectItem value="consistencia">Maior Consistência</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Ranking */}
          <div ref={rankingRef} className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Posição</TableHead>
                  <TableHead>Atleta</TableHead>
                  <TableHead>Média</TableHead>
                  <TableHead>Avaliações</TableHead>
                  <TableHead>Consistência</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : (
                  ranking.map((atleta, index) => (
                    <TableRow
                      key={atleta.id}
                      className={getMedalColor(index + 1)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {index < 3 && <Medal className="w-4 h-4" />}
                          {index + 1}º
                        </div>
                      </TableCell>
                      <TableCell>{atleta.nome}</TableCell>
                      <TableCell>{atleta.media.toFixed(2)}</TableCell>
                      <TableCell>{atleta.avaliacoes}</TableCell>
                      <TableCell>{atleta.consistencia}%</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RankingAtletas; 