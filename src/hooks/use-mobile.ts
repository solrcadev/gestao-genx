
import { useMediaQuery } from '@/components/ui/use-media-query';

export const useIsMobile = () => useMediaQuery('(max-width: 768px)');
export const useDeviceInfo = () => ({
  isMobile: useIsMobile()
});

export default useIsMobile;
