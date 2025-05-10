import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// BeforeInstallPromptEvent is not in the standard TypeScript types
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed', platform: string }>;
}

interface PWAContextType {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInStandaloneMode: boolean;
  isIOS: boolean;
  isInstallable: boolean;
  isPWAInstalled: boolean;
  promptInstall: () => Promise<void>;
  dismissInstallPrompt: () => void;
  showIOSInstallInstructions: boolean;
  setShowIOSInstallInstructions: (show: boolean) => void;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export const PWAProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSInstallInstructions, setShowIOSInstallInstructions] = useState(false);
  
  // Check if the app is running in standalone mode (already installed)
  const isInStandaloneMode = typeof window !== 'undefined' && 
    (window.matchMedia('(display-mode: standalone)').matches || 
    // @ts-ignore - Safari specific property
    !!window.navigator.standalone);
  
  // Check if the browser is iOS Safari
  const isIOS = typeof navigator !== 'undefined' && 
    (/iPad|iPhone|iPod/.test(navigator.userAgent) && 
    // @ts-ignore
    !window.MSStream);
  
  // Check if the PWA is installable (iOS or has install prompt)
  const isInstallable = isIOS || deferredPrompt !== null;
  
  // Check if the PWA is already installed
  const isPWAInstalled = isInStandaloneMode;

  useEffect(() => {
    // Capture the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Store the event for later use
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      console.log('beforeinstallprompt event was fired and saved');
    };

    // Add the event listener
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Also show iOS instructions automatically for iOS users (if not in standalone)
    if (isIOS && !isInStandaloneMode) {
      // Check if user has already dismissed the instructions
      const hasIOSInstructionsDismissed = localStorage.getItem('pwa-ios-install-dismissed');
      if (!hasIOSInstructionsDismissed) {
        setShowIOSInstallInstructions(true);
      }
    }

    // Clean up the event listener
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isIOS, isInStandaloneMode]);

  // Function to trigger the installation prompt
  const promptInstall = async () => {
    if (!deferredPrompt) {
      console.log('No installation prompt available');
      return;
    }

    // Show the installation prompt
    deferredPrompt.prompt();

    // Wait for the user's choice
    const choiceResult = await deferredPrompt.userChoice;
    
    // Log the outcome
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferred prompt since it can only be used once
    setDeferredPrompt(null);
  };

  // Function to dismiss the install prompt without installing
  const dismissInstallPrompt = () => {
    setDeferredPrompt(null);
    // For iOS, mark as dismissed in localStorage
    if (isIOS) {
      localStorage.setItem('pwa-ios-install-dismissed', 'true');
      setShowIOSInstallInstructions(false);
    }
  };

  // Provide the context value
  const contextValue: PWAContextType = {
    deferredPrompt,
    isInStandaloneMode,
    isIOS,
    isInstallable,
    isPWAInstalled,
    promptInstall,
    dismissInstallPrompt,
    showIOSInstallInstructions,
    setShowIOSInstallInstructions
  };

  return (
    <PWAContext.Provider value={contextValue}>
      {children}
    </PWAContext.Provider>
  );
};

// Custom hook to use the PWA context
export const usePWA = () => {
  const context = useContext(PWAContext);
  if (context === undefined) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
}; 