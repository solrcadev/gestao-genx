
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import {
  Bell,
  BellRing,
  BellOff,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useNotifications } from '@/hooks/use-notifications';
import { showLocalNotification } from '@/services/notificationService';
import { Badge } from '@/components/ui/badge';

const NotificationSettings = () => {
  const { isSupported, isPermissionGranted, isLoading, setupNotifications } = useNotifications();
  const [notifyNewGoals, setNotifyNewGoals] = useState(true);
  const [notifyNewAthletes, setNotifyNewAthletes] = useState(true);
  const [notifyDailyTraining, setNotifyDailyTraining] = useState(true);
  const [notifyProgress, setNotifyProgress] = useState(true);
  const [testNotificationSent, setTestNotificationSent] = useState(false);

  // Monitor notification status
  useEffect(() => {
    if (testNotificationSent) {
      const timer = setTimeout(() => {
        setTestNotificationSent(false);
      }, 5000); // Reset after 5 seconds
      
      return () => clearTimeout(timer);
    }
  }, [testNotificationSent]);

  const handleActivateNotifications = async () => {
    const result = await setupNotifications();
    if (result) {
      toast({
        title: "Notificações ativadas",
        description: "Você receberá notificações importantes do aplicativo.",
      });
    }
  };

  const handleTestNotification = () => {
    if (!isPermissionGranted) {
      toast({
        title: "Notificações desativadas",
        description: "Por favor, ative as notificações antes de testar.",
        variant: "destructive",
      });
      return;
    }

    showLocalNotification('🔔 Teste de Notificação', 'Esta é uma mensagem de teste!');
    
    setTestNotificationSent(true);
    toast({
      title: "Notificação enviada",
      description: "Uma notificação de teste foi enviada para o seu dispositivo.",
    });
  };

  // Get user-friendly permission status
  const getPermissionStatus = () => {
    if (!isSupported) return "não suportadas";
    if (isPermissionGranted) return "ativadas";
    if (Notification.permission === "denied") return "bloqueadas";
    return "não configuradas";
  };

  // Get permission status description 
  const getPermissionDescription = () => {
    if (!isSupported) {
      return "Seu navegador não suporta notificações push. Use um navegador mais recente como Chrome ou Edge.";
    }

    switch (Notification.permission) {
      case "granted":
        return "Você receberá notificações importantes sobre o app.";
      case "denied":
        return "Você bloqueou as notificações neste site. Você precisará alterar as permissões nas configurações do seu navegador.";
      default:
        return "Ative as notificações para receber alertas sobre novas metas, atletas e treinos.";
    }
  };

  return (
    <div className="container px-4 py-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Configurações de Notificações</h1>
      </div>
      
      <Card className="p-5 space-y-6">
        {/* Status atual das notificações */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Status das notificações</h2>
            <p className="text-sm text-muted-foreground">
              {getPermissionDescription()}
            </p>
          </div>
          <div className="flex items-center">
            {isPermissionGranted ? (
              <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:border-green-900 dark:text-green-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Ativadas</span>
              </Badge>
            ) : (
              <Badge variant="outline" className="flex items-center gap-1 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:border-amber-900 dark:text-amber-300">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{getPermissionStatus()}</span>
              </Badge>
            )}
          </div>
        </div>
        
        {/* Ações de notificação */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={handleActivateNotifications} 
            disabled={isLoading || isPermissionGranted || !isSupported}
            className="flex-1 gap-2"
          >
            <Bell className="h-4 w-4" />
            {isLoading ? "Ativando..." : isPermissionGranted ? "Notificações Ativadas" : "Ativar Notificações"}
          </Button>
          
          <Button 
            onClick={handleTestNotification} 
            disabled={!isPermissionGranted || testNotificationSent}
            variant="secondary" 
            className="flex-1 gap-2"
          >
            <BellRing className="h-4 w-4" />
            {testNotificationSent ? "Notificação Enviada" : "Enviar Notificação Teste"}
          </Button>
        </div>
        
        {/* Preferências de notificações */}
        {isPermissionGranted && (
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-md font-medium">Preferências de notificações</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Novas metas</label>
                  <p className="text-xs text-muted-foreground">
                    Receber notificações quando novas metas forem criadas
                  </p>
                </div>
                <Switch
                  checked={notifyNewGoals}
                  onCheckedChange={setNotifyNewGoals}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Novos atletas</label>
                  <p className="text-xs text-muted-foreground">
                    Receber notificações quando novos atletas forem cadastrados
                  </p>
                </div>
                <Switch
                  checked={notifyNewAthletes}
                  onCheckedChange={setNotifyNewAthletes}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Treinos do dia</label>
                  <p className="text-xs text-muted-foreground">
                    Receber notificações quando novos treinos forem definidos
                  </p>
                </div>
                <Switch
                  checked={notifyDailyTraining}
                  onCheckedChange={setNotifyDailyTraining}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Marcos de progresso</label>
                  <p className="text-xs text-muted-foreground">
                    Receber notificações quando metas atingirem progresso significativo
                  </p>
                </div>
                <Switch
                  checked={notifyProgress}
                  onCheckedChange={setNotifyProgress}
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Informações técnicas para debug */}
        <div className="border-t pt-4">
          <details className="text-sm text-muted-foreground">
            <summary className="cursor-pointer">Informações técnicas</summary>
            <div className="mt-2 space-y-1 pl-4">
              <p>Status da permissão: {Notification.permission}</p>
              <p>Navegador suporta notificações: {isSupported ? "Sim" : "Não"}</p>
              <p>Service Worker registrado: {('serviceWorker' in navigator) ? "Disponível" : "Não disponível"}</p>
              {isPermissionGranted && (
                <p>Push subscription ativa: Sim</p>
              )}
            </div>
          </details>
        </div>
      </Card>
    </div>
  );
};

export default NotificationSettings;
