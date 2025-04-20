
// Use the implementation from use-mobile.tsx that already exists
import { useIsMobile, useMediaQuery } from './use-mobile.tsx';

export { useIsMobile, useMediaQuery };
export const useDeviceInfo = () => ({
  isMobile: useIsMobile()
});

export default useIsMobile;
