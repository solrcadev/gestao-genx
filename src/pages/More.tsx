
import React, { useState } from "react";
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
      action: () => setNotificationDialogOpen(true)
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
        });
      }
      // Reset the deferred prompt variable
      (window as any).deferredPrompt = null;
    });
  };

  return (
    <div className="container px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold">Mais Opções</h1>
        </div>
        
        <Button 
          variant="outline" 
          className="flex items-center gap-2" 
          onClick={handleInstallPWA}
        >
          <Package size={16} />
          <span>Instalar App</span>
        </Button>
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
                    <Badge variant={isPermissionGranted ? "success" : "outline"} className="ml-1">
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

      {/* Notification preferences dialog */}
      <Dialog open={notificationDialogOpen} onOpenChange={setNotificationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Preferências de Notificações</DialogTitle>
            <DialogDescription>
              Configure as notificações para receber atualizações sobre metas, treinos e mais.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {!isSupported && (
              <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 p-4 border border-amber-200 dark:border-amber-900">
                <p className="text-amber-800 dark:text-amber-300 text-sm">
                  Seu navegador não suporta notificações push. Use um navegador moderno como Chrome ou Firefox.
                </p>
              </div>
            )}
            
            {isSupported && (
              <>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium">Status das Notificações</h4>
                    <p className="text-sm text-muted-foreground">
                      {isPermissionGranted 
                        ? "Notificações estão ativadas" 
                        : "Notificações estão desativadas"}
                    </p>
                  </div>
                  <Badge variant={isPermissionGranted ? "success" : "destructive"}>
                    {isPermissionGranted ? "Ativado" : "Desativado"}
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  <h4 className="font-medium">Receber notificações sobre:</h4>
                  <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                    <li>Novas metas e atualizações</li>
                    <li>Lembretes de treinos</li>
                    <li>Alterações no calendário</li>
                    <li>Marcos de progresso atingidos</li>
                  </ul>
                </div>
                
                <Button
                  onClick={handleEnableNotifications}
                  disabled={isLoading || isPermissionGranted}
                  className="w-full"
                >
                  {isLoading ? "Configurando..." : 
                   isPermissionGranted ? "Notificações Ativadas" : "Ativar Notificações"}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default More;
