import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getAvaliacoesParaAprovar, 
  aprovarAvaliacao, 
  rejeitarAvaliacao 
} from '@/services/athletes/evaluations';
import PageTitle from '@/components/PageTitle';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';

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
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se o usuário é técnico
    if (userRole !== 'tecnico') {
      toast({
        title: "Acesso restrito",
        description: "Esta página é restrita para técnicos.",
        variant: "destructive"
      });
      navigate('/dashboard');
      return;
    }

    // Carregar avaliações pendentes
    const carregarAvaliacoes = async () => {
      try {
        setLoading(true);
        const data = await getAvaliacoesParaAprovar();
        setAvaliacoes(data as Avaliacao[]);
      } catch (error) {
        console.error("Erro ao carregar avaliações:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as avaliações pendentes.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    carregarAvaliacoes();
  }, [userRole, navigate]);

  const handleAprovar = async (id: string) => {
    try {
      await aprovarAvaliacao(id);
      setAvaliacoes(avaliacoes.filter(av => av.id !== id));
      toast({
        title: "Avaliação aprovada",
        description: "A avaliação foi aprovada com sucesso e será contabilizada."
      });
    } catch (error) {
      console.error("Erro ao aprovar avaliação:", error);
      toast({
        title: "Erro",
        description: "Não foi possível aprovar a avaliação.",
        variant: "destructive"
      });
    }
  };

  const handleRejeitar = async (id: string) => {
    try {
      await rejeitarAvaliacao(id);
      setAvaliacoes(avaliacoes.filter(av => av.id !== id));
      toast({
        title: "Avaliação rejeitada",
        description: "A avaliação foi rejeitada e removida do sistema."
      });
    } catch (error) {
      console.error("Erro ao rejeitar avaliação:", error);
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar a avaliação.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-2 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Aprovação de Avaliações</h1>
        <p className="text-muted-foreground">
          Revise e aprove avaliações realizadas pelos monitores
        </p>
      </div>

      <Card className="p-6">
        {loading ? (
          <div className="flex justify-center p-8">
            <p>Carregando avaliações pendentes...</p>
          </div>
        ) : avaliacoes.length === 0 ? (
          <div className="text-center py-10">
            <h3 className="text-lg font-medium">Nenhuma avaliação pendente</h3>
            <p className="text-muted-foreground mt-2">
              Não há avaliações aguardando sua aprovação no momento.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Atleta</TableHead>
                  <TableHead>Fundamento</TableHead>
                  <TableHead>Acertos</TableHead>
                  <TableHead>Erros</TableHead>
                  <TableHead>Eficiência</TableHead>
                  <TableHead>Monitor</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {avaliacoes.map((avaliacao) => {
                  const total = avaliacao.acertos + avaliacao.erros;
                  const eficiencia = total > 0 
                    ? Math.round((avaliacao.acertos / total) * 100) 
                    : 0;
                  
                  return (
                    <TableRow key={avaliacao.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{avaliacao.atleta.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {avaliacao.atleta.time} - {avaliacao.atleta.posicao}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{avaliacao.fundamento}</TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {avaliacao.acertos}
                      </TableCell>
                      <TableCell className="text-red-600 font-medium">
                        {avaliacao.erros}
                      </TableCell>
                      <TableCell>
                        <span className={
                          eficiencia >= 80 ? "text-green-600" : 
                          eficiencia >= 60 ? "text-amber-600" : "text-red-600"
                        }>
                          {eficiencia}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{avaliacao.monitor.nome}</p>
                          <p className="text-xs text-muted-foreground">{avaliacao.monitor.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(avaliacao.timestamp).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleAprovar(avaliacao.id)}
                          >
                            Aprovar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => handleRejeitar(avaliacao.id)}
                          >
                            Rejeitar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default EvaluationManagement;
