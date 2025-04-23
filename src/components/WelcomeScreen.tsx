import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface WelcomeScreenProps {
  onClose: () => void;
}

export function WelcomeScreen({ onClose }: WelcomeScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    {
      title: 'Bem-vindo ao GEN X',
      description: 'Obrigado por instalar nosso aplicativo! Agora você pode acessar todas as funcionalidades mesmo offline.',
      image: '/icons/icon-512x512.png'
    },
    {
      title: 'Gerencie suas atividades',
      description: 'Tenha acesso rápido a treinos, avaliações e estatísticas de desempenho dos atletas.',
      image: '/icons/features.png'
    },
    {
      title: 'Trabalhe offline',
      description: 'Registre presenças, avaliações e notas mesmo sem internet. Os dados serão sincronizados automaticamente quando sua conexão for restaurada.',
      image: '/icons/offline.png'
    }
  ];
  
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
    }
  };
  
  const currentStepData = steps[currentStep];
  
  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">{currentStepData.title}</DialogTitle>
          <button 
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Fechar</span>
          </button>
        </DialogHeader>
        
        <div className="flex flex-col items-center py-4">
          <img
            src={currentStepData.image}
            alt={currentStepData.title}
            className="w-32 h-32 mb-6 object-contain"
          />
          <DialogDescription className="text-center">
            {currentStepData.description}
          </DialogDescription>
        </div>
        
        <div className="flex justify-center gap-1 my-2">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full ${
                index === currentStep ? 'w-6 bg-primary' : 'w-1.5 bg-muted'
              }`}
            />
          ))}
        </div>
        
        <DialogFooter className="flex sm:justify-between">
          <Button
            variant="ghost"
            onClick={onClose}
            className="flex-1 sm:flex-none"
          >
            Pular
          </Button>
          <Button
            onClick={handleNext}
            className="flex-1 sm:flex-none"
          >
            {currentStep < steps.length - 1 ? 'Próximo' : 'Começar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 