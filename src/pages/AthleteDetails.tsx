
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, User } from 'lucide-react';
import { HistoricoTreinosAtleta } from '@/components/atleta/HistoricoTreinosAtleta';

// Simplified placeholder component
const Placeholder = ({ children }: { children: React.ReactNode }) => (
  <div className="border border-dashed border-gray-300 rounded-md p-4 flex items-center justify-center bg-gray-50 h-40">
    <p className="text-gray-500">{children}</p>
  </div>
);

const AthleteDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [athlete, setAthlete] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [historicoTreinos, setHistoricoTreinos] = useState<any[]>([]);

  useEffect(() => {
    const fetchAthleteDetails = async () => {
      if (!id) return;

      try {
        setLoading(true);
        // Fetch athlete details
        const { data, error } = await supabase
          .from('athletes')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setAthlete(data);

        // Fetch training history
        const { data: historicoData, error: historicoError } = await supabase
          .from('treinos_presencas')
          .select(`
            id,
            presente,
            justificativa,
            treino_do_dia:treino_do_dia_id(
              id,
              data,
              treino:treino_id(id, nome, local)
            )
          `)
          .eq('atleta_id', id)
          .order('created_at', { ascending: false });

        if (historicoError) throw historicoError;

        // Format history data for component
        const formattedHistorico = historicoData.map(item => ({
          treinoId: item.treino_do_dia?.id || '',
          nomeTreino: item.treino_do_dia?.treino?.nome || 'Treino sem nome',
          data: item.treino_do_dia?.data || '',
          local: item.treino_do_dia?.treino?.local || '',
          presenca: item.presente,
          justificativa: item.justificativa || '',
          fundamentos: [] // Empty for now, would be populated with real data
        }));

        setHistoricoTreinos(formattedHistorico);

      } catch (error) {
        console.error('Error fetching athlete details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAthleteDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center">
          <div className="animate-pulse w-full max-w-4xl">
            <div className="h-8 w-48 bg-gray-200 rounded mb-4"></div>
            <div className="h-40 bg-gray-200 rounded mb-4"></div>
            <div className="h-60 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Atleta não encontrado</h2>
          <p className="mb-4">O atleta que você procura não existe ou foi removido.</p>
          <Button onClick={() => navigate('/atletas')}>Voltar para lista de atletas</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      {/* Back button */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar</span>
        </Button>
      </div>

      {/* Athlete header card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
            <Avatar className="h-24 w-24">
              <AvatarImage src={athlete.foto_url || ''} alt={athlete.nome} />
              <AvatarFallback className="bg-primary text-lg">
                {athlete.nome?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="text-center sm:text-left">
              <h1 className="text-2xl font-bold">{athlete.nome}</h1>
              <div className="text-muted-foreground mt-1">
                <p>{athlete.posicao} | Time {athlete.time}</p>
                <p className="mt-1">Idade: {athlete.idade} | Altura: {athlete.altura}m</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different athlete data */}
      <Tabs defaultValue="historico" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="historico">Histórico de Treinos</TabsTrigger>
          <TabsTrigger value="desempenho">Desempenho</TabsTrigger>
          <TabsTrigger value="info">Informações</TabsTrigger>
        </TabsList>

        <TabsContent value="historico">
          <HistoricoTreinosAtleta historico={historicoTreinos} />
        </TabsContent>

        <TabsContent value="desempenho">
          <Card>
            <CardHeader>
              <CardTitle>Desempenho do Atleta</CardTitle>
            </CardHeader>
            <CardContent>
              <Placeholder>
                Painel de desempenho será implementado em breve
              </Placeholder>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Contato</h3>
                  <p>Email: {athlete.email || 'Não informado'}</p>
                  <p>Telefone: {athlete.telefone || 'Não informado'}</p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Acesso ao Sistema</h3>
                  <p>Status: {athlete.access_status || 'Não configurado'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AthleteDetails;
