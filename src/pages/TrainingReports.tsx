
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Download, Search, Calendar, X, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { toast } from '@/components/ui/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import PageTitle from '@/components/PageTitle';
import { cn } from '@/lib/utils';
import { exportTrainingToPdf } from '@/services/pdfExportService';
import { getTrainingById } from '@/services/trainingService';
import { fetchExerciciosByTrainingId } from '@/services/exercicioService';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import RoleProtectedRoute from '@/components/RoleProtectedRoute';

interface TrainingReport {
  id: string;
  training_id: string;
  training_name: string;
  training_date: string;
  created_at: string;
  report_url?: string;
}

const TrainingReports = () => {
  const [reports, setReports] = useState<TrainingReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<TrainingReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    filterReports();
  }, [searchText, selectedDate, reports]);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, you would fetch reports from your database
      // For now, we'll list the trainings and allow generating reports on demand
      const { data: trainings, error } = await supabase
        .from('treinos')
        .select('id, nome, data')
        .order('data', { ascending: false });

      if (error) throw error;

      // Convert to reports format
      const reportsList: TrainingReport[] = trainings.map(training => ({
        id: training.id,
        training_id: training.id,
        training_name: training.nome,
        training_date: training.data,
        created_at: new Date().toISOString()
      }));

      setReports(reportsList);
      setFilteredReports(reportsList);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os relatórios.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterReports = () => {
    let filtered = [...reports];
    
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(report => 
        report.training_name.toLowerCase().includes(searchLower)
      );
    }
    
    if (selectedDate) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      filtered = filtered.filter(report => 
        report.training_date === dateStr
      );
    }
    
    setFilteredReports(filtered);
  };

  const clearFilters = () => {
    setSearchText('');
    setSelectedDate(undefined);
  };

  const handleGenerateReport = async (training: TrainingReport) => {
    if (generatingReport) return; // Prevent multiple simultaneous generations
    
    setGeneratingReport(training.id);
    try {
      toast({
        title: "Gerando relatório",
        description: "Por favor, aguarde...",
      });

      // Fetch detailed training data
      const trainingData = await getTrainingById(training.training_id);
      
      if (!trainingData) {
        toast({
          title: "Erro",
          description: "Treino não encontrado",
          variant: "destructive",
        });
        return;
      }

      // Fetch training exercises
      const exercises = await fetchExerciciosByTrainingId(training.training_id);

      // Generate PDF
      await exportTrainingToPdf({
        training: trainingData,
        exercises,
        userName: user?.email || "usuário"
      });
      
      toast({
        title: "Sucesso",
        description: "Relatório gerado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o relatório",
        variant: "destructive",
      });
    } finally {
      setGeneratingReport(null);
    }
  };

  return (
    <RoleProtectedRoute allowedRoles={['coach', 'trainer']}>
      <div className="mobile-container pb-16">
        <PageTitle>Relatórios de Treinos</PageTitle>
        
        {/* Filter controls */}
        <div className="mb-6 space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                className="pl-8"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className={cn(
                  selectedDate && "text-primary border-primary"
                )}>
                  <Calendar className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            {(searchText || selectedDate) && (
              <Button variant="ghost" size="icon" onClick={clearFilters}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Reports list */}
        {isLoading ? (
          <div className="flex justify-center py-10">
            <LoadingSpinner />
          </div>
        ) : filteredReports.length > 0 ? (
          <div className="space-y-3 pb-20">
            {filteredReports.map((report) => (
              <div key={report.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{report.training_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(report.training_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateReport(report)}
                    disabled={generatingReport === report.id}
                  >
                    {generatingReport === report.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Gerar PDF
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <FileText className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">
              Nenhum relatório encontrado
            </p>
          </div>
        )}
      </div>
    </RoleProtectedRoute>
  );
};

export default TrainingReports;
