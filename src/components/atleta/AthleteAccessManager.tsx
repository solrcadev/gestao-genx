
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Athlete } from '@/types';
import { supabase } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { User, Mail, Lock, Unlock } from 'lucide-react';

interface AthleteAccessManagerProps {
  athlete: Athlete;
  onUpdate: (athlete: Athlete) => void;
}

export function AthleteAccessManager({ athlete, onUpdate }: AthleteAccessManagerProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(athlete.email || '');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCreateAccess = async () => {
    if (!email) {
      toast({
        title: "Email necessário",
        description: "Por favor, forneça um email para criar o acesso.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const password = Math.random().toString(36).slice(-8); // Senha temporária
      
      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome: athlete.nome,
          }
        }
      });

      if (authError) throw authError;

      // 2. Criar perfil vinculando ao atleta
      const { error: profileError } = await supabase
        .from('perfis')
        .insert({
          user_id: authData.user?.id,
          funcao: 'atleta',
          atleta_id: athlete.id
        });

      if (profileError) throw profileError;

      // 3. Atualizar status do atleta
      const { data: updatedAthlete, error: updateError } = await supabase
        .from('athletes')
        .update({ 
          email, 
          access_status: 'convite_enviado' 
        })
        .eq('id', athlete.id)
        .select()
        .single();

      if (updateError) throw updateError;

      toast({
        title: "Acesso criado com sucesso",
        description: "Um email foi enviado para o atleta com as instruções de acesso.",
      });

      onUpdate(updatedAthlete);
      setOpen(false);
    } catch (error: any) {
      toast({
        title: "Erro ao criar acesso",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAccess = async () => {
    if (!athlete.email) return;

    setLoading(true);
    try {
      // 1. Buscar o perfil do atleta
      const { data: profile } = await supabase
        .from('perfis')
        .select('user_id')
        .eq('atleta_id', athlete.id)
        .single();

      if (profile?.user_id) {
        // 2. Deletar o usuário no Supabase Auth (isso vai cascatear para o perfil)
        const { error: deleteError } = await supabase.auth.admin.deleteUser(
          profile.user_id
        );

        if (deleteError) throw deleteError;
      }

      // 3. Atualizar status do atleta
      const { data: updatedAthlete, error: updateError } = await supabase
        .from('athletes')
        .update({ 
          access_status: 'bloqueado' 
        })
        .eq('id', athlete.id)
        .select()
        .single();

      if (updateError) throw updateError;

      toast({
        title: "Acesso revogado",
        description: "O acesso do atleta foi removido com sucesso.",
      });

      onUpdate(updatedAthlete);
    } catch (error: any) {
      toast({
        title: "Erro ao revogar acesso",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={athlete.access_status === 'ativo' ? "outline" : "default"}
          className="w-full mt-4"
        >
          {athlete.access_status === 'sem_acesso' && (
            <>
              <User className="mr-2 h-4 w-4" />
              Criar Acesso
            </>
          )}
          {athlete.access_status === 'convite_enviado' && (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Convite Enviado
            </>
          )}
          {athlete.access_status === 'ativo' && (
            <>
              <Lock className="mr-2 h-4 w-4" />
              Gerenciar Acesso
            </>
          )}
          {athlete.access_status === 'bloqueado' && (
            <>
              <Unlock className="mr-2 h-4 w-4" />
              Reativar Acesso
            </>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerenciar Acesso do Atleta</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {(athlete.access_status === 'sem_acesso' || athlete.access_status === 'bloqueado') && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email do Atleta</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>
              <Button 
                onClick={handleCreateAccess} 
                disabled={loading}
                className="w-full"
              >
                {loading ? "Criando..." : "Criar Acesso"}
              </Button>
            </>
          )}

          {(athlete.access_status === 'ativo' || athlete.access_status === 'convite_enviado') && (
            <Button 
              variant="destructive"
              onClick={handleRevokeAccess}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Revogando..." : "Revogar Acesso"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
