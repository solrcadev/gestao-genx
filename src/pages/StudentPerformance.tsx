
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import { getAthleteById } from '@/services/athleteService';
import { Athlete } from '@/types';
import HistoricoTreinosAtleta from '@/components/performance/HistoricoTreinosAtleta';

const StudentPerformance: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [athlete, setAthlete] = useState<Athlete | null>(null);

  const { data: athleteData, isLoading, isError } = useQuery({
    queryKey: ['athleteDetails', studentId],
    queryFn: () => getAthleteById(studentId!),
    enabled: !!studentId,
  });

  useEffect(() => {
    if (athleteData) {
      setAthlete(athleteData);
    }
  }, [athleteData]);

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (isError) {
    return <div>Erro ao carregar os dados do atleta.</div>;
  }

  if (!athlete) {
    return <div>Atleta não encontrado.</div>;
  }

  return (
    <div className="mobile-container py-6 pb-20">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage src={athlete.foto_url || ""} alt={athlete.nome} />
              <AvatarFallback>{athlete.nome.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{athlete.nome}</CardTitle>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">{athlete.posicao}</Badge>
                <span>{athlete.time}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p><strong>Idade:</strong> {athlete.idade} anos</p>
          <p><strong>Altura:</strong> {athlete.altura} cm</p>
        </CardContent>
      </Card>

      <Tabs defaultValue="historico-treinos" className="w-full">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="historico-treinos">Histórico de Treinos</TabsTrigger>
        </TabsList>
        {/* Histórico de Treinos */}
        <TabsContent value="historico-treinos" className="p-0">
          <Card className="border-0 shadow-none">
            <CardContent className="p-0">
              <HistoricoTreinosAtleta atletaId={studentId!} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentPerformance;
