
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  getAvaliacoesParaAprovar, 
  aprovarAvaliacao, 
  rejeitarAvaliacao 
} from '@/services/athletes/evaluations';
import { PageTitle } from '@/components/PageTitle';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import RoleProtectedRoute from '@/components/RoleProtectedRoute';

interface Avaliacao {
  id: string;
  atleta_id: string;
  treino_id: string;
  fundamento: string;
  acertos: number;
  erros: number;
  timestamp: string;
  precisaAprovacao: boolean;
  monitor_id: string;
  atleta: {
    nome: string;
    time: string;
    posicao: string;
  };
  monitor: {
    nome: string;
    email: string;
  };
}

const EvaluationManagement = () => {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [avaliacaoSelecionada, setAvaliacaoSelecionada] = useState<Avaliacao | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [processando, setProcessando] = useState(false);
  const { profile } = useAuth();
  
  // Verificar se usuário é técnico
  const isTecnico = profile?.funcao === 'tecnico';

  // Carregar avaliações pendentes
  useEffect(() => {
    const carregarAvaliacoes = async () => {
      setLoading(true);
      try {
        const data = await getAvaliacoesParaAprovar();
        setAvaliacoes(data || []);
      } catch (error) {
        console.error('Erro ao carregar avaliações:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar as avaliações pendentes.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (isTecnico) {
      carregarAvaliacoes();
    }
  }, [isTecnico]);

  // Formatar data
  const formatarData = (dataString: string) => {
    try {
      return format(new Date(dataString), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: pt });
    } catch (e) {
      return dataString;
    }
  };

  // Abrir diálogo de aprovação
  const abrirDialogoAprovacao = (avaliacao: Avaliacao) => {
    setAvaliacaoSelecionada(avaliacao);
    setShowApproveDialog(true);
  };

  // Abrir diálogo de rejeição
  const abrirDialogoRejeicao = (avaliacao: Avaliacao) => {
    setAvaliacaoSelecionada(avaliacao);
    setShowRejectDialog(true);
  };

  // Aprovar avaliação
  const handleAprovarAvaliacao = async () => {
    if (!avaliacaoSelecionada) return;
    
    setProcessando(true);
    try {
      await aprovarAvaliacao(avaliacaoSelecionada.id);
      toast({
        title: 'Avaliação aprovada',
        description: `A avaliação de ${avaliacaoSelecionada.atleta.nome} foi aprovada com sucesso.`,
      });
      
      // Remove this evaluation from the list
      setAvaliacoes(prev => prev.filter(a => a.id !== avaliacaoSelecionada.id));
      setShowApproveDialog(false);
    } catch (error) {
      console.error('Erro ao aprovar avaliação:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível aprovar a avaliação.',
        variant: 'destructive',
      });
    } finally {
      setProcessando(false);
    }
  };

  // Rejeitar avaliação
  const handleRejeitarAvaliacao = async () => {
    if (!avaliacaoSelecionada) return;
    
    setProcessando(true);
    try {
      await rejeitarAvaliacao(avaliacaoSelecionada.id);
      toast({
        title: 'Avaliação rejeitada',
        description: `A avaliação de ${avaliacaoSelecionada.atleta.nome} foi rejeitada e removida do sistema.`,
      });
      
      // Remove this evaluation from the list
      setAvaliacoes(prev => prev.filter(a => a.id !== avaliacaoSelecionada.id));
      setShowRejectDialog(false);
    } catch (error) {
      console.error('Erro ao rejeitar avaliação:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível rejeitar a avaliação.',
        variant: 'destructive',
      });
    } finally {
      setProcessando(false);
    }
  };

  // Calcular eficiência
  const calcularEficiencia = (acertos: number, erros: number) => {
    const total = acertos + erros;
    if (total === 0) return 0;
    return Math.round((acertos / total) * 100);
  };

  // Verificar a cor da eficiência baseada na porcentagem
  const getClasseEficiencia = (eficiencia: number) => {
    if (eficiencia >= 80) return 'text-green-600';
    if (eficiencia >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <RoleProtectedRoute allowedRoles={['tecnico']}>
      <div className="container py-6">
        <PageTitle title="Aprovação de Avaliações" />
        
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Carregando avaliações...</p>
          </div>
        ) : avaliacoes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Nenhuma avaliação pendente</h2>
            <p className="text-muted-foreground">
              Todas as avaliações foram processadas. Novas avaliações feitas por monitores aparecerão aqui para sua aprovação.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {avaliacoes.map((avaliacao) => (
              <Card key={avaliacao.id} className="p-4 overflow-hidden">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-lg">{avaliacao.atleta.nome}</h3>
                    <p className="text-sm text-muted-foreground">
                      {avaliacao.atleta.posicao} - {avaliacao.atleta.time}
                    </p>
                  </div>
                  <div className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md text-xs flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Pendente
                  </div>
                </div>
                
                <div className="bg-muted/40 p-3 rounded-md mb-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Fundamento</p>
                      <p className="font-medium">{avaliacao.fundamento}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Eficiência</p>
                      <p className={`font-medium ${getClasseEficiencia(calcularEficiencia(avaliacao.acertos, avaliacao.erros))}`}>
                        {calcularEficiencia(avaliacao.acertos, avaliacao.erros)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Acertos</p>
                      <p className="font-medium text-green-600">{avaliacao.acertos}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Erros</p>
                      <p className="font-medium text-red-600">{avaliacao.erros}</p>
                    </div>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground mb-4">
                  <p>Monitor: {avaliacao.monitor.nome}</p>
                  <p>Data: {formatarData(avaliacao.timestamp)}</p>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 border-green-200 text-green-700 hover:bg-green-50"
                    onClick={() => abrirDialogoAprovacao(avaliacao)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" /> Aprovar
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
                    onClick={() => abrirDialogoRejeicao(avaliacao)}
                  >
                    <XCircle className="h-4 w-4 mr-1" /> Rejeitar
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
        
        {/* Diálogo de aprovação */}
        <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Aprovar Avaliação</DialogTitle>
              <DialogDescription>
                Você está aprovando a avaliação de {avaliacaoSelecionada?.atleta?.nome}.
                Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            
            {avaliacaoSelecionada && (
              <div className="bg-green-50 p-4 rounded-md my-4">
                <p><strong>Fundamento:</strong> {avaliacaoSelecionada.fundamento}</p>
                <p><strong>Acertos:</strong> {avaliacaoSelecionada.acertos}</p>
                <p><strong>Erros:</strong> {avaliacaoSelecionada.erros}</p>
                <p><strong>Eficiência:</strong> {calcularEficiencia(avaliacaoSelecionada.acertos, avaliacaoSelecionada.erros)}%</p>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowApproveDialog(false)} disabled={processando}>
                Cancelar
              </Button>
              <Button onClick={handleAprovarAvaliacao} disabled={processando}>
                {processando ? 'Processando...' : 'Confirmar Aprovação'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Diálogo de rejeição */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rejeitar Avaliação</DialogTitle>
              <DialogDescription>
                Você está rejeitando a avaliação de {avaliacaoSelecionada?.atleta?.nome}.
                A avaliação será removida permanentemente.
              </DialogDescription>
            </DialogHeader>
            
            {avaliacaoSelecionada && (
              <div className="bg-red-50 p-4 rounded-md my-4">
                <p><strong>Fundamento:</strong> {avaliacaoSelecionada.fundamento}</p>
                <p><strong>Acertos:</strong> {avaliacaoSelecionada.acertos}</p>
                <p><strong>Erros:</strong> {avaliacaoSelecionada.erros}</p>
                <p><strong>Eficiência:</strong> {calcularEficiencia(avaliacaoSelecionada.acertos, avaliacaoSelecionada.erros)}%</p>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)} disabled={processando}>
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleRejeitarAvaliacao} 
                disabled={processando}
              >
                {processando ? 'Processando...' : 'Confirmar Rejeição'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RoleProtectedRoute>
  );
};

export default EvaluationManagement;
