
/**
 * Converte um tempo no formato MM:SS ou HH:MM:SS para segundos
 * @param tempo String no formato "MM:SS" ou "HH:MM:SS"
 * @returns Número total de segundos ou null se o formato for inválido
 */
export function tempoParaSegundos(tempo: string): number | null {
  if (!tempo || tempo.trim() === '') return null;
  
  // Regex para validar formatos MM:SS ou HH:MM:SS
  const regexTempo = /^(?:(?:(\d+):)?(\d+):)?(\d+)$/;
  const match = tempo.match(regexTempo);
  
  if (!match) return null;
  
  let horas = 0;
  let minutos = 0;
  let segundos = 0;
  
  // Se tivermos 3 partes (HH:MM:SS)
  if (match[1] !== undefined) {
    horas = parseInt(match[1]);
    minutos = parseInt(match[2]);
    segundos = parseInt(match[3]);
  } 
  // Se tivermos 2 partes (MM:SS)
  else if (match[2] !== undefined) {
    minutos = parseInt(match[2]);
    segundos = parseInt(match[3]);
  }
  // Se tivermos apenas segundos
  else {
    segundos = parseInt(match[3]);
  }
  
  return (horas * 3600) + (minutos * 60) + segundos;
}

/**
 * Identifica a plataforma de vídeo baseada na URL
 * @param url URL do vídeo
 * @returns 'youtube', 'instagram' ou 'outro'
 */
export function getVideoPlatform(url: string): 'youtube' | 'instagram' | 'outro' {
  if (!url) return 'outro';
  
  // Verificar se é YouTube
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube';
  }
  
  // Verificar se é Instagram
  if (url.includes('instagram.com')) {
    return 'instagram';
  }
  
  // Caso contrário
  return 'outro';
}

/**
 * Extrai o ID do vídeo do YouTube de uma URL
 * @param url URL do vídeo do YouTube
 * @returns ID do vídeo ou null se não for uma URL válida do YouTube
 */
export function extrairYoutubeId(url: string): string | null {
  if (!url) return null;
  
  // Regex para extrair o ID do vídeo do YouTube de vários formatos de URL
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = url.match(regex);
  
  return match ? match[1] : null;
}

/**
 * Extrai o ID do post do Instagram de uma URL
 * @param url URL do post do Instagram
 * @returns ID do post ou null se não for uma URL válida do Instagram
 */
export function extrairInstagramId(url: string): string | null {
  if (!url) return null;
  
  // Regex para extrair o ID do post do Instagram
  // Formato: https://www.instagram.com/p/CODIGO/ ou https://instagram.com/reel/CODIGO/
  const regex = /(?:instagram\.com\/)(?:p|reel)\/([A-Za-z0-9_-]+)/i;
  const match = url.match(regex);
  
  return match ? match[1] : null;
}

/**
 * Gera a URL de incorporação do YouTube com parâmetros de tempo
 * @param videoUrl URL original do vídeo do YouTube
 * @param inicioStr Tempo de início no formato MM:SS
 * @param fimStr Tempo de fim no formato MM:SS
 * @returns URL formatada para incorporação ou null se não for do YouTube
 */
export function gerarUrlYoutubeEmbed(videoUrl: string, inicioStr?: string, fimStr?: string): string | null {
  const videoId = extrairYoutubeId(videoUrl);
  if (!videoId) return null;
  
  let url = `https://www.youtube.com/embed/${videoId}`;
  const params: string[] = [];
  
  const inicioSec = inicioStr ? tempoParaSegundos(inicioStr) : null;
  const fimSec = fimStr ? tempoParaSegundos(fimStr) : null;
  
  if (inicioSec !== null) {
    params.push(`start=${inicioSec}`);
  }
  
  if (fimSec !== null) {
    params.push(`end=${fimSec}`);
  }
  
  if (params.length > 0) {
    url += `?${params.join('&')}`;
  }
  
  return url;
}

/**
 * Gera a URL de incorporação do Instagram
 * @param videoUrl URL original do post do Instagram
 * @returns URL formatada para incorporação ou null se não for do Instagram
 */
export function gerarUrlInstagramEmbed(videoUrl: string): string | null {
  const postId = extrairInstagramId(videoUrl);
  if (!postId) return null;
  
  return `https://www.instagram.com/p/${postId}/embed`;
}
