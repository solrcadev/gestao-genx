import React from 'react';
import { gerarUrlYoutubeEmbed } from '@/utils/video-utils';

interface YouTubeEmbedProps {
  videoUrl: string;
  inicio?: string;
  fim?: string;
  title?: string;
  className?: string;
}

/**
 * Componente para incorporar vídeos do YouTube com suporte a recortes de tempo
 */
const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({
  videoUrl,
  inicio,
  fim,
  title = 'Vídeo do exercício',
  className = '',
}) => {
  const embedUrl = gerarUrlYoutubeEmbed(videoUrl, inicio, fim);
  
  if (!embedUrl) return null;
  
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
};

export default YouTubeEmbed; 