import { useState, useEffect } from 'react';

type DeviceOrientation = 'portrait' | 'landscape';

interface MobileState {
  isMobile: boolean;
  orientation: DeviceOrientation;
  isSmallScreen: boolean;
  isTouchDevice: boolean;
}

/**
 * Hook para detectar se o dispositivo é mobile, qual sua orientação,
 * e se possui recursos de toque.
 * 
 * @returns Objeto com informações sobre o dispositivo
 */
export function useIsMobile(): boolean {
  // Estado mais simples para retrocompatibilidade
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}

/**
 * Hook avançado para detectar características do dispositivo:
 * - Se é mobile (< 768px)
 * - Se é uma tela pequena (< 640px)
 * - Se tem interface de toque
 * - Qual a orientação da tela (retrato ou paisagem)
 * 
 * @returns Objeto com múltiplas propriedades sobre o dispositivo
 */
export function useDeviceInfo(): MobileState {
  const [deviceInfo, setDeviceInfo] = useState<MobileState>({
    isMobile: window.innerWidth < 768,
    isSmallScreen: window.innerWidth < 640,
    orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
    isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0
  });

  useEffect(() => {
    const handleResize = () => {
      setDeviceInfo({
        isMobile: window.innerWidth < 768,
        isSmallScreen: window.innerWidth < 640,
        orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
        isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return deviceInfo;
}

export default useIsMobile;

/**
 * Hook para obter a largura atual da tela
 * @returns Largura da tela em pixels
 */
export function useScreenWidth(): number {
  const [width, setWidth] = useState<number>(() => {
    // Em renderização SSR, retorna 0
    if (typeof window === 'undefined') return 0;
    
    return window.innerWidth;
  });
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      setWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return width;
} 