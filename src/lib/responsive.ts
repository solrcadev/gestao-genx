import { useState, useEffect } from 'react';

// Breakpoints padrão (correspondendo aos do Tailwind)
export const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1400
};

type Breakpoint = keyof typeof breakpoints;

// Hook para verificar se a largura da tela está abaixo de um determinado breakpoint
export function useIsMobile(breakpoint: Breakpoint = 'md'): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < breakpoints[breakpoint]);
    };

    // Verificação inicial
    checkIsMobile();

    // Adicionar listener para redimensionamento
    window.addEventListener('resize', checkIsMobile);

    // Limpar listener
    return () => window.removeEventListener('resize', checkIsMobile);
  }, [breakpoint]);

  return isMobile;
}

// Hook para obter o tamanho atual da tela
export function useWindowSize() {
  const [windowSize, setWindowSize] = useState<{
    width: number | undefined;
    height: number | undefined;
  }>({
    width: undefined,
    height: undefined,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    
    // Adicionar listener
    window.addEventListener('resize', handleResize);
    
    // Chamar handler imediatamente para definir o tamanho inicial
    handleResize();
    
    // Limpar listener
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}

// Hook para obter o breakpoint atual
export function useBreakpoint(): Breakpoint {
  const { width } = useWindowSize();
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('xs');

  useEffect(() => {
    if (!width) return;

    if (width >= breakpoints['2xl']) {
      setBreakpoint('2xl');
    } else if (width >= breakpoints.xl) {
      setBreakpoint('xl');
    } else if (width >= breakpoints.lg) {
      setBreakpoint('lg');
    } else if (width >= breakpoints.md) {
      setBreakpoint('md');
    } else if (width >= breakpoints.sm) {
      setBreakpoint('sm');
    } else {
      setBreakpoint('xs');
    }
  }, [width]);

  return breakpoint;
}

// Componente adaptável baseado em breakpoint
export function getResponsiveValue<T>(
  values: Partial<Record<Breakpoint, T>>,
  currentBreakpoint: Breakpoint,
  defaultValue: T
): T {
  const breakpointOrder: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint);
  
  // Tentar encontrar o valor para o breakpoint atual
  if (values[currentBreakpoint] !== undefined) {
    return values[currentBreakpoint] as T;
  }
  
  // Caso contrário, procurar o valor mais próximo para um breakpoint menor
  for (let i = currentIndex - 1; i >= 0; i--) {
    const breakpoint = breakpointOrder[i];
    if (values[breakpoint] !== undefined) {
      return values[breakpoint] as T;
    }
  }
  
  // Se nada for encontrado, usar o valor padrão
  return defaultValue;
} 