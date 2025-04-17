
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import LoadingSpinner from '@/components/LoadingSpinner';

const Profile = () => {
  const { user, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
    }
    
    if (profile) {
      setRole(profile.role);
    }
  }, [user, profile]);

  const handleLogout = async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-20">
      <h1 className="text-2xl font-bold mb-6">Seu Perfil</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Informações da Conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input value={email} disabled />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Função</label>
            <Input value={role} disabled />
          </div>
          
          <Button 
            variant="destructive"
            onClick={handleLogout}
            disabled={loading}
          >
            {loading ? "Saindo..." : "Sair"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
