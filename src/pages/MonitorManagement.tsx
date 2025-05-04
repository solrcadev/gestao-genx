
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import PageTitle from '@/components/PageTitle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { UserPlus, UserCheck, UserX } from 'lucide-react';

interface Monitor {
  id: string;
  email: string;
  nome: string;
  status: 'ativo' | 'inativo' | 'pendente';
  created_at: string;
}

const MonitorManagement = () => {
  const { user, profile, isLoading } = useAuth();
  const navigate = useNavigate();
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newMonitor, setNewMonitor] = useState({
    email: '',
    nome: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(true);

  // Redirect if not a technician
  useEffect(() => {
    if (!isLoading && (!user || (profile && profile.funcao !== 'tecnico'))) {
      toast({
        title: "Acesso restrito",
        description: "Esta área é exclusiva para técnicos.",
        variant: "destructive",
      });
      navigate('/dashboard');
    }
  }, [user, profile, isLoading, navigate]);

  // Fetch monitors data
  useEffect(() => {
    const fetchMonitors = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('perfis')
          .select('id, user_id, status, created_at')
          .eq('funcao', 'monitor');

        if (error) throw error;

        // Get user details for each monitor
        const monitorsWithDetails = await Promise.all(
          data.map(async (monitor) => {
            if (!monitor.user_id) {
              return {
                ...monitor,
                email: 'Não vinculado',
                nome: 'Usuário pendente',
              };
            }

            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('email, nome')
              .eq('id', monitor.user_id)
              .single();

            if (userError) {
              console.error('Error fetching user data:', userError);
              return {
                ...monitor,
                email: 'Erro ao carregar',
                nome: 'Erro ao carregar',
              };
            }

            return {
              ...monitor,
              email: userData?.email || 'N/A',
              nome: userData?.nome || 'Sem nome',
            };
          })
        );

        setMonitors(monitorsWithDetails);
      } catch (error) {
        console.error('Error fetching monitors:', error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar a lista de monitores.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (user && profile?.funcao === 'tecnico') {
      fetchMonitors();
    }
  }, [user, profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewMonitor(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!newMonitor.email || !newMonitor.nome || !newMonitor.password) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return false;
    }

    if (newMonitor.password !== newMonitor.confirmPassword) {
      toast({
        title: "Senhas diferentes",
        description: "As senhas inseridas não coincidem.",
        variant: "destructive",
      });
      return false;
    }

    if (newMonitor.password.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const createMonitor = async () => {
    if (!validateForm()) return;

    try {
      setIsCreating(true);

      // 1. Create a new user in Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newMonitor.email,
        password: newMonitor.password,
        options: {
          data: {
            nome: newMonitor.nome,
          }
        }
      });

      if (authError || !authData.user) throw authError || new Error("Falha ao criar usuário");

      // 2. Create a record in the users table
      const { error: userError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          email: newMonitor.email,
          nome: newMonitor.nome,
          encrypted_password: 'supabase_auth_handles_this',
          role: 'monitor'
        }]);

      if (userError) throw userError;

      // 3. Create a profile for the monitor
      const { data: profileData, error: profileError } = await supabase
        .from('perfis')
        .insert([{
          user_id: authData.user.id,
          funcao: 'monitor',
          status: 'ativo'
        }])
        .select();

      if (profileError) throw profileError;

      toast({
        title: "Monitor criado com sucesso",
        description: `${newMonitor.nome} foi adicionado como monitor.`,
      });

      // Add the new monitor to the list
      if (profileData && profileData[0]) {
        setMonitors(prev => [...prev, {
          id: profileData[0].id,
          email: newMonitor.email,
          nome: newMonitor.nome,
          status: profileData[0].status as 'ativo' | 'inativo' | 'pendente',
          created_at: new Date().toISOString(),
        }]);
      }

      // Reset form and close dialog
      setNewMonitor({
        email: '',
        nome: '',
        password: '',
        confirmPassword: '',
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error creating monitor:', error);
      toast({
        title: "Erro ao criar monitor",
        description: "Ocorreu um erro ao criar o monitor. Verifique se o e-mail já está em uso.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const toggleMonitorStatus = async (monitorId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'ativo' ? 'inativo' : 'ativo';
      
      const { error } = await supabase
        .from('perfis')
        .update({ status: newStatus })
        .eq('id', monitorId);

      if (error) throw error;

      // Update local state
      setMonitors(prev =>
        prev.map(monitor =>
          monitor.id === monitorId
            ? { ...monitor, status: newStatus as 'ativo' | 'inativo' | 'pendente' }
            : monitor
        )
      );

      toast({
        title: "Status atualizado",
        description: `Monitor ${newStatus === 'ativo' ? 'ativado' : 'desativado'} com sucesso.`,
      });
    } catch (error) {
      console.error('Error toggling monitor status:', error);
      toast({
        title: "Erro ao atualizar status",
        description: "Não foi possível atualizar o status do monitor.",
        variant: "destructive",
      });
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Link de redefinição enviado",
        description: `Um link para redefinição de senha foi enviado para ${email}.`,
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: "Erro ao enviar link",
        description: "Não foi possível enviar o link de redefinição de senha.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <PageTitle title="Gerenciamento de Monitores" subtitle="Cadastre e gerencie o acesso dos monitores à plataforma" />
        
        <Button onClick={() => setIsDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Adicionar Monitor
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <h3 className="text-lg font-medium">Monitores cadastrados</h3>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-4">Carregando monitores...</p>
          ) : monitors.length === 0 ? (
            <p className="text-center py-4">Nenhum monitor cadastrado ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data de cadastro</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monitors.map((monitor) => (
                    <TableRow key={monitor.id}>
                      <TableCell>{monitor.nome}</TableCell>
                      <TableCell>{monitor.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className={`mr-2 h-2 w-2 rounded-full ${
                            monitor.status === 'ativo' ? 'bg-green-500' : 'bg-red-500'
                          }`}></span>
                          {monitor.status === 'ativo' ? 'Ativo' : 'Inativo'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(monitor.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={monitor.status === 'ativo'}
                              onCheckedChange={() =>
                                toggleMonitorStatus(monitor.id, monitor.status)
                              }
                            />
                            <span className="text-sm text-muted-foreground">
                              {monitor.status === 'ativo' ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => resetPassword(monitor.email)}
                            disabled={monitor.email === 'Não vinculado' || monitor.email === 'Erro ao carregar'}
                          >
                            Redefinir senha
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog for adding a new monitor */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adicionar novo monitor</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input
                id="nome"
                name="nome"
                value={newMonitor.nome}
                onChange={handleInputChange}
                placeholder="Nome do monitor"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={newMonitor.email}
                onChange={handleInputChange}
                placeholder="email@exemplo.com"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={newMonitor.password}
                onChange={handleInputChange}
                placeholder="Senha (mínimo 6 caracteres)"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={newMonitor.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirme a senha"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              disabled={isCreating}
            >
              Cancelar
            </Button>
            <Button 
              onClick={createMonitor}
              disabled={isCreating}
            >
              {isCreating ? 'Criando...' : 'Adicionar monitor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MonitorManagement;
