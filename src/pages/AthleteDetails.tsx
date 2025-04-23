import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ArrowLeft, User, BarChart2, Calendar } from 'lucide-react';
import { Athlete } from '@/types';
import { getAthleteById } from '@/services/athleteService';
import HistoricoTreinosAtleta from '@/components/atleta/HistoricoTreinosAtleta';
import { AthleteAccessManager } from '@/components/atleta/AthleteAccessManager';

const AthleteDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (id) {
      loadAthleteDetails(id);
    }
  }, [id]);

  const loadAthleteDetails = async (athleteId: string) => {
    setLoading(true);
    try {
      const data = await getAthleteById(athleteId);
      setAthlete(data);
    } catch (error) {
      console.error('Erro ao carregar detalhes do atleta:', error);
      toast({
        title: 'Erro ao carregar detalhes',
        description: 'Não foi possível carregar os detalhes do atleta.',
        variant: 'destructive',
      });
      // Redirecionar de volta à listagem de atletas em caso de erro
      navigate('/atletas');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '';
    
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getTeamColor = (team: string) => {
    return team === 'Masculino' ? 'bg-sport-blue' : 'bg-sport-red';
  };

  const handleAccessUpdate = (updatedAthlete: Athlete) => {
    setAthlete(updatedAthlete);
  };

  if (loading) {
    return (
      <div className="container-md flex items-center justify-center min-h-[80vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="container-md py-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Atleta não encontrado</h2>
          <p className="text-muted-foreground mt-2">O atleta solicitado não existe ou foi removido.</p>
          <Button onClick={() => navigate('/atletas')} className="mt-4">
            Voltar para listagem
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-md py-6 animate-fade-in">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/atletas')}
          className="mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Detalhes do Atleta</h1>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <Avatar className="w-24 h-24 border-2 border-muted">
              <AvatarImage src={athlete.foto_url || ''} alt={athlete.nome} />
              <AvatarFallback className={`text-2xl font-semibold ${getTeamColor(athlete.time)}`}>
                {getInitials(athlete.nome)}
              </AvatarFallback>
            </Avatar>
            
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold">{athlete.nome}</h2>
              <div className="text-sm text-muted-foreground mt-1">
                {athlete.posicao} • {athlete.idade} anos • {athlete.altura}cm
              </div>
              <div className={`mt-2 inline-block px-3 py-1 rounded-full text-sm font-medium ${getTeamColor(athlete.time)}`}>
                {athlete.time}
              </div>
            </div>
          </div>
          
          {/* Adicionar Gerenciamento de Acesso */}
          <AthleteAccessManager 
            athlete={athlete} 
            onUpdate={handleAccessUpdate}
          />
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            <span className="hidden sm:inline">Desempenho</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Histórico</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4">Informações Pessoais</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nome completo</p>
                  <p className="font-medium">{athlete.nome}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-medium">{athlete.time}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Idade</p>
                  <p className="font-medium">{athlete.idade} anos</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Altura</p>
                  <p className="font-medium">{athlete.altura} cm</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Posição</p>
                  <p className="font-medium">{athlete.posicao}</p>
                </div>
                
                {athlete.email && (
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{athlete.email}</p>
                  </div>
                )}
                
                {athlete.telefone && (
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium">{athlete.telefone}</p>
                  </div>
                )}
                
                {athlete.observacoes && (
                  <div className="col-span-1 md:col-span-2">
                    <p className="text-sm text-muted-foreground">Observações</p>
                    <p className="font-medium">{athlete.observacoes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4">Estatísticas de Desempenho</h3>
              <div className="flex flex-col items-center justify-center py-8">
                <p className="text-muted-foreground">
                  Aqui será exibido o desempenho detalhado do atleta.
                </p>
                <Button 
                  onClick={() => navigate(`/aluno/${id}/performance`)}
                  className="mt-4"
                >
                  Ver desempenho detalhado
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <HistoricoTreinosAtleta atletaId={id || ''} atletaNome={athlete.nome} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AthleteDetails;
