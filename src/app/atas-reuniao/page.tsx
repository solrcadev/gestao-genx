'use client';

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchAtasReuniao, verificarECriarTabelaAtas } from '@/services/atasReuniaoService';
import { AtaReuniao } from '@/types/atasReuniao';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, User2Icon, ClipboardListIcon, PlusIcon, SearchIcon, BarChart3Icon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Input } from '@/components/ui/input';

export default function AtasReuniao() {
  const [atas, setAtas] = useState<AtaReuniao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function inicializar() {
      // Verificar se a tabela existe
      await verificarECriarTabelaAtas();
      
      // Carregar atas
      carregarAtas();
    }
    
    inicializar();
  }, []);

  async function carregarAtas() {
    setCarregando(true);
    try {
      const dados = await fetchAtasReuniao();
      setAtas(dados);
    } catch (error) {
      console.error('Erro ao carregar atas:', error);
    } finally {
      setCarregando(false);
    }
  }

  const atasFiltradas = atas.filter(ata => 
    ata.titulo.toLowerCase().includes(filtro.toLowerCase()) ||
    ata.participantes.some(p => p.toLowerCase().includes(filtro.toLowerCase()))
  );

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Atas de Reunião</h1>
          <p className="text-muted-foreground">
            Registros de reuniões da equipe técnica
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/atas-reuniao/dashboard')}>
            <BarChart3Icon className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
          <Button onClick={() => navigate('/atas-reuniao/nova')}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Nova Ata
          </Button>
        </div>
      </div>

      <div className="relative mb-6">
        <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por título ou participante..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="pl-10"
        />
      </div>

      {carregando ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-8 w-1/3" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : atasFiltradas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {atasFiltradas.map((ata) => (
            <div 
              key={ata.id} 
              className="cursor-pointer" 
              onClick={() => navigate(`/atas-reuniao/${ata.id}`)}
            >
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardHeader>
                  <CardTitle>{ata.titulo}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4" />
                    {format(new Date(ata.data), "dd 'de' MMMM 'de' yyyy", { locale: pt })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-1 mb-2">
                    <User2Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {ata.participantes.length} participante{ata.participantes.length !== 1 && 's'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ClipboardListIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {ata.topicos.length} tópico{ata.topicos.length !== 1 && 's'} discutido{ata.topicos.length !== 1 && 's'}
                    </span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Badge variant="outline" className="text-xs">
                    {ata.decisoes.length} decisão(ões)
                  </Badge>
                </CardFooter>
              </Card>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <ClipboardListIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">Nenhuma ata encontrada</h3>
          <p className="text-muted-foreground mb-6">
            {filtro 
              ? `Não foram encontradas atas com o filtro "${filtro}"`
              : 'Ainda não há atas de reunião registradas'}
          </p>
          <Button onClick={() => navigate('/atas-reuniao/nova')}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Criar primeira ata
          </Button>
        </div>
      )}
    </div>
  );
} 