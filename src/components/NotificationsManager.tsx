import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, BellRing } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  isPushNotificationSupported, 
  requestNotificationPermission, 
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications
} from '@/services/notificationService';
import { useToast } from '@/hooks/use-toast';

interface NotificationsManagerProps {
  atletaId?: string;
  userRole?: string;
  variant?: 'minimal' | 'card' | 'button';
  onStatusChange?: (status: NotificationStatus) => void;
}

export type NotificationStatus = 'unsupported' | 'denied' | 'granted' | 'default' | 'loading';

export function NotificationsManager({ 
  atletaId, 
  userRole = 'atleta', 
  variant = 'card',
  onStatusChange
}: NotificationsManagerProps) {
  const [status, setStatus] = useState<NotificationStatus>('loading');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const { toast } = useToast();

  // Verificar status inicial das notificações
  useEffect(() => {
    const checkNotificationStatus = async () => {
      console.log('Verificando status das notificações...');
      
      // Verificar se o navegador suporta notificações push
      if (!isPushNotificationSupported()) {
        console.log('Notificações push não são suportadas');
        setStatus('unsupported');
        onStatusChange?.('unsupported');
        return;
      }

      // Verificar permissão atual
      const permission = Notification.permission;
      console.log('Status atual da permissão:', permission);
      setStatus(permission as NotificationStatus);
      onStatusChange?.(permission as NotificationStatus);
    };

    checkNotificationStatus();
  }, [onStatusChange]);

  // Solicitar permissão e se inscrever para notificações
  const handleEnableNotifications = async () => {
    try {
      console.log('Solicitando ativação de notificações...');
      setIsSubscribing(true);
      
      // Solicitar permissão
      const permission = await requestNotificationPermission();
      console.log('Permissão concedida?', permission);
      
      if (permission) {
        // Inscrever para notificações
        const subscribed = await subscribeToPushNotifications(atletaId, userRole);
        console.log('Inscrito para notificações?', subscribed);
        
        if (subscribed) {
          setStatus('granted');
          onStatusChange?.('granted');
          toast({
            title: "Notificações ativadas",
            description: "Você receberá atualizações importantes do GEN X.",
            variant: "default"
          });
        }
      } else {
        setStatus(Notification.permission as NotificationStatus);
        onStatusChange?.(Notification.permission as NotificationStatus);
      }
    } catch (error) {
      console.error('Erro ao ativar notificações:', error);
      toast({
        title: "Erro ao ativar notificações",
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado",
        variant: "destructive"
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  // Cancelar inscrição de notificações
  const handleDisableNotifications = async () => {
    try {
      console.log('Desativando notificações...');
      setIsSubscribing(true);
      
      const unsubscribed = await unsubscribeFromPushNotifications();
      console.log('Cancelada inscrição?', unsubscribed);
      
      if (unsubscribed) {
        // A permissão ainda está granted, mas o usuário não receberá notificações
        toast({
          title: "Notificações desativadas",
          description: "Você não receberá mais notificações do GEN X.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Erro ao desativar notificações:', error);
      toast({
        title: "Erro ao desativar notificações",
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado",
        variant: "destructive"
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  // Testar envio de notificação
  const handleTestNotification = () => {
    console.log('Enviando notificação de teste...');
    
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'TEST_NOTIFICATION',
        message: 'Esta é uma notificação de teste do GEN X'
      });
    } else {
      toast({
        title: "Não foi possível enviar notificação",
        description: "Service worker não está ativo ou controlando a página",
        variant: "destructive"
      });
    }
  };

  // Renderização condicional baseada no variant e status
  if (variant === 'minimal') {
    return (
      <div className="flex items-center space-x-2">
        {status === 'loading' ? (
          <Button variant="ghost" size="sm" disabled>
            <span className="loading loading-spinner loading-xs mr-2"></span>
            Carregando...
          </Button>
        ) : status === 'unsupported' ? (
          <Button variant="ghost" size="sm" disabled>
            <BellOff className="h-4 w-4 mr-2" />
            Não suportado
          </Button>
        ) : status === 'denied' ? (
          <Button variant="ghost" size="sm" onClick={() => window.open('about:settings')}>
            <BellOff className="h-4 w-4 mr-2" />
            Bloqueado
          </Button>
        ) : status === 'granted' ? (
          <Button variant="ghost" size="sm" onClick={handleDisableNotifications} disabled={isSubscribing}>
            <BellRing className="h-4 w-4 mr-2" />
            Ativado
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={handleEnableNotifications} disabled={isSubscribing}>
            <Bell className="h-4 w-4 mr-2" />
            Ativar
          </Button>
        )}
      </div>
    );
  }

  if (variant === 'button') {
    return (
      <div>
        {status === 'loading' ? (
          <Button disabled>
            <span className="loading loading-spinner loading-xs mr-2"></span>
            Carregando...
          </Button>
        ) : status === 'unsupported' ? (
          <Button variant="outline" disabled>
            <BellOff className="h-4 w-4 mr-2" />
            Notificações não suportadas
          </Button>
        ) : status === 'denied' ? (
          <Button variant="outline" onClick={() => window.open('about:settings')}>
            <BellOff className="h-4 w-4 mr-2" />
            Desbloquear notificações
          </Button>
        ) : status === 'granted' ? (
          <Button variant="outline" onClick={handleDisableNotifications} disabled={isSubscribing}>
            <BellRing className="h-4 w-4 mr-2" />
            Desativar notificações
          </Button>
        ) : (
          <Button onClick={handleEnableNotifications} disabled={isSubscribing}>
            <Bell className="h-4 w-4 mr-2" />
            Ativar notificações
          </Button>
        )}
      </div>
    );
  }

  // Variant: card (padrão)
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Notificações</CardTitle>
        <CardDescription>
          Ative as notificações para receber atualizações de treinos, metas e evolução
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {status === 'loading' ? (
          <div className="flex justify-center items-center h-20">
            <span className="loading loading-spinner loading-md"></span>
          </div>
        ) : status === 'unsupported' ? (
          <div className="bg-muted rounded-md p-4 text-center">
            <BellOff className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
            <p>Seu navegador não suporta notificações push.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Tente usar um navegador mais recente como Chrome, Firefox ou Edge.
            </p>
          </div>
        ) : status === 'denied' ? (
          <div className="bg-destructive/10 rounded-md p-4 text-center">
            <BellOff className="h-10 w-10 mx-auto mb-2 text-destructive" />
            <p>Notificações estão bloqueadas nas configurações do navegador.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Para ativar, acesse as configurações do site no seu navegador.
            </p>
          </div>
        ) : status === 'granted' ? (
          <div className="bg-success/10 rounded-md p-4 text-center">
            <BellRing className="h-10 w-10 mx-auto mb-2 text-success" />
            <p>Notificações estão ativadas!</p>
            <p className="text-sm text-muted-foreground mt-2">
              Você receberá atualizações sobre treinos, metas e eventos importantes.
            </p>
          </div>
        ) : (
          <div className="bg-primary/10 rounded-md p-4 text-center">
            <Bell className="h-10 w-10 mx-auto mb-2 text-primary" />
            <p>Ative as notificações para manter-se atualizado.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Você será notificado sobre novos treinos, metas e atualizações importantes.
            </p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col sm:flex-row gap-2 justify-end">
        {status === 'granted' && (
          <Button variant="outline" size="sm" onClick={handleTestNotification}>
            Testar notificação
          </Button>
        )}
        
        {status === 'denied' ? (
          <Button onClick={() => window.open('about:settings')}>
            Desbloquear nas configurações
          </Button>
        ) : status === 'granted' ? (
          <Button variant="outline" onClick={handleDisableNotifications} disabled={isSubscribing}>
            {isSubscribing ? (
              <>
                <span className="loading loading-spinner loading-xs mr-2"></span>
                Desativando...
              </>
            ) : (
              'Desativar notificações'
            )}
          </Button>
        ) : status !== 'unsupported' && (
          <Button onClick={handleEnableNotifications} disabled={isSubscribing}>
            {isSubscribing ? (
              <>
                <span className="loading loading-spinner loading-xs mr-2"></span>
                Ativando...
              </>
            ) : (
              'Ativar notificações'
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 