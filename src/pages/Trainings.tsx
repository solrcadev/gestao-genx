
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { toast } from "@/components/ui/use-toast";
import { deleteTraining, fetchTrainings, createTraining, updateTraining } from '@/services/trainingService';
import { Team } from '@/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const Trainings: React.FC = () => {
  const [team, setTeam] = useState<Team>("Masculino");
  const [open, setOpen] = useState(false);
  const [trainingIdToDelete, setTrainingIdToDelete] = useState<string | null>(null);
  const [trainingIdToEdit, setTrainingIdToEdit] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [data, setData] = useState<Date | undefined>(undefined);
  const [descricao, setDescricao] = useState('');
  const [local, setLocal] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team>('Masculino');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { isLoading, error, data: trainings } = useQuery({
    queryKey: ['trainings', team],
    queryFn: () => fetchTrainings(),
  });

  const { mutate: create, isPending: isCreating } = useMutation({
    mutationFn: createTraining,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings', team] });
      toast({
        title: "Treino criado",
        description: "O treino foi criado com sucesso.",
      });
      resetForm();
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar",
        description: error.message || "Ocorreu um erro ao criar o treino.",
        variant: "destructive",
      });
    },
  });

  const { mutate: update, isPending: isUpdating } = useMutation({
    mutationFn: updateTraining,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings', team] });
      toast({
        title: "Treino atualizado",
        description: "O treino foi atualizado com sucesso.",
      });
      resetForm();
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Ocorreu um erro ao atualizar o treino.",
        variant: "destructive",
      });
    },
  });

  const { mutate: remove, isPending: isDeleting } = useMutation({
    mutationFn: deleteTraining,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings', team] });
      toast({
        title: "Treino excluído",
        description: "O treino foi excluído com sucesso.",
      });
      setTrainingIdToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir",
        description: error.message || "Ocorreu um erro ao excluir o treino.",
        variant: "destructive",
      });
      setTrainingIdToDelete(null);
    },
  });

  useEffect(() => {
    if (trainingIdToEdit) {
      const trainingToEdit = trainings?.find(training => training.id === trainingIdToEdit);
      if (trainingToEdit) {
        setIsEditMode(true);
        setNome(trainingToEdit.nome);
        setData(trainingToEdit.data ? new Date(trainingToEdit.data) : undefined);
        setDescricao(trainingToEdit.descricao || '');
        setLocal(trainingToEdit.local || '');
        setSelectedTeam(trainingToEdit.time as Team);
        setOpen(true);
      }
    } else {
      setIsEditMode(false);
    }
  }, [trainingIdToEdit, trainings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      nome,
      data: data ? format(data, 'yyyy-MM-dd') : undefined,
      descricao,
      local,
      time: selectedTeam,
    };

    if (isEditMode && trainingIdToEdit) {
      update({ id: trainingIdToEdit, ...payload });
    } else {
      create(payload);
    }
  };

  const resetForm = () => {
    setNome('');
    setData(undefined);
    setDescricao('');
    setLocal('');
    setSelectedTeam('Masculino');
    setTrainingIdToEdit(null);
    setIsEditMode(false);
  };

  const handleDelete = () => {
    if (trainingIdToDelete) {
      remove(trainingIdToDelete);
    }
  };

  const handleTeamChange = (value: string) => {
    if (value === 'Masculino' || value === 'Feminino') {
      setSelectedTeam(value);
    } else {
      setSelectedTeam('Masculino'); // Default fallback
    }
  };

  return (
    <div className="container max-w-7xl mx-auto space-y-6 py-6 pb-20">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Treinos</CardTitle>
          <CardDescription>
            Crie, edite e exclua treinos para sua equipe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex justify-between items-center">
              <div>
                <Label htmlFor="team">Time</Label>
                <Select value={team} onValueChange={(value) => setTeam(value as Team)}>
                  <SelectTrigger id="team">
                    <SelectValue placeholder="Selecione o time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Feminino">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => { setOpen(true); resetForm(); }} >
                Adicionar Treino
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Treinos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>Lista de treinos do time {team}.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Data</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Local</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-4" />
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {trainings?.map((training) => (
                <TableRow key={training.id}>
                  <TableCell className="font-medium">{training.data ? format(new Date(training.data), 'dd/MM/yyyy', { locale: ptBR }) : 'Sem data'}</TableCell>
                  <TableCell>{training.nome}</TableCell>
                  <TableCell>{training.descricao}</TableCell>
                  <TableCell>{training.local}</TableCell>
                  <TableCell>
                    <Button variant="secondary" size="sm" onClick={() => navigate(`/montar-treino?trainingId=${training.id}`)}>
                      Ver Exercícios
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setTrainingIdToEdit(training.id)}>
                      Editar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          Excluir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação é irreversível. Tem certeza de que deseja excluir este treino?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => setTrainingIdToDelete(training.id)}>{isDeleting ? 'Excluindo...' : 'Excluir'}</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && (!trainings || trainings.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Nenhum treino encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!trainingIdToDelete} onOpenChange={(open) => { if (!open) setTrainingIdToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. Tem certeza de que deseja excluir este treino?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>{isDeleting ? 'Excluindo...' : 'Excluir'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Editar Treino' : 'Adicionar Treino'}</DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Edite os detalhes do treino.' : 'Insira os detalhes do novo treino.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                placeholder="Nome do treino"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="data">Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    {data ? format(data, 'PPP', { locale: ptBR }) : <span>Selecione uma data</span>}
                    <Calendar className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={data}
                    onSelect={setData}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                placeholder="Descrição do treino"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="local">Local</Label>
              <Input
                id="local"
                placeholder="Local do treino"
                value={local}
                onChange={(e) => setLocal(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="time">Time</Label>
              <Select value={selectedTeam} onValueChange={handleTeamChange}>
                <SelectTrigger id="time">
                  <SelectValue placeholder="Selecione o time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Masculino">Masculino</SelectItem>
                  <SelectItem value="Feminino">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isCreating || isUpdating}>
              {isEditMode
                ? (isUpdating ? 'Atualizando...' : 'Atualizar Treino')
                : (isCreating ? 'Criando...' : 'Adicionar Treino')}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Trainings;
