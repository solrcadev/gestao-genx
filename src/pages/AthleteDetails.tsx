
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchAthleteById } from "@/services/athletesService";
import { getAthletePerformance } from "@/services/performanceService";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Clipboard, Calendar, Award, UserRound } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { buscarFaltasPorAtleta } from "@/services/presencaService";

// Create simple placeholder components for the missing chart components
const PerformanceChart = ({ data }: { data: any }) => (
  <Card className="w-full h-60">
    <CardHeader>
      <CardTitle className="text-lg">Desempenho</CardTitle>
    </CardHeader>
    <CardContent className="flex items-center justify-center">
      <div className="text-muted-foreground">Dados de desempenho do atleta</div>
    </CardContent>
  </Card>
);

const PerformanceRadarChart = ({ data }: { data: any }) => (
  <Card className="w-full h-60">
    <CardHeader>
      <CardTitle className="text-lg">Fundamentos</CardTitle>
    </CardHeader>
    <CardContent className="flex items-center justify-center">
      <div className="text-muted-foreground">Distribuição de fundamentos</div>
    </CardContent>
  </Card>
);

const PerformanceMetricCard = ({ title, value, trend }: { title: string; value: string | number; trend?: number }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {trend !== undefined && (
        <p className={`text-xs ${trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-gray-500'}`}>
          {trend > 0 ? "+" : ""}{trend}% em relação à média
        </p>
      )}
    </CardContent>
  </Card>
);

const AthleteDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [attendanceStats, setAttendanceStats] = useState<any>({ totalFaltas: 0 });

  // Fetch athlete data
  const { data: athlete, isLoading: isLoadingAthlete } = useQuery({
    queryKey: ["athlete", id],
    queryFn: () => fetchAthleteById(id!),
    enabled: !!id,
  });

  // Fetch performance data
  const { data: performanceData, isLoading: isLoadingPerformance } = useQuery({
    queryKey: ["performance", id],
    queryFn: () => getAthletePerformance(id!),
    enabled: !!id,
  });

  // Mocked training history for now
  const trainings = [
    {
      id: "1",
      data: "2025-04-30",
      treino: { id: "1", nome: "Treino Tático", local: "Quadra Principal" },
    },
    {
      id: "2",
      data: "2025-04-28",
      treino: { id: "2", nome: "Treino Físico", local: "Academia" },
    },
    {
      id: "3",
      data: "2025-04-25",
      treino: { id: "3", nome: "Treino de Fundamentos", local: "Quadra Auxiliar" },
    },
  ];

  // Load attendance stats
  useEffect(() => {
    if (id) {
      buscarFaltasPorAtleta(id)
        .then((faltas) => {
          setAttendanceStats({ totalFaltas: faltas });
        })
        .catch((error) => {
          console.error("Error loading attendance stats:", error);
          toast({
            title: "Erro ao carregar estatísticas de presença",
            description: "Não foi possível carregar os dados de presença do atleta.",
            variant: "destructive",
          });
        });
    }
  }, [id, toast]);

  if (isLoadingAthlete) {
    return (
      <div className="container flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="container py-10">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Atleta não encontrado</h2>
          <p className="text-muted-foreground mt-2">
            O atleta solicitado não foi encontrado ou não existe.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate("/atletas")}
          >
            Voltar para lista de atletas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Header with back button */}
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Detalhe do Atleta</h1>
      </div>

      {/* Athlete profile card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <Avatar className="h-24 w-24">
              {athlete.foto_url ? (
                <AvatarImage
                  src={athlete.foto_url}
                  alt={athlete.nome}
                  className="object-cover"
                />
              ) : (
                <AvatarFallback className="text-2xl">
                  {athlete.nome.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="space-y-2 flex-1">
              <h2 className="text-2xl font-bold">{athlete.nome}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <UserRound className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground">
                    {athlete.posicao || "Posição não informada"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground">
                    Time {athlete.time || "Não especificado"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clipboard className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground">
                    {attendanceStats.totalFaltas} faltas no último mês
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground">
                    {athlete.idade ? `${athlete.idade} anos` : "Idade não informada"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Tabs defaultValue="performance">
        <TabsList className="mb-4">
          <TabsTrigger value="performance">Desempenho</TabsTrigger>
          <TabsTrigger value="training-history">Histórico de Treinos</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          {isLoadingPerformance ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
              <Skeleton className="h-[300px] w-full" />
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <PerformanceMetricCard 
                  title="Índice de Eficiência" 
                  value={athlete.indice_esforco ? (athlete.indice_esforco * 100).toFixed(0) + "%" : "N/A"} 
                  trend={10} 
                />
                <PerformanceMetricCard 
                  title="Média de Presença" 
                  value="85%" 
                  trend={5} 
                />
                <PerformanceMetricCard 
                  title="Fundamentos Dominantes" 
                  value="3" 
                />
                <PerformanceMetricCard 
                  title="Taxa de Evolução" 
                  value="+12%" 
                  trend={12} 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PerformanceChart data={performanceData || []} />
                <PerformanceRadarChart data={performanceData || []} />
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="training-history">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Treinos</CardTitle>
              <CardDescription>
                Últimos treinos que o atleta participou
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trainings.map((training) => (
                  <div
                    key={training.id}
                    className="flex flex-col md:flex-row justify-between border-b pb-4"
                  >
                    <div>
                      <p className="font-medium">{training.treino.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        {training.treino.local}
                      </p>
                    </div>
                    <div className="mt-2 md:mt-0">
                      <p className="text-sm">
                        {format(new Date(training.data), "PPP", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas Detalhadas</CardTitle>
              <CardDescription>
                Estatísticas de desempenho do atleta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10">
                <p className="text-muted-foreground">
                  Estatísticas detalhadas serão implementadas em breve.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AthleteDetails;
