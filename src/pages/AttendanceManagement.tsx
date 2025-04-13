
import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  fetchAttendanceRecords, 
  AttendanceRecord, 
  updateAttendanceJustification,
  AttendanceFilters,
  getHighAbsenceAthletes
} from '@/services/attendanceService';
import { AlertTriangle, Calendar, Check, Download, FileText, Filter, Search, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import { format as formatDate } from 'date-fns';
import { TeamType } from '@/types';
import { generateAttendancePDF } from '@/services/pdfExportService';

const AttendanceManagement = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<AttendanceFilters>({
    athleteName: '',
    status: 'all',
    team: 'all'
  });
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [justification, setJustification] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [highAbsenceAthletes, setHighAbsenceAthletes] = useState<string[]>([]);
  
  const { toast } = useToast();

  useEffect(() => {
    loadAttendanceRecords();
  }, []);

  useEffect(() => {
    if (records.length > 0) {
      const highAbsenceIds = getHighAbsenceAthletes(records);
      setHighAbsenceAthletes(highAbsenceIds);
    }
  }, [records]);

  const loadAttendanceRecords = async () => {
    setLoading(true);
    try {
      const data = await fetchAttendanceRecords(filters);
      setRecords(data);
      
      // Calculate athletes with high absence rates
      const highAbsenceIds = getHighAbsenceAthletes(data);
      setHighAbsenceAthletes(highAbsenceIds);
    } catch (error) {
      console.error('Failed to load attendance records:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os registros de presença.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = () => {
    const updatedFilters: AttendanceFilters = {
      athleteName: filters.athleteName,
      startDate: startDate,
      endDate: endDate,
      status: filters.status,
      team: filters.team as 'Masculino' | 'Feminino' | 'all'
    };
    
    setFilters(updatedFilters);
    loadAttendanceRecords();
  };

  const handleEditJustification = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setJustification(record.justificativa || '');
    setDialogOpen(true);
  };

  const handleSaveJustification = async () => {
    if (!selectedRecord) return;
    
    try {
      await updateAttendanceJustification(selectedRecord.id, justification);
      
      // Update local state
      setRecords(prevRecords => 
        prevRecords.map(record => 
          record.id === selectedRecord.id 
            ? { ...record, justificativa: justification }
            : record
        )
      );
      
      setDialogOpen(false);
      toast({
        title: 'Sucesso',
        description: 'Justificativa atualizada com sucesso.',
      });
    } catch (error) {
      console.error('Failed to update justification:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a justificativa.',
        variant: 'destructive',
      });
    }
  };

  const handleExportPDF = () => {
    try {
      generateAttendancePDF(records, filters);
      toast({
        title: 'Sucesso',
        description: 'Relatório de presenças exportado com sucesso.',
      });
    } catch (error) {
      console.error('Failed to export PDF:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível exportar o relatório.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="mobile-container pb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestão de Presenças</h1>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="h-4 w-4 mr-2" />
          {showFilters ? 'Ocultar Filtros' : 'Filtros'}
        </Button>
      </div>

      {showFilters && (
        <Card className="p-4 mb-6 space-y-4">
          <div className="space-y-3">
            <div>
              <label htmlFor="athleteName" className="text-sm font-medium mb-1 block">
                Nome do Atleta
              </label>
              <div className="flex items-center">
                <Input
                  id="athleteName"
                  placeholder="Buscar por atleta..."
                  value={filters.athleteName}
                  onChange={(e) => setFilters({ ...filters, athleteName: e.target.value })}
                  className="flex-1"
                />
                <Button variant="ghost" size="icon" className="ml-1">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Data Inicial</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-left" 
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, 'PPP', { locale: ptBR }) : 'Selecionar data'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Data Final</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-left"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'PPP', { locale: ptBR }) : 'Selecionar data'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Status</label>
                <Select 
                  value={filters.status} 
                  onValueChange={(value) => setFilters({ ...filters, status: value as 'all' | 'present' | 'absent' })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Status</SelectLabel>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="present">Presentes</SelectItem>
                      <SelectItem value="absent">Ausentes</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Time</label>
                <Select 
                  value={filters.team as string} 
                  onValueChange={(value) => setFilters({ ...filters, team: value as 'all' | 'Masculino' | 'Feminino' })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Time</SelectLabel>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Feminino">Feminino</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setFilters({
                    athleteName: '',
                    status: 'all',
                    team: 'all'
                  });
                  setStartDate(undefined);
                  setEndDate(undefined);
                }}
              >
                Limpar Filtros
              </Button>
              <Button onClick={handleFilterChange}>
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="mb-4 flex justify-between items-center">
        <div>
          <span className="text-sm text-muted-foreground">
            {records.length} registros encontrados
          </span>
        </div>
        <Button variant="outline" onClick={handleExportPDF}>
          <FileText className="h-4 w-4 mr-2" />
          Exportar PDF
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center my-10">
          <LoadingSpinner />
        </div>
      ) : records.length > 0 ? (
        <ScrollArea className="h-[calc(100vh-300px)]">
          <Table className="min-w-full">
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead>Atleta</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Treino</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Justificativa</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <span className={cn(
                        "mr-2",
                        highAbsenceAthletes.includes(record.atleta.id) && "text-destructive"
                      )}>
                        {record.atleta.nome}
                      </span>
                      {highAbsenceAthletes.includes(record.atleta.id) && (
                        <Badge variant="outline" className="border-destructive text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1 text-destructive" />
                          Faltas frequentes
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground block mt-1">
                      {record.atleta.time} • {record.atleta.posicao}
                    </span>
                  </TableCell>
                  <TableCell>
                    {format(parse(record.treino.data, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell>
                    <span className="block truncate max-w-[150px]">
                      {record.treino.nome}
                    </span>
                    <span className="text-xs text-muted-foreground block">
                      {record.treino.local}
                    </span>
                  </TableCell>
                  <TableCell>
                    {record.presente ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <Check className="h-3 w-3 mr-1" /> Presente
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        <X className="h-3 w-3 mr-1" /> Ausente
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {!record.presente ? (
                      record.justificativa ? (
                        <span className="text-sm truncate block max-w-[150px]">
                          {record.justificativa}
                        </span>
                      ) : (
                        <span className="text-xs italic text-muted-foreground">
                          Sem justificativa
                        </span>
                      )
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {!record.presente && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditJustification(record)}
                      >
                        {record.justificativa ? 'Editar' : 'Adicionar'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      ) : (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <Users className="h-10 w-10 mb-2" />
            <p>Nenhum registro de presença encontrado.</p>
            <p className="text-sm mt-1">Tente ajustar os filtros de busca.</p>
          </div>
        </Card>
      )}
      
      {/* Justification Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedRecord?.justificativa ? 'Editar Justificativa' : 'Adicionar Justificativa'}
            </DialogTitle>
            <DialogDescription>
              {selectedRecord && (
                <div className="text-sm">
                  <span className="font-medium">{selectedRecord.atleta.nome}</span>
                  <span className="mx-1">-</span>
                  <span>
                    {format(
                      parse(selectedRecord.treino.data, 'yyyy-MM-dd', new Date()),
                      'dd/MM/yyyy'
                    )}
                  </span>
                  <span className="mx-1">-</span>
                  <span>{selectedRecord.treino.nome}</span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Digite a justificativa para a falta..."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveJustification}>
              Salvar Justificativa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AttendanceManagement;
