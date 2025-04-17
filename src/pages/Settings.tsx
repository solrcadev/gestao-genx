
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import PageTitle from '@/components/PageTitle';

const Settings = () => {
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: 'Logout realizado',
        description: 'Você foi desconectado com sucesso',
      });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível fazer logout',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 pb-20">
      <PageTitle>Configurações</PageTitle>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Notificações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notificações de Treino</p>
                  <p className="text-sm text-muted-foreground">Receber alertas sobre novos treinos</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Avaliações</p>
                  <p className="text-sm text-muted-foreground">Receber avaliações de desempenho</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => navigate("/notification-settings")}
              >
                Configurações avançadas
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {profile?.role === 'coach' || profile?.role === 'trainer' ? (
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Treinador</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate("/training-reports")}
                >
                  Relatórios de Treinos
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}
        
        <Card>
          <CardHeader>
            <CardTitle>Conta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate("/profile")}
              >
                Editar Perfil
              </Button>
              
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={handleLogout}
              >
                Sair
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
