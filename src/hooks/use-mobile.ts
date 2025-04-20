
import { useState, useEffect } from 'react';

// Implement useMediaQuery here since the import doesn't exist
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    
    // Set initial value
    setMatches(mediaQuery.matches);
    
    // Define callback function
    const handleChange = () => setMatches(mediaQuery.matches);
    
    // Add listener
    mediaQuery.addEventListener('change', handleChange);
    
    // Clean up
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
}

export const useIsMobile = () => useMediaQuery('(max-width: 768px)');
export const useIsSmallScreen = () => useMediaQuery('(max-width: 640px)');

export const useDeviceInfo = () => ({
  isMobile: useIsMobile(),
  isSmallScreen: useIsSmallScreen(),
  orientation: typeof window !== 'undefined' ? 
    window.innerHeight > window.innerWidth ? 'portrait' : 'landscape' 
    : 'portrait'
});

export default useIsMobile;
