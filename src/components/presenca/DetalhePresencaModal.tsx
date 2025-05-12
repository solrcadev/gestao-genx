import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ClipboardList, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { JustificativaTipo } from '@/hooks/attendance-hooks';

// Interface for detailed attendance history item
export interface HistoricoPresenca {
  id: string;
  data_treino: string;
  treino_nome: string;
  presente: boolean;
  justificativa?: string;
  justificativa_tipo?: JustificativaTipo;
  peso_aplicado: number;
}

interface DetalhePresencaModalProps {
  isOpen: boolean;
  onClose: () => void;
  atleta: {
    id: string;
    nome: string;
    indice_esforco?: number;
  };
  historico: HistoricoPresenca[];
}

const DetalhePresencaModal = ({ isOpen, onClose, atleta, historico }: DetalhePresencaModalProps) => {
  // Format date for display
  const formatarData = (dataString: string) => {
    try {
      const data = new Date(dataString);
      return format(data, "dd/MM/yyyy", { locale: ptBR });
    } catch (e) {
      return dataString;
    }
  };

  // Get badge color based on justification type
  const getJustificativaBadge = (presente: boolean, tipo?: JustificativaTipo) => {
    if (presente) {
      return (
        <Badge className="bg-green-500 hover:bg-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Presente
        </Badge>
      );
    }

    switch(tipo) {
      case JustificativaTipo.MOTIVO_SAUDE:
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Saúde
          </Badge>
        );
      case JustificativaTipo.MOTIVO_ACADEMICO:
        return (
          <Badge className="bg-indigo-500 hover:bg-indigo-600">
            <Info className="h-3 w-3 mr-1" />
            Acadêmico
          </Badge>
        );
      case JustificativaTipo.MOTIVO_LOGISTICO:
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600">
            <Info className="h-3 w-3 mr-1" />
            Logístico
          </Badge>
        );
      case JustificativaTipo.MOTIVO_PESSOAL:
        return (
          <Badge className="bg-orange-500 hover:bg-orange-600">
            <Info className="h-3 w-3 mr-1" />
            Pessoal
          </Badge>
        );
      default:
        return (
          <Badge className="bg-red-500 hover:bg-red-600">
            <XCircle className="h-3 w-3 mr-1" />
            Sem Just.
          </Badge>
        );
    }
  };

  // Format weight as percentage
  const formatarPeso = (peso: number) => {
    return `${Math.round(peso * 100)}%`;
  };

  // Calculate total stats
  const totalTreinos = historico.length;
  const totalPresencas = historico.filter(h => h.presente).length;
  const totalAusencias = totalTreinos - totalPresencas;
  const mediaEsforco = historico.reduce((sum, item) => sum + item.peso_aplicado, 0) / (totalTreinos || 1);
  
  // Convert effort index to percentage
  const indicePercentual = atleta.indice_esforco !== undefined 
    ? Math.round(atleta.indice_esforco * 100) 
    : Math.round(mediaEsforco * 100);

  // Get progress bar color based on effort index
  const getProgressColor = (indice: number) => {
    if (indice >= 90) return "bg-green-500";
    if (indice >= 75) return "bg-emerald-500";
    if (indice >= 60) return "bg-blue-500";
    if (indice >= 40) return "bg-yellow-500";
    if (indice >= 20) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Histórico de Presenças - {atleta.nome}
          </DialogTitle>
          <DialogDescription>
            Detalhamento completo do histórico de presença e justificativas.
          </DialogDescription>
        </DialogHeader>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-2">
          <div className="bg-muted rounded-lg p-3">
            <div className="text-muted-foreground text-xs">Total Treinos</div>
            <div className="text-xl font-semibold">{totalTreinos}</div>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <div className="text-muted-foreground text-xs">Presenças</div>
            <div className="text-xl font-semibold text-green-600">{totalPresencas}</div>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <div className="text-muted-foreground text-xs">Ausências</div>
            <div className="text-xl font-semibold text-red-500">{totalAusencias}</div>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <div className="text-muted-foreground text-xs">Índice de Esforço</div>
            <div className="text-xl font-semibold">{indicePercentual}%</div>
          </div>
        </div>

        {/* Effort index progress bar */}
        <div className="w-full mb-4">
          <div className="flex justify-between mb-1 text-xs">
            <span>Comprometimento</span>
            <span>{indicePercentual}%</span>
          </div>
          <Progress 
            value={indicePercentual} 
            className="h-2"
            indicatorClassName={getProgressColor(indicePercentual)}
          />
        </div>

        {/* Data table */}
        {historico.length === 0 ? (
          <div className="text-center py-8 bg-muted/20 rounded-lg">
            <ClipboardList className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p>Nenhum registro de presença encontrado para este atleta.</p>
          </div>
        ) : (
          <ScrollArea className="flex-1 border rounded-md">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Treino</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Justificativa</TableHead>
                  <TableHead className="text-right">Peso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historico.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{formatarData(item.data_treino)}</TableCell>
                    <TableCell>{item.treino_nome}</TableCell>
                    <TableCell>
                      {getJustificativaBadge(item.presente, item.justificativa_tipo)}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {item.justificativa || (item.presente ? '-' : 'Sem justificativa')}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatarPeso(item.peso_aplicado)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DetalhePresencaModal; 