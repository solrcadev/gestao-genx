import React, { useState, useRef, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  Eye, 
  ArrowUpDown, 
  ChevronUp, 
  ChevronDown, 
  Filter, 
  FileDown,
  Printer
} from 'lucide-react';
import { 
  ResumoPresencaAtleta, 
  getIndiceEsforcoColor 
} from '@/services/presencaService';
import { HistoricoPresenca } from '@/components/presenca/DetalhePresencaModal';
import DetalhePresencaModal from '@/components/presenca/DetalhePresencaModal';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// O componente ResumoPresencas é uma tabela que mostra o resumo de presença por atleta
// e inclui funcionalidades como filtrar, ordenar e exportar os dados
export interface ResumoPresencasProps {
  resumos: ResumoPresencaAtleta[];
  isLoading: boolean;
  onVerHistorico: (atletaId: string) => Promise<HistoricoPresenca[]>;
}

type SortField = 'nome' | 'indice_esforco' | 'total_presencas' | 'total_ausencias';
type SortDirection = 'asc' | 'desc';

const ResumoPresencas: React.FC<ResumoPresencasProps> = ({
  resumos,
  isLoading,
  onVerHistorico
}) => {
  const [filterText, setFilterText] = useState('');
  const [filterTeam, setFilterTeam] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('nome');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedAtleta, setSelectedAtleta] = useState<ResumoPresencaAtleta | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [historicoAtleta, setHistoricoAtleta] = useState<HistoricoPresenca[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  // Debug: Logar resumos e times disponíveis quando o componente montar
  useEffect(() => {
    if (resumos.length > 0) {
      const timeValues = [...new Set(resumos.map(r => r.time))];
      console.log('Times disponíveis nos dados:', timeValues);
      console.log('Exemplo de primeiro objeto de resumo:', resumos[0]);
    }
  }, [resumos]);

  // Função para normalizar os nomes dos times para comparação
  const normalizeTeam = (team: string | undefined | null): string => {
    if (!team) return '';
    return team.toLowerCase().trim();
  };

  // Obter valores únicos de times para o select
  const uniqueTeams = React.useMemo(() => {
    const teams = [...new Set(resumos.map(r => normalizeTeam(r.time)))].filter(Boolean);
    return teams.sort();
  }, [resumos]);

  // Aplica filtros aos dados de resumo
  const filteredResumos = resumos.filter(resumo => {
    const matchesText = resumo.nome.toLowerCase().includes(filterText.toLowerCase());
    const resumoTeamNormalized = normalizeTeam(resumo.time);
    const matchesTeam = filterTeam === 'all' || resumoTeamNormalized === filterTeam;
    
    return matchesText && matchesTeam;
  });

  // Ordena os dados filtrados
  const sortedResumos = [...filteredResumos].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];
    
    if (sortField === 'nome') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Handler para alternar a direção da ordenação ou mudar o campo de ordenação
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handler para abrir o modal com o histórico detalhado
  const handleVerHistorico = async (atleta: ResumoPresencaAtleta) => {
    setSelectedAtleta(atleta);
    setLoadingHistorico(true);
    
    try {
      const historico = await onVerHistorico(atleta.id);
      setHistoricoAtleta(historico);
      setModalOpen(true);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoadingHistorico(false);
    }
  };

  // Renderiza o indicador de ordem
  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-4 w-4" />;
    return sortDirection === 'asc' 
      ? <ChevronUp className="ml-1 h-4 w-4" /> 
      : <ChevronDown className="ml-1 h-4 w-4" />;
  };

  // Exporta a tabela para PDF
  const exportToPDF = async () => {
    if (!tableRef.current) return;
    
    try {
      const canvas = await html2canvas(tableRef.current, {
        scale: 1.5,
        backgroundColor: '#ffffff',
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;
      
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save('resumo-presencas.pdf');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
    }
  };

  // Exporta a tabela para PNG
  const exportToPNG = async () => {
    if (!tableRef.current) return;
    
    try {
      const canvas = await html2canvas(tableRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      });
      
      const link = document.createElement('a');
      link.download = 'resumo-presencas.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Erro ao exportar PNG:', error);
    }
  };

  // Formata o índice de esforço como porcentagem
  const formatIndice = (indice: number) => {
    return `${Math.round(indice * 100)}%`;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Resumo de Presenças por Atleta</span>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={exportToPDF}
                className="flex items-center gap-1"
              >
                <FileDown className="h-4 w-4" />
                PDF
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={exportToPNG}
                className="flex items-center gap-1"
              >
                <Printer className="h-4 w-4" />
                PNG
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Visualize métricas de presença e índice de esforço dos atletas.
          </CardDescription>

          <div className="flex flex-col md:flex-row gap-2 mt-2">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                className="pl-8"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
            </div>
            <Select
              value={filterTeam}
              onValueChange={setFilterTeam}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Filtrar por equipe" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as equipes</SelectItem>
                {uniqueTeams.map(team => (
                  <SelectItem key={team} value={team}>
                    {team.charAt(0).toUpperCase() + team.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div ref={tableRef} className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">
                    <button 
                      className="flex items-center font-semibold"
                      onClick={() => handleSort('nome')}
                    >
                      Atleta
                      {renderSortIndicator('nome')}
                    </button>
                  </TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>
                    <button 
                      className="flex items-center font-semibold"
                      onClick={() => handleSort('indice_esforco')}
                    >
                      Índice de Esforço
                      {renderSortIndicator('indice_esforco')}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button 
                      className="flex items-center font-semibold"
                      onClick={() => handleSort('total_presencas')}
                    >
                      Presenças
                      {renderSortIndicator('total_presencas')}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button 
                      className="flex items-center font-semibold"
                      onClick={() => handleSort('total_ausencias')}
                    >
                      Ausências
                      {renderSortIndicator('total_ausencias')}
                    </button>
                  </TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Loading skeleton
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <Skeleton className="h-4 w-[180px]" />
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-full" /></TableCell>
                    </TableRow>
                  ))
                ) : sortedResumos.length > 0 ? (
                  // Data rows
                  sortedResumos.map((resumo) => {
                    const indicePercentual = Math.round(resumo.indice_esforco * 100);
                    
                    return (
                      <TableRow key={resumo.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-10 w-10">
                              {resumo.foto_url ? <AvatarImage src={resumo.foto_url} /> : null}
                              <AvatarFallback>
                                {resumo.nome.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{resumo.nome}</div>
                              <div className="text-xs text-muted-foreground">{resumo.posicao}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            <span className="capitalize">{resumo.time}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col space-y-1">
                            <Progress 
                              value={indicePercentual} 
                              className="h-2"
                              indicatorClassName={getIndiceEsforcoColor(resumo.indice_esforco)}
                            />
                            <span className="text-xs font-medium">
                              {formatIndice(resumo.indice_esforco)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              {resumo.total_presencas}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Badge variant="secondary" className="bg-red-100 text-red-700">
                              {resumo.total_ausencias}
                            </Badge>
                            {resumo.faltas_sem_justificativa > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {resumo.faltas_sem_justificativa} s/j
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-1"
                            onClick={() => handleVerHistorico(resumo)}
                            disabled={loadingHistorico}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  // No data
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">
                      <div className="text-muted-foreground">
                        {filterText || filterTeam !== 'all'
                          ? 'Nenhum atleta encontrado para os filtros aplicados.' 
                          : 'Nenhum dado de presença registrado.'}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Mostrar quantidade total encontrada */}
          {!isLoading && sortedResumos.length > 0 && (
            <div className="text-xs text-muted-foreground mt-2">
              Exibindo {sortedResumos.length} {sortedResumos.length === 1 ? 'atleta' : 'atletas'}
              {(filterText || filterTeam !== 'all') ? ' após filtros aplicados.' : '.'}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Modal de detalhes */}
      {selectedAtleta && (
        <DetalhePresencaModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          atleta={selectedAtleta}
          historico={historicoAtleta}
        />
      )}
    </>
  );
};

export default ResumoPresencas; 