'use client';

import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { fetchAtaReuniao, excluirAtaReuniao, exportarAtaParaJSON, exportarAtaParaPDF } from '@/services/atasReuniaoService';
import { AtaReuniao } from '@/types/atasReuniao';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeftIcon, 
  CalendarIcon, 
  User2Icon, 
  ClipboardListIcon, 
  PencilIcon, 
  TrashIcon,
  CheckIcon,
  AlertTriangleIcon,
  FileTextIcon,
  DownloadIcon,
  FileIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AtaReuniaoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ata, setAta] = useState<AtaReuniao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [dialogoExcluir, setDialogoExcluir] = useState(false);

  useEffect(() => {
    async function carregarAta() {
      if (!id) return;
      
      setCarregando(true);
      try {
        const data = await fetchAtaReuniao(id);
        if (!data) {
          toast.error('Ata não encontrada');
          navigate('/atas-reuniao');
          return;
        }
        setAta(data);
      } catch (error) {
        console.error('Erro ao carregar ata:', error);
        toast.error('Erro ao carregar detalhes da ata');
      } finally {
        setCarregando(false);
      }
    }
    
    carregarAta();
  }, [id, navigate]);

  const handleExcluir = async () => {
    if (!id) return;
    
    try {
      const sucesso = await excluirAtaReuniao(id);
      if (sucesso) {
        toast.success('Ata excluída com sucesso');
        navigate('/atas-reuniao');
      } else {
        toast.error('Erro ao excluir ata');
      }
    } catch (error) {
      console.error('Erro ao excluir ata:', error);
      toast.error('Erro ao excluir ata');
    }
  };

  const handleExportarJSON = () => {
    if (!ata) return;
    
    try {
      const jsonData = exportarAtaParaJSON(ata);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Criar link para download
      const a = document.createElement('a');
      a.href = url;
      a.download = `ata-${ata.id.substring(0, 8)}-${ata.titulo.replace(/\s+/g, '_').toLowerCase()}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Limpar
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Ata exportada como JSON');
    } catch (error) {
      console.error('Erro ao exportar ata como JSON:', error);
      toast.error('Erro ao exportar ata');
    }
  };

  const handleExportarPDF = () => {
    if (!ata) return;
    
    try {
      // Gerar o PDF usando a função exportarAtaParaPDF
      const doc = exportarAtaParaPDF(ata);
      
      // Salvar o PDF gerado
      const nomeArquivo = `ata-${ata.id?.substring(0, 8)}-${ata.titulo.replace(/\s+/g, '_').toLowerCase()}.pdf`;
      doc.save(nomeArquivo);
      
      toast.success('Ata exportada como PDF');
    } catch (error) {
      console.error('Erro ao exportar ata como PDF:', error);
      toast.error('Erro ao exportar ata');
    }
  };

  if (carregando) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-2 mb-6">
          <Link to="/atas-reuniao">
            <Button variant="ghost" size="icon">
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-full mb-4" />
            <Skeleton className="h-4 w-1/3" />
          </CardHeader>
          <CardContent className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!ata) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-2 mb-6">
          <Link to="/atas-reuniao">
            <Button variant="ghost" size="icon">
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Ata Não Encontrada</h1>
        </div>
        
        <Card className="text-center py-12">
          <CardContent>
            <AlertTriangleIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Ata não encontrada</h2>
            <p className="text-muted-foreground mb-6">
              A ata que você está procurando não existe ou foi removida.
            </p>
            <Button onClick={() => navigate('/atas-reuniao')}>
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Voltar para a listagem
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const dataFormatada = format(new Date(ata.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-2 mb-6">
        <Link to="/atas-reuniao">
          <Button variant="ghost" size="icon">
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{ata.titulo}</h1>
          <p className="text-muted-foreground">
            Registro de reunião do dia {dataFormatada}
          </p>
        </div>
      </div>
      
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Detalhes da Reunião</CardTitle>
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <DownloadIcon className="h-4 w-4 mr-2" />
                      Exportar
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={handleExportarPDF}>
                      <FileTextIcon className="h-4 w-4 mr-2" />
                      Exportar como PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportarJSON}>
                      <FileIcon className="h-4 w-4 mr-2" />
                      Exportar como JSON
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(`/atas-reuniao/editar/${ata.id}`)}
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => setDialogoExcluir(true)}
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Data</p>
                  <p className="text-muted-foreground">{dataFormatada}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <User2Icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Participantes</p>
                  <p className="text-muted-foreground">{ata.participantes.length} presentes</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <ClipboardListIcon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Tópicos</p>
                  <p className="text-muted-foreground">{ata.topicos.length} discutidos</p>
                </div>
              </div>
            </div>
            
            {ata.responsavelRegistro && (
              <div className="mt-4">
                <p className="text-sm font-medium">Responsável pelo registro</p>
                <p className="text-muted-foreground">{ata.responsavelRegistro}</p>
              </div>
            )}
            
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">Participantes</h3>
              <div className="flex flex-wrap gap-2">
                {ata.participantes.map((participante, index) => (
                  <Badge key={index} variant="outline" className="py-1">
                    {participante}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">Tópicos Discutidos</h3>
              <div className="space-y-4">
                {ata.topicos.map((topico, index) => (
                  <Card key={index} className="shadow-sm">
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-base">{topico.titulo}</CardTitle>
                    </CardHeader>
                    <CardContent className="py-3 px-4">
                      <p className="text-muted-foreground whitespace-pre-line">{topico.descricao}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            
            {ata.decisoes && ata.decisoes.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">Decisões Tomadas</h3>
                <div className="space-y-4">
                  {ata.decisoes.map((decisao, index) => (
                    <Card key={index} className="shadow-sm">
                      <CardHeader className="py-3 px-4">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-base">{decisao.titulo}</CardTitle>
                          {decisao.responsavel && (
                            <Badge variant="outline" className="ml-2">
                              Resp: {decisao.responsavel}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="py-3 px-4">
                        <p className="text-muted-foreground whitespace-pre-line">{decisao.descricao}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            {ata.observacoes && (
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-2">Observações</h3>
                <p className="text-muted-foreground whitespace-pre-line">{ata.observacoes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <AlertDialog open={dialogoExcluir} onOpenChange={setDialogoExcluir}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Ata de Reunião</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Esta ata será permanentemente removida 
              do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleExcluir} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <TrashIcon className="h-4 w-4 mr-2" />
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 