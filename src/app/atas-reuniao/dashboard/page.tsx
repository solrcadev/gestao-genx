'use client';

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchEstatisticasAtas, fetchResumoAtas } from '@/services/atasReuniaoService';
import { ResumoAtas, AtaReuniaoResumida } from '@/types/atasReuniao';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeftIcon, BarChart3Icon, FileTextIcon, UsersIcon, CheckCircleIcon, CalendarIcon, ListTodoIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Cores para os gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function DashboardAtasReuniao() {
  const [estatisticas, setEstatisticas] = useState<ResumoAtas | null>(null);
  const [atasRecentes, setAtasRecentes] = useState<AtaReuniaoResumida[]>([]);
  const [carregando, setCarregando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function carregarDados() {
      setCarregando(true);
      try {
        const [stats, atas] = await Promise.all([
          fetchEstatisticasAtas(),
          fetchResumoAtas()
        ]);
        
        setEstatisticas(stats);
        setAtasRecentes(atas.slice(0, 5)); // Pegamos apenas as 5 mais recentes
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
      } finally {
        setCarregando(false);
      }
    }
    
    carregarDados();
  }, []);

  // Preparar dados para o gráfico de tópicos por reunião
  const dadosTopicosPorReuniao = atasRecentes.map(ata => ({
    nome: ata.titulo.length > 20 ? `${ata.titulo.substring(0, 20)}...` : ata.titulo,
    tópicos: ata.quantidadeTopicos,
    decisões: ata.quantidadeDecisoes
  })).reverse(); // Invertemos para mostrar cronologicamente

  // Preparar dados para o gráfico de pizza de participantes
  const dadosParticipantes = atasRecentes.map(ata => ({
    name: format(new Date(ata.data), 'dd/MM/yy'),
    value: ata.participantes.length
  }));

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/atas-reuniao')}>
          <ArrowLeftIcon className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Atas</h1>
          <p className="text-muted-foreground">
            Análise e estatísticas das reuniões realizadas
          </p>
        </div>
      </div>
      
      {carregando ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-1/3 mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center">
                  <FileTextIcon className="h-4 w-4 mr-1" />
                  Total de Atas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{estatisticas?.totalAtas || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {estatisticas?.ultimaReuniaoData ? (
                    <>Última em {format(new Date(estatisticas.ultimaReuniaoData), "dd 'de' MMMM", { locale: ptBR })}</>
                  ) : (
                    'Nenhuma ata registrada'
                  )}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center">
                  <UsersIcon className="h-4 w-4 mr-1" />
                  Participantes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{estatisticas?.totalParticipantes || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Média de {estatisticas?.mediaParticipantesReuniao || 0} por reunião
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center">
                  <ListTodoIcon className="h-4 w-4 mr-1" />
                  Tópicos Discutidos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{estatisticas?.totalTopicos || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Média de {estatisticas?.mediaTopicosReuniao || 0} por reunião
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center">
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Decisões Tomadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{estatisticas?.totalDecisoes || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Em todas as reuniões realizadas
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2 mb-6">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Tópicos e Decisões por Reunião</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {dadosTopicosPorReuniao.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dadosTopicosPorReuniao}
                      margin={{ top: 20, right: 30, left: 0, bottom: 30 }}
                    >
                      <XAxis dataKey="nome" angle={-45} textAnchor="end" height={60} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="tópicos" fill="#0088FE" name="Tópicos" />
                      <Bar dataKey="decisões" fill="#00C49F" name="Decisões" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Sem dados suficientes para exibir o gráfico</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Participação por Reunião</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {dadosParticipantes.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dadosParticipantes}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {dadosParticipantes.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Sem dados suficientes para exibir o gráfico</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Atas Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {atasRecentes.length > 0 ? (
                <div className="space-y-4">
                  {atasRecentes.map(ata => (
                    <div 
                      key={ata.id} 
                      className="flex items-start justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/atas-reuniao/${ata.id}`)}
                    >
                      <div>
                        <h3 className="font-medium">{ata.titulo}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <CalendarIcon className="h-3 w-3 mr-1" />
                            {format(new Date(ata.data), "dd 'de' MMMM", { locale: ptBR })}
                          </span>
                          <span className="flex items-center">
                            <UsersIcon className="h-3 w-3 mr-1" />
                            {ata.participantes.length} participantes
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <div className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                          {ata.quantidadeTopicos} tópicos
                        </div>
                        <div className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-500">
                          {ata.quantidadeDecisoes} decisões
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <FileTextIcon className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <h3 className="text-lg font-medium mb-1">Nenhuma ata encontrada</h3>
                  <p className="text-muted-foreground">
                    Crie novas atas para visualizar estatísticas
                  </p>
                  <Button className="mt-4" onClick={() => navigate('/atas-reuniao/nova')}>
                    Criar primeira ata
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
} 