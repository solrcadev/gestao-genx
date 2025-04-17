import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Settings, 
  User, 
  LogOut, 
  FileText, 
  Calendar,
  Package, 
  History,
  Target,
  BarChart3,
  CheckSquare,
  Bell
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/use-notifications";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const More = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const { isSupported, isPermissionGranted, isLoading, setupNotifications } = useNotifications();
  const { toast } = useToast();
  const [isPwaInstallable, setIsPwaInstallable] = useState(false);

  // Verificar se o PWA pode ser instalado
  useEffect(() => {
    const checkPwaInstallable = () => {
      const deferredPrompt = (window as any).deferredPrompt;
      setIsPwaInstallable(!!deferredPrompt);
    };

    checkPwaInstallable();

    // Adicionar listener para o evento 'appinstalled'
    const handleAppInstalled = () => {
      setIsPwaInstallable(false);
      toast({
        title: "Aplicativo instalado",
        description: "O app foi instalado com sucesso no seu dispositivo.",
        variant: "default",
      });
    };

    // Adicionar listener para o evento 'pwaInstallable'
    const handlePwaInstallable = () => {
      setIsPwaInstallable(true);
    };

    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('pwaInstallable', handlePwaInstallable);

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('pwaInstallable', handlePwaInstallable);
    };
  }, [toast]);

  const menuItems = [
    {
      icon: <Target className="h-5 w-5" />,
      title: "Metas & Evolução",
      description: "Acompanhe o progresso de metas individuais",
      path: "/metas-evolucao"
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: "Desempenho Detalhado",
      description: "Estatísticas e análises avançadas",
      path: "/desempenho-detalhado"
    },
    {
      icon: <CheckSquare className="h-5 w-5" />,
      title: "Gestão de Presença",
      description: "Controle de presença em treinos",
      path: "/presencas"
    },
    {
      icon: <History className="h-5 w-5" />,
      title: "Histórico",
      description: "Histórico de atividades e alterações",
      path: "/historico"
    },
    {
      icon: <Calendar className="h-5 w-5" />,
      title: "Calendário",
      description: "Agenda de treinos e eventos",
      path: "/calendario"
    },
    {
      icon: <Bell className="h-5 w-5" />,
      title: "Notificações",
      description: "Configurar preferências de notificações",
      path: "/notification-settings" // Changed from action to path
    },
    {
      icon: <Settings className="h-5 w-5" />,
      title: "Configurações",
      description: "Ajustes e preferências do sistema",
      path: "/configuracoes"
    },
    {
      icon: <LogOut className="h-5 w-5" />,
      title: "Sair",
      description: "Encerrar sessão",
      action: () => signOut()
    }
  ];

  const handleItemClick = (item: any) => {
    if (item.action) {
      item.action();
    } else if (item.path) {
      navigate(item.path);
    }
  };

  const handleEnableNotifications = async () => {
    const result = await setupNotifications();
    if (result) {
      setNotificationDialogOpen(false);
      toast({
        title: "Notificações ativadas",
        description: "Você receberá notificações sobre novas metas, atletas e treinos.",
        variant: "default",
      });
      
      // Para fins de demonstração, vamos mostrar uma notificação de teste
      if ('Notification' in window && Notification.permission === 'granted') {
        const notificacaoTeste = new Notification('🏐 Notificações Ativas!', {
          body: 'Você receberá atualizações sobre novas metas, atletas cadastrados e treinos do dia.',
          icon: '/icons/icon-192x192.png'
        });
      }
    }
  };

  const handleInstallPWA = () => {
    const deferredPrompt = (window as any).deferredPrompt;
    if (!deferredPrompt) {
      toast({
        title: "Instalação indisponível",
        description: "O app já está instalado ou o navegador não suporta esta funcionalidade.",
        variant: "destructive",
      });
      return;
    }
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        toast({
          title: "Instalação iniciada",
          description: "O app está sendo instalado em seu dispositivo.",
          variant: "default",
        });
      }
      // Reset the deferred prompt variable
      (window as any).deferredPrompt = null;
      setIsPwaInstallable(false);
    });
  };

  return (
    <div className="container px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold">Mais Opções</h1>
        </div>
        
        {isPwaInstallable && (
          <Button 
            variant="outline" 
            className="flex items-center gap-2" 
            onClick={handleInstallPWA}
          >
            <Package size={16} />
            <span>Instalar App</span>
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {menuItems.map((item, index) => (
          <Card 
            key={index}
            className="p-4 cursor-pointer hover:bg-accent transition-colors"
            onClick={() => handleItemClick(item)}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg mr-4">
                {React.cloneElement(item.icon as React.ReactElement, {
                  className: "h-6 w-6 text-primary"
                })}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{item.title}</h3>
                  {item.title === "Notificações" && (
                    <Badge variant={isPermissionGranted ? "secondary" : "outline"} className="ml-1">
                      {isPermissionGranted ? "Ativadas" : "Desativadas"}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Remove the notification dialog since we now have a dedicated page */}
    </div>
  );
};

export default More;
