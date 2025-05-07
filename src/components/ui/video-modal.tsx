
import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import VideoEmbed from './video-embed';
import { getVideoPlatform } from '@/utils/video-utils';
import LoadingSpinner from '../LoadingSpinner';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  videoTitle?: string;
  inicio?: string;
  fim?: string;
}

const VideoModal: React.FC<VideoModalProps> = ({
  isOpen,
  onClose,
  videoUrl,
  videoTitle = 'Vídeo',
  inicio,
  fim
}) => {
  const [isLoading, setIsLoading] = useState(true);
  
  // Bloquear o scroll do corpo quando a modal estiver aberta
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Resetar estado de loading quando a modal abre
      setIsLoading(true);
    } else {
      document.body.style.overflow = '';
    }
    
    // Adicionar event listener para fechar com Esc
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  // Determinar a classe do container com base na plataforma
  const platform = getVideoPlatform(videoUrl);
  const isInstagram = platform === 'instagram';
  
  // Função para quando o conteúdo carrega
  const handleContentLoaded = () => {
    // Esconder o loading após o conteúdo carregar
    setTimeout(() => setIsLoading(false), 500);
  };
  
  // Efeito para simular carregamento
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 3000); // Fallback para garantir que o loading não fique infinito
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-labelledby="video-modal-title"
    >
      {/* Modal content */}
      <div 
        className={`bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full ${isInstagram ? 'max-w-xl' : 'max-w-4xl'} flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 flex justify-between items-center border-b">
          <h3 id="video-modal-title" className="text-lg font-semibold truncate pr-6">
            {videoTitle}
          </h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Video container */}
        <div className={isInstagram ? 'instagram-embed-container' : 'video-container'}>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-10">
              <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Carregando vídeo...</p>
              </div>
            </div>
          )}
          
          <div className={isLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}>
            <VideoEmbed 
              videoUrl={videoUrl}
              inicio={inicio}
              fim={fim}
              title={videoTitle}
              onLoad={handleContentLoaded}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoModal;
