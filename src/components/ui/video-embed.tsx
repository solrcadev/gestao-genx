import React, { useState, useEffect } from 'react';
import { gerarUrlYoutubeEmbed, gerarUrlInstagramEmbed, getVideoPlatform, extrairInstagramId } from '@/utils/video-utils';
import { ExternalLink } from 'lucide-react';
import { Button } from './button';

interface VideoEmbedProps {
  videoUrl: string;
  inicio?: string;
  fim?: string;
  title?: string;
  className?: string;
}

/**
 * Componente para incorporar vídeos com suporte para YouTube e Instagram
 */
const VideoEmbed: React.FC<VideoEmbedProps> = ({
  videoUrl,
  inicio,
  fim,
  title = 'Vídeo',
  className = '',
}) => {
  const [embedError, setEmbedError] = useState(false);
  const platform = getVideoPlatform(videoUrl);
  
  useEffect(() => {
    // Resetar estado de erro quando a URL muda
    setEmbedError(false);
  }, [videoUrl]);
  
  if (!videoUrl) return null;
  
  // Renderização baseada na plataforma
  switch (platform) {
    case 'youtube': {
      const embedUrl = gerarUrlYoutubeEmbed(videoUrl, inicio, fim);
      if (!embedUrl) return <FallbackMessage />;
      
      return (
        <div className={`video-container ${className}`}>
          <iframe
            src={embedUrl}
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      );
    }
    
    case 'instagram': {
      if (embedError) {
        return <InstagramFallback videoUrl={videoUrl} title={title} className={className} />;
      }
      
      const embedUrl = gerarUrlInstagramEmbed(videoUrl);
      if (!embedUrl) return <FallbackMessage />;
      
      return (
        <div className={`instagram-embed-container ${className}`}>
          <iframe
            src={embedUrl}
            title={title}
            frameBorder="0"
            scrolling="no"
            allowTransparency={true}
            allowFullScreen
            className="w-full h-[600px] rounded border"
            onError={() => setEmbedError(true)}
            loading="lazy"
          ></iframe>
        </div>
      );
    }
    
    default:
      return <FallbackMessage />;
  }
};

// Componente de fallback para Instagram
const InstagramFallback: React.FC<{ videoUrl: string; title: string; className?: string }> = ({ 
  videoUrl, 
  title,
  className 
}) => {
  const postId = extrairInstagramId(videoUrl);
  
  return (
    <div className={`instagram-fallback rounded border p-4 bg-gray-50 dark:bg-gray-800 ${className || ''}`}>
      <div className="flex flex-col items-center justify-center h-full text-center p-4 gap-4">
        <div className="w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-900 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-pink-500"
          >
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
          </svg>
        </div>
        
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
            Este conteúdo do Instagram não pode ser incorporado diretamente.
          </p>
          <h4 className="font-medium text-base mb-4">{title}</h4>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-900 hover:bg-pink-50 dark:hover:bg-pink-900/30"
          onClick={() => window.open(videoUrl, '_blank', 'noopener,noreferrer')}
        >
          <ExternalLink className="h-4 w-4" />
          <span>Ver no Instagram</span>
        </Button>
      </div>
    </div>
  );
};

// Mensagem genérica de fallback para formatos não suportados
const FallbackMessage: React.FC = () => (
  <div className="rounded border p-4 bg-gray-50 dark:bg-gray-800 flex items-center justify-center h-[200px]">
    <p className="text-gray-500 dark:text-gray-400 text-center">
      Formato de vídeo não suportado ou URL inválida.
    </p>
  </div>
);

export default VideoEmbed; 