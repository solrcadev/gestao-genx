import React from 'react';
import { usePWA } from '@/contexts/PWAContext';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Download, 
  X, 
  Smartphone, 
  Share, 
  PlusSquare, 
  CheckSquare,
  Info
} from 'lucide-react';

interface InstallPWAPromptProps {
  variant?: 'banner' | 'card' | 'alert';
  className?: string;
}

const InstallPWAPrompt: React.FC<InstallPWAPromptProps> = ({ 
  variant = 'card',
  className = ''
}) => {
  const { 
    isIOS, 
    deferredPrompt, 
    promptInstall, 
    dismissInstallPrompt,
    isPWAInstalled,
    showIOSInstallInstructions,
    setShowIOSInstallInstructions
  } = usePWA();

  // Don't show anything if already installed or not installable
  if (isPWAInstalled || (!isIOS && !deferredPrompt)) {
    return null;
  }

  // For iOS Safari
  if (isIOS && showIOSInstallInstructions) {
    if (variant === 'banner') {
      return (
        <div className={`bg-primary/10 p-4 relative ${className}`}>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-2 right-2" 
            onClick={() => setShowIOSInstallInstructions(false)}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="flex flex-col items-center text-center">
            <Smartphone className="h-8 w-8 text-primary mb-2" />
            <h3 className="text-lg font-semibold">Instale o Painel GenX</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Para uma experiência melhor, adicione o app à sua tela de início
            </p>
            <div className="flex flex-col text-left text-sm space-y-2 mb-4">
              <p><span className="font-semibold">1.</span> Toque no ícone <Share className="h-4 w-4 inline" /> na barra de ferramentas</p>
              <p><span className="font-semibold">2.</span> Role para baixo e selecione <span className="font-semibold">"Adicionar à Tela de Início"</span></p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={dismissInstallPrompt}
            >
              Entendido
            </Button>
          </div>
        </div>
      );
    }
    
    if (variant === 'alert') {
      return (
        <Alert className={`${className}`}>
          <Info className="h-4 w-4" />
          <AlertTitle>Instale o Painel GenX no seu dispositivo!</AlertTitle>
          <AlertDescription>
            <div className="text-sm mt-2 space-y-2">
              <p>Para uma experiência completa, adicione o app à sua tela de início:</p>
              <ol className="list-decimal pl-4 space-y-1">
                <li>Toque no ícone <Share className="h-3 w-3 inline" /> na barra do Safari</li>
                <li>Role para baixo e selecione "Adicionar à Tela de Início"</li>
              </ol>
              <div className="mt-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={dismissInstallPrompt}
                >
                  Não mostrar novamente
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    // Default card variant for iOS
    return (
      <Card className={`${className}`}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              Instale o Painel GenX
            </CardTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={dismissInstallPrompt}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Adicione o aplicativo à sua tela inicial para acesso rápido e uma experiência completa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-3 rounded-md space-y-2 text-sm">
            <p className="font-medium">Como instalar:</p>
            <div className="space-y-2">
              <p className="flex items-start gap-2">
                <span className="bg-primary/20 text-primary rounded-full h-5 w-5 flex items-center justify-center text-xs">1</span>
                <span>Toque no ícone <Share className="h-4 w-4 inline-block" /> de compartilhamento no Safari</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="bg-primary/20 text-primary rounded-full h-5 w-5 flex items-center justify-center text-xs">2</span>
                <span>Role para baixo e selecione <span className="font-medium">"Adicionar à Tela de Início"</span></span>
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            variant="outline" 
            onClick={dismissInstallPrompt} 
            className="w-full"
          >
            Não mostrar novamente
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // For other browsers (Chrome, Edge, etc.)
  if (deferredPrompt) {
    if (variant === 'banner') {
      return (
        <div className={`bg-primary/10 p-4 flex items-center justify-between ${className}`}>
          <div className="flex items-center gap-3">
            <Download className="h-6 w-6 text-primary" />
            <div>
              <h3 className="font-medium">Instale o Painel GenX</h3>
              <p className="text-sm text-muted-foreground">Para um acesso mais rápido</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={dismissInstallPrompt}
            >
              Depois
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={promptInstall}
            >
              Instalar
            </Button>
          </div>
        </div>
      );
    }
    
    if (variant === 'alert') {
      return (
        <Alert className={`${className}`}>
          <Download className="h-4 w-4" />
          <AlertTitle>Instale o Painel GenX</AlertTitle>
          <AlertDescription>
            <div className="mt-2 flex justify-between items-center">
              <p className="text-sm">Instale o app para acesso mais rápido e melhor experiência.</p>
              <div className="flex gap-2 mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={dismissInstallPrompt}
                >
                  Depois
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={promptInstall}
                >
                  Instalar
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    // Default card variant
    return (
      <Card className={`${className}`}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Instale o Painel GenX
            </CardTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={dismissInstallPrompt}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Adicione o aplicativo ao seu dispositivo para acesso rápido, mesmo offline.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-green-500" />
              <span className="text-sm">Acesso mais rápido</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-green-500" />
              <span className="text-sm">Funciona offline</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-green-500" />
              <span className="text-sm">Interface otimizada</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between gap-3">
          <Button 
            variant="outline" 
            onClick={dismissInstallPrompt} 
            className="flex-1"
          >
            Depois
          </Button>
          <Button 
            variant="default" 
            onClick={promptInstall} 
            className="flex-1"
          >
            <Download className="mr-2 h-4 w-4" />
            Instalar
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Fallback - shouldn't normally reach here
  return null;
};

export default InstallPWAPrompt; 